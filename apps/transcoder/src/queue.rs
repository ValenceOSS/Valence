//! The background work the media service does when nobody is waiting.
//!
//! Thumbnails, trickplay sheets and fingerprinting all read whole files, and
//! all of them are worth doing eventually rather than now. Left unmanaged they
//! compete with the one thing that is urgent — the film somebody is watching —
//! and the machine loses. Everything of that kind goes through this queue, so
//! there is a fixed ceiling on how much of the machine background work can
//! take, and so an operator can see what it is doing rather than guessing from
//! a fan.

use std::collections::VecDeque;
use std::error::Error;
use std::future::Future;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tokio::sync::{Mutex, Semaphore};

/// How many finished items are remembered.
///
/// Enough to see what a scan did, small enough that the memory cost is
/// irrelevant. This is a window on recent work, not an audit log.
const HISTORY: usize = 200;

/// Where a piece of work has got to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum JobState {
    /// Waiting for a slot.
    Queued,
    /// Running now.
    Running,
    /// Done, and it worked.
    Finished,
    /// Done, and it did not.
    Failed,
}

/// What a piece of work is, for the queue's own bookkeeping.
///
/// Every work kind constructs one of these rather than handing the queue a
/// bare `kind: &str, subject: &str` pair at the call site — the kind is fixed
/// by the type, and the subject is computed once, in one place, by whoever
/// knows what it is.
pub trait Job {
    /// What kind of work this is: thumbnails, preview, fingerprint.
    fn kind(&self) -> &'static str;
    /// What it is being done to, in a form a person recognises.
    fn subject(&self) -> String;
}

/// Why a piece of background work failed.
///
/// The message a caller would read plus the chain of causes underneath it,
/// so an operator sees "ffmpeg could not be started" and, if there is one,
/// the "No such file or directory" that actually explains it — rather than
/// the top message alone with everything under it thrown away.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobFailure {
    pub message: String,
    pub chain: Vec<String>,
}

impl JobFailure {
    /// Builds a failure by walking an error's own [`Error::source`] chain.
    fn from_error<E: Error>(error: &E) -> Self {
        let mut chain = Vec::new();
        let mut source = error.source();

        while let Some(cause) = source {
            chain.push(cause.to_string());
            source = cause.source();
        }

        Self {
            message: error.to_string(),
            chain,
        }
    }
}

/// One piece of background work, as the queue remembers having run it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JobRecord {
    pub id: u64,
    /// What kind of work this is: thumbnails, preview, fingerprint.
    pub kind: String,
    /// What it is being done to, in a form a person recognises.
    pub subject: String,
    pub state: JobState,
    pub queued_at_ms: u64,
    pub started_at_ms: Option<u64>,
    pub finished_at_ms: Option<u64>,
    /// Why it failed, when it did.
    pub failure: Option<JobFailure>,
    /// Which of the server's jobs asked for this, where one did.
    ///
    /// The queue is otherwise flat: a job per file per artefact, with nothing
    /// saying which scan set it going. Reading a run of thumbnails back to the
    /// rebuild that caused them meant lining timestamps up by eye. A player
    /// asking for its own thumbnails belongs to nobody, which is why this is
    /// optional rather than empty.
    pub correlation_id: Option<String>,
}

impl JobRecord {
    /// How long this has taken, in milliseconds.
    ///
    /// Measured to now while it is still running, so a job that has hung reads
    /// as a growing number rather than as nothing at all.
    #[must_use]
    pub fn elapsed_ms(&self, now_ms: u64) -> Option<u64> {
        let started = self.started_at_ms?;

        Some(
            self.finished_at_ms
                .unwrap_or(now_ms)
                .saturating_sub(started),
        )
    }
}

/// What the queue looks like right now.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueSnapshot {
    /// How many may run at once.
    pub concurrency: usize,
    pub queued: usize,
    pub running: usize,
    /// Recent work, newest first.
    pub jobs: Vec<JobRecord>,
}

/// Milliseconds since the epoch.
#[must_use]
pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |since| {
            u64::try_from(since.as_millis()).unwrap_or(u64::MAX)
        })
}

/// Settles a job whose work is dropped before it finishes.
///
/// `run` marks a job finished on the line after the work completes, which never
/// runs if the future is dropped instead — and an HTTP handler is dropped the
/// moment its caller goes away. A thumbnails job was found sitting at
/// `running` for three hours after the request that asked for it timed out,
/// while later renders of the same film took a minute each. It cost nothing but
/// the truth: the slot is freed with the permit either way. Still, a queue that
/// says something is running when nothing is doing it is a queue nobody can
/// read. See VAL-145.
///
/// The work is settled from a spawned task because a drop cannot await. Where
/// there is no runtime left to spawn onto — the process is going away — there
/// is nobody to mislead either.
struct Abandonment {
    jobs: Arc<Mutex<VecDeque<JobRecord>>>,
    id: u64,
    settled: bool,
}

impl Drop for Abandonment {
    fn drop(&mut self) {
        if self.settled {
            return;
        }

        let jobs = Arc::clone(&self.jobs);
        let id = self.id;

        if let Ok(handle) = tokio::runtime::Handle::try_current() {
            handle.spawn(async move {
                let mut jobs = jobs.lock().await;

                if let Some(job) = jobs.iter_mut().find(|job| job.id == id) {
                    if job.finished_at_ms.is_none() {
                        job.finished_at_ms = Some(now_ms());
                        job.state = JobState::Failed;
                        job.failure = Some(JobFailure {
                            message: "nobody was left waiting for it".to_owned(),
                            chain: Vec::new(),
                        });
                    }
                }
            });
        }
    }
}

/// A bounded queue of background work.
///
/// Cloning shares the same queue, which is what lets the router hand it to
/// every handler without threading a reference through everything.
#[derive(Clone)]
pub struct WorkQueue {
    permits: Arc<Semaphore>,
    concurrency: usize,
    jobs: Arc<Mutex<VecDeque<JobRecord>>>,
    next_id: Arc<AtomicU64>,
}

impl WorkQueue {
    /// A queue that will run `concurrency` pieces of work at once.
    ///
    /// One is the right answer on a machine that is also serving video. More
    /// than that only finishes the background work sooner, which nobody asked
    /// for.
    #[must_use]
    pub fn new(concurrency: usize) -> Self {
        let concurrency = concurrency.max(1);

        Self {
            permits: Arc::new(Semaphore::new(concurrency)),
            concurrency,
            jobs: Arc::new(Mutex::new(VecDeque::new())),
            next_id: Arc::new(AtomicU64::new(1)),
        }
    }

    async fn record(&self, job: JobRecord) {
        let mut jobs = self.jobs.lock().await;

        jobs.push_front(job);
        jobs.truncate(HISTORY);
    }

    async fn amend(&self, id: u64, change: impl FnOnce(&mut JobRecord)) {
        let mut jobs = self.jobs.lock().await;

        if let Some(job) = jobs.iter_mut().find(|job| job.id == id) {
            change(job);
        }
    }

    /// Runs a piece of work when there is room for it.
    ///
    /// The caller still awaits its own result, so this changes when the work
    /// happens rather than how it is asked for. `job` says what kind of work
    /// this is and what it is being done to; `correlation_id` says which of
    /// the server's own jobs asked for it, where one did.
    ///
    /// # Errors
    ///
    /// Whatever the work itself failed with, unchanged. The failure is written
    /// into the job's history on the way past: the queue observes, it does not
    /// swallow.
    pub async fn run<J, T, E, F>(
        &self,
        job: J,
        correlation_id: Option<&str>,
        work: F,
    ) -> Result<T, E>
    where
        J: Job,
        F: Future<Output = Result<T, E>>,
        E: Error,
    {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed);

        self.record(JobRecord {
            id,
            kind: job.kind().to_owned(),
            subject: job.subject(),
            state: JobState::Queued,
            queued_at_ms: now_ms(),
            started_at_ms: None,
            finished_at_ms: None,
            failure: None,
            correlation_id: correlation_id.map(str::to_owned),
        })
        .await;

        let permit = self.permits.acquire().await;

        self.amend(id, |job| {
            job.state = JobState::Running;
            job.started_at_ms = Some(now_ms());
        })
        .await;

        let mut abandonment = Abandonment {
            jobs: Arc::clone(&self.jobs),
            id,
            settled: false,
        };

        let outcome = work.await;

        abandonment.settled = true;

        self.amend(id, |job| {
            job.finished_at_ms = Some(now_ms());

            match &outcome {
                Ok(_) => job.state = JobState::Finished,
                Err(failure) => {
                    job.state = JobState::Failed;
                    job.failure = Some(JobFailure::from_error(failure));
                }
            }
        })
        .await;

        drop(permit);

        outcome
    }

    /// What the queue is doing and what it has recently done.
    pub async fn snapshot(&self) -> QueueSnapshot {
        let jobs = self.jobs.lock().await.iter().cloned().collect::<Vec<_>>();

        QueueSnapshot {
            concurrency: self.concurrency,
            queued: jobs
                .iter()
                .filter(|job| job.state == JobState::Queued)
                .count(),
            running: jobs
                .iter()
                .filter(|job| job.state == JobState::Running)
                .count(),
            jobs,
        }
    }
}

impl Default for WorkQueue {
    fn default() -> Self {
        Self::new(1)
    }
}

#[cfg(test)]
mod tests {
    use super::{Job, JobState, WorkQueue};
    use std::time::Duration;

    /// A fixed piece of work, for tests that only care about the queue's own
    /// bookkeeping and not about what a real work kind computes.
    struct TestJob {
        kind: &'static str,
        subject: &'static str,
    }

    impl Job for TestJob {
        fn kind(&self) -> &'static str {
            self.kind
        }

        fn subject(&self) -> String {
            self.subject.to_owned()
        }
    }

    fn thumbnails(subject: &'static str) -> TestJob {
        TestJob {
            kind: "thumbnails",
            subject,
        }
    }

    #[tokio::test]
    async fn says_which_job_asked_for_a_piece_of_work() {
        let queue = WorkQueue::new(2);

        let _: Result<u8, std::io::Error> = queue
            .run(thumbnails("film.mkv"), Some("scan-42"), async { Ok(1) })
            .await;
        let _: Result<u8, std::io::Error> = queue
            .run(thumbnails("other.mkv"), None, async { Ok(1) })
            .await;

        let correlations: Vec<Option<String>> = queue
            .snapshot()
            .await
            .jobs
            .iter()
            .map(|job| job.correlation_id.clone())
            .collect();

        assert!(
            correlations.contains(&Some("scan-42".to_owned())),
            "reading a run of thumbnails back to the scan that caused them otherwise means lining \
timestamps up by eye"
        );
        assert!(
            correlations.contains(&None),
            "a player asking for its own thumbnails belongs to nobody"
        );
    }

    #[tokio::test]
    async fn records_work_that_succeeded() {
        let queue = WorkQueue::new(1);

        let outcome: Result<u8, std::io::Error> = queue
            .run(thumbnails("film.mkv"), None, async { Ok(7) })
            .await;

        assert_eq!(outcome.expect("the work succeeded"), 7);

        let snapshot = queue.snapshot().await;

        assert_eq!(snapshot.jobs.len(), 1);
        assert_eq!(snapshot.jobs[0].state, JobState::Finished);
        assert_eq!(snapshot.jobs[0].subject, "film.mkv");
    }

    #[tokio::test]
    async fn keeps_the_reason_a_job_failed() {
        let queue = WorkQueue::new(1);

        let outcome: Result<(), std::io::Error> = queue
            .run(thumbnails("film.mkv"), None, async {
                Err(std::io::Error::other("no such file"))
            })
            .await;

        assert!(outcome.is_err());

        let snapshot = queue.snapshot().await;

        assert_eq!(snapshot.jobs[0].state, JobState::Failed);
        assert_eq!(
            snapshot.jobs[0]
                .failure
                .as_ref()
                .map(|failure| failure.message.as_str()),
            Some("no such file")
        );
    }

    /// The chain behind a failure is walked all the way down, not just the
    /// message at the top of it.
    #[tokio::test]
    async fn captures_the_chain_of_causes_behind_a_failure() {
        #[derive(Debug)]
        struct RootCause;

        impl std::fmt::Display for RootCause {
            fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(formatter, "no such file or directory")
            }
        }

        impl std::error::Error for RootCause {}

        #[derive(Debug)]
        struct WrappedFailure(RootCause);

        impl std::fmt::Display for WrappedFailure {
            fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(formatter, "could not start ffmpeg")
            }
        }

        impl std::error::Error for WrappedFailure {
            fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
                Some(&self.0)
            }
        }

        let queue = WorkQueue::new(1);

        let outcome: Result<(), WrappedFailure> = queue
            .run(thumbnails("film.mkv"), None, async {
                Err(WrappedFailure(RootCause))
            })
            .await;

        assert!(outcome.is_err());

        let snapshot = queue.snapshot().await;
        let failure = snapshot.jobs[0].failure.as_ref().expect("a failure");

        assert_eq!(failure.message, "could not start ffmpeg");
        assert_eq!(failure.chain, vec!["no such file or directory".to_owned()]);
    }

    #[tokio::test]
    async fn runs_no_more_at_once_than_it_was_told_to() {
        let queue = WorkQueue::new(1);
        let first = queue.clone();
        let second = queue.clone();

        let one = tokio::spawn(async move {
            first
                .run(thumbnails("a.mkv"), None, async {
                    tokio::time::sleep(Duration::from_millis(60)).await;

                    Ok::<(), std::io::Error>(())
                })
                .await
        });

        tokio::time::sleep(Duration::from_millis(10)).await;

        let two = tokio::spawn(async move {
            second
                .run(thumbnails("b.mkv"), None, async {
                    Ok::<(), std::io::Error>(())
                })
                .await
        });

        tokio::time::sleep(Duration::from_millis(20)).await;

        let snapshot = queue.snapshot().await;
        let waiting = snapshot
            .jobs
            .iter()
            .find(|job| job.subject == "b.mkv")
            .expect("queued");

        assert_eq!(waiting.state, JobState::Queued);

        let _ = one.await;
        let _ = two.await;
    }

    #[tokio::test]
    async fn counts_what_is_waiting_and_what_is_running() {
        let queue = WorkQueue::new(2);

        let outcome: Result<(), std::io::Error> = queue
            .run(
                TestJob {
                    kind: "trickplay",
                    subject: "a.mkv",
                },
                None,
                async { Ok(()) },
            )
            .await;

        assert!(outcome.is_ok());

        let snapshot = queue.snapshot().await;

        assert_eq!(snapshot.concurrency, 2);
        assert_eq!(snapshot.queued, 0);
        assert_eq!(snapshot.running, 0);
    }

    /// A job whose caller went away must not sit at running for ever.
    ///
    /// Found on a real one: a thumbnails render for a sixty gigabyte remux
    /// stayed running for three hours after the request timed out, while two
    /// later renders of the same film finished in a minute each.
    #[tokio::test]
    async fn settles_a_job_whose_caller_went_away() {
        let queue = WorkQueue::new(2);
        let running = queue.clone();

        let handle = tokio::spawn(async move {
            let _ = running
                .run(
                    thumbnails("film.mkv"),
                    None,
                    std::future::pending::<Result<u8, std::io::Error>>(),
                )
                .await;
        });

        while !queue
            .snapshot()
            .await
            .jobs
            .iter()
            .any(|job| job.state == JobState::Running)
        {
            tokio::task::yield_now().await;
        }

        handle.abort();

        for _ in 0..1_000 {
            if queue
                .snapshot()
                .await
                .jobs
                .iter()
                .all(|job| job.state != JobState::Running)
            {
                break;
            }

            tokio::task::yield_now().await;
        }

        let settled = queue.snapshot().await;

        assert!(settled
            .jobs
            .iter()
            .all(|job| job.state != JobState::Running));
        assert!(settled.jobs.iter().all(|job| job.finished_at_ms.is_some()));
    }
}
