//! The background work the media service does when nobody is waiting.
//!
//! Thumbnails, trickplay sheets and fingerprinting all read whole files, and
//! all of them are worth doing eventually rather than now. Left unmanaged they
//! compete with the one thing that is urgent — the film somebody is watching —
//! and the machine loses. Everything of that kind goes through this queue, so
//! there is a fixed ceiling on how much of the machine background work can
//! take, and so an operator can see what it is doing rather than guessing from
//! a fan.

use std::collections::{HashMap, VecDeque};
use std::error::Error;
use std::future::Future;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tokio::sync::{watch, Mutex, Notify, OwnedSemaphorePermit, Semaphore};

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
    /// Whether work waiting in the queue is being held back rather than started.
    pub paused: bool,
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
    concurrency: Arc<AtomicUsize>,
    /// Whether waiting work is held back. Work already running is left to finish.
    paused: Arc<watch::Sender<bool>>,
    /// Work waiting to be told to go now, by its id, whatever the ceiling says.
    overrides: Arc<Mutex<HashMap<u64, Arc<Notify>>>>,
    /// Kinds of work that wait in a lane of their own rather than in the main
    /// one, by name.
    lanes: Arc<HashMap<String, Arc<Semaphore>>>,
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
            concurrency: Arc::new(AtomicUsize::new(concurrency)),
            paused: Arc::new(watch::channel(false).0),
            overrides: Arc::new(Mutex::new(HashMap::new())),
            lanes: Arc::new(HashMap::new()),
            jobs: Arc::new(Mutex::new(VecDeque::new())),
            next_id: Arc::new(AtomicU64::new(1)),
        }
    }

    /// Gives one kind of work a lane of its own, so it neither waits behind the
    /// main one nor crowds it.
    ///
    /// The ceiling on background work exists to keep it away from the film
    /// somebody is watching, and a render is what that ceiling is really about:
    /// it is minutes of the whole machine. Fingerprinting is an audio decode
    /// and some arithmetic, and holding the single slot that renders queue for
    /// means a library's worth of it runs strictly one file at a time — which
    /// is hours of a job nothing else is waiting on.
    ///
    /// Lanes are separate ceilings rather than a shared one, so a lane filling
    /// up delays only its own kind.
    #[must_use]
    pub fn with_lane(mut self, kind: &str, concurrency: usize) -> Self {
        let mut lanes = HashMap::clone(&self.lanes);

        lanes.insert(
            kind.to_owned(),
            Arc::new(Semaphore::new(concurrency.max(1))),
        );
        self.lanes = Arc::new(lanes);

        self
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

        let lane = self
            .lanes
            .get(job.kind())
            .map_or(&self.permits, |held| held);

        let go_now = Arc::new(Notify::new());

        self.overrides.lock().await.insert(id, Arc::clone(&go_now));

        let permit = self.wait_for_a_turn(lane, &go_now).await;

        self.overrides.lock().await.remove(&id);

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

    /// Waits until this work may start: not while the queue is paused, and then
    /// for a place under the ceiling — unless somebody has said to go now, in
    /// which case it starts at once and holds no place, since it was never
    /// given one.
    async fn wait_for_a_turn<'a>(
        &self,
        lane: &'a Arc<Semaphore>,
        go_now: &Notify,
    ) -> Option<tokio::sync::SemaphorePermit<'a>> {
        let mut paused = self.paused.subscribe();

        tokio::select! {
            () = go_now.notified() => return None,
            _ = paused.wait_for(|held| !*held) => {}
        }

        tokio::select! {
            () = go_now.notified() => None,
            permit = lane.acquire() => permit.ok(),
        }
    }

    /// How many pieces of work may run at once from now on.
    ///
    /// Raising it lets waiting work start at once. Lowering it takes effect as
    /// work finishes: what is already running is never cut short to make the
    /// number true, the extra places are simply not handed on again.
    pub fn set_concurrency(&self, concurrency: usize) {
        let wanted = concurrency.max(1);
        let before = self.concurrency.swap(wanted, Ordering::AcqRel);

        if wanted > before {
            self.permits.add_permits(wanted - before);
        } else if wanted < before {
            let permits = Arc::clone(&self.permits);
            let surplus = u32::try_from(before - wanted).unwrap_or(u32::MAX);

            tokio::spawn(async move {
                if let Ok(held) = permits.acquire_many(surplus).await {
                    held.forget();
                }
            });
        }
    }

    /// Holds every place but one until the returned guard is dropped.
    ///
    /// A render on a graphics chip competes for the same decode and encode
    /// engines as the film somebody is watching, and niceness answers only for
    /// the processor. So while anyone is watching, background work goes back to
    /// one at a time — which is what this queue ran unconditionally before it
    /// could be measured.
    ///
    /// Waits for work already running to finish rather than stopping it: the
    /// semaphore is fair, so nothing new starts in the places being held while
    /// this waits for them. The guard is ordinary permits, so a change of
    /// [`Self::set_concurrency`] while it is held settles when it is let go.
    /// `None` where there is only one place to begin with.
    pub async fn hold_all_but_one(&self) -> Option<OwnedSemaphorePermit> {
        let extra = self.concurrency.load(Ordering::Acquire).saturating_sub(1);
        let extra = u32::try_from(extra).ok().filter(|count| *count > 0)?;

        Arc::clone(&self.permits)
            .acquire_many_owned(extra)
            .await
            .ok()
    }

    /// How many pieces of work may run at once, as things stand.
    #[must_use]
    pub fn concurrency(&self) -> usize {
        self.concurrency.load(Ordering::Acquire)
    }

    /// Holds back work that has not started. Work already running finishes.
    pub fn pause(&self) {
        self.paused.send_replace(true);
    }

    /// Lets waiting work start again.
    pub fn resume(&self) {
        self.paused.send_replace(false);
    }

    /// Starts one waiting piece of work now, past both the ceiling and a pause.
    ///
    /// # Returns
    ///
    /// Whether there was such work still waiting to be told.
    pub async fn run_now(&self, id: u64) -> bool {
        let waiting = self.overrides.lock().await.get(&id).cloned();

        waiting.map(|go_now| go_now.notify_one()).is_some()
    }

    /// What the queue is doing and what it has recently done.
    pub async fn snapshot(&self) -> QueueSnapshot {
        let jobs = self.jobs.lock().await.iter().cloned().collect::<Vec<_>>();

        QueueSnapshot {
            concurrency: self.concurrency.load(Ordering::Acquire),
            paused: *self.paused.borrow(),
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

    fn fingerprints(subject: &'static str) -> TestJob {
        TestJob {
            kind: "fingerprint",
            subject,
        }
    }

    #[tokio::test]
    async fn a_lane_runs_its_own_kind_while_the_main_one_is_full() {
        let queue = WorkQueue::new(1).with_lane("fingerprint", 2);
        let render = queue.clone();
        let listening = queue.clone();

        let held = tokio::spawn(async move {
            render
                .run(thumbnails("a.mkv"), None, async {
                    tokio::time::sleep(Duration::from_millis(80)).await;

                    Ok::<(), std::io::Error>(())
                })
                .await
        });

        tokio::time::sleep(Duration::from_millis(10)).await;

        let listened = tokio::spawn(async move {
            listening
                .run(fingerprints("b.mkv"), None, async {
                    tokio::time::sleep(Duration::from_millis(20)).await;

                    Ok::<(), std::io::Error>(())
                })
                .await
        });

        tokio::time::sleep(Duration::from_millis(20)).await;

        let snapshot = queue.snapshot().await;
        let audio = snapshot
            .jobs
            .iter()
            .find(|job| job.subject == "b.mkv")
            .expect("recorded");

        assert_eq!(audio.state, JobState::Running);

        let _ = held.await;
        let _ = listened.await;
    }

    #[tokio::test]
    async fn a_lane_still_has_a_ceiling_of_its_own() {
        let queue = WorkQueue::new(4).with_lane("fingerprint", 1);
        let first = queue.clone();
        let second = queue.clone();

        let one = tokio::spawn(async move {
            first
                .run(fingerprints("a.mkv"), None, async {
                    tokio::time::sleep(Duration::from_millis(60)).await;

                    Ok::<(), std::io::Error>(())
                })
                .await
        });

        tokio::time::sleep(Duration::from_millis(10)).await;

        let two = tokio::spawn(async move {
            second
                .run(fingerprints("b.mkv"), None, async {
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
    async fn work_with_no_lane_of_its_own_waits_in_the_main_one() {
        let queue = WorkQueue::new(2).with_lane("fingerprint", 1);

        assert_eq!(queue.snapshot().await.concurrency, 2);
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

    /// Work that finishes when told to, so a test can hold places in the queue.
    async fn held_until(gate: tokio::sync::oneshot::Receiver<()>) -> Result<u8, std::io::Error> {
        let _ = gate.await;

        Ok(1)
    }

    async fn settle() {
        tokio::time::sleep(Duration::from_millis(40)).await;
    }

    #[tokio::test]
    async fn holds_waiting_work_while_paused_and_starts_it_on_resume() {
        let queue = WorkQueue::new(1);

        queue.pause();

        let waiting = tokio::spawn({
            let queue = queue.clone();

            async move {
                let outcome: Result<u8, std::io::Error> = queue
                    .run(thumbnails("film.mkv"), None, async { Ok(1) })
                    .await;

                outcome
            }
        });

        settle().await;

        let held = queue.snapshot().await;

        assert!(held.paused);
        assert_eq!(held.queued, 1, "paused work waits rather than starting");
        assert_eq!(held.running, 0);

        queue.resume();

        assert_eq!(waiting.await.expect("joined").expect("ran"), 1);
        assert!(!queue.snapshot().await.paused);
    }

    #[tokio::test]
    async fn lets_running_work_finish_while_paused() {
        let queue = WorkQueue::new(1);
        let (open, gate) = tokio::sync::oneshot::channel();

        let running = tokio::spawn({
            let queue = queue.clone();

            async move {
                queue
                    .run(thumbnails("film.mkv"), None, held_until(gate))
                    .await
            }
        });

        settle().await;
        queue.pause();
        let _ = open.send(());

        assert_eq!(running.await.expect("joined").expect("ran"), 1);
    }

    #[tokio::test]
    async fn starts_one_waiting_job_now_past_the_ceiling() {
        let queue = WorkQueue::new(1);
        let (open, gate) = tokio::sync::oneshot::channel();

        let first = tokio::spawn({
            let queue = queue.clone();

            async move {
                queue
                    .run(thumbnails("first.mkv"), None, held_until(gate))
                    .await
            }
        });

        settle().await;

        let second = tokio::spawn({
            let queue = queue.clone();

            async move {
                let outcome: Result<u8, std::io::Error> = queue
                    .run(thumbnails("second.mkv"), None, async { Ok(2) })
                    .await;

                outcome
            }
        });

        settle().await;

        assert_eq!(queue.snapshot().await.queued, 1);
        assert!(
            queue.run_now(2).await,
            "the second job was waiting to be told"
        );
        assert_eq!(second.await.expect("joined").expect("ran"), 2);
        assert_eq!(
            queue.snapshot().await.running,
            1,
            "the first is still holding its place: the second ran beside it"
        );

        let _ = open.send(());
        let _ = first.await;
    }

    #[tokio::test]
    async fn says_no_when_the_job_is_not_waiting() {
        let queue = WorkQueue::new(1);

        let _: Result<u8, std::io::Error> = queue
            .run(thumbnails("film.mkv"), None, async { Ok(1) })
            .await;

        assert!(!queue.run_now(1).await, "it has already run");
        assert!(!queue.run_now(99).await, "there never was such a job");
    }

    #[tokio::test]
    async fn starts_waiting_work_when_the_ceiling_is_raised() {
        let queue = WorkQueue::new(1);
        let (open_first, first_gate) = tokio::sync::oneshot::channel();
        let (open_second, second_gate) = tokio::sync::oneshot::channel();

        let first = tokio::spawn({
            let queue = queue.clone();

            async move {
                queue
                    .run(thumbnails("first.mkv"), None, held_until(first_gate))
                    .await
            }
        });
        let second = tokio::spawn({
            let queue = queue.clone();

            async move {
                queue
                    .run(thumbnails("second.mkv"), None, held_until(second_gate))
                    .await
            }
        });

        settle().await;

        let before = queue.snapshot().await;

        assert_eq!((before.running, before.queued), (1, 1));

        queue.set_concurrency(2);
        settle().await;

        let after = queue.snapshot().await;

        assert_eq!(after.concurrency, 2);
        assert_eq!((after.running, after.queued), (2, 0));

        let _ = open_first.send(());
        let _ = open_second.send(());
        let _ = first.await;
        let _ = second.await;
    }

    #[tokio::test]
    async fn never_runs_less_than_one_at_a_time() {
        let queue = WorkQueue::new(3);

        queue.set_concurrency(0);

        assert_eq!(queue.snapshot().await.concurrency, 1);
    }

    #[tokio::test]
    async fn holds_every_place_but_one_while_somebody_is_watching() {
        let queue = WorkQueue::new(3);
        let held = queue.hold_all_but_one().await;

        assert!(held.is_some());
        assert_eq!(queue.permits.available_permits(), 1);

        drop(held);
        assert_eq!(queue.permits.available_permits(), 3);
    }

    #[tokio::test]
    async fn holds_nothing_where_there_is_only_one_place() {
        let queue = WorkQueue::new(1);

        assert!(queue.hold_all_but_one().await.is_none());
        assert_eq!(queue.permits.available_permits(), 1);
    }

    /// Work already running finishes: the hold waits for it rather than
    /// stopping it, and nothing new takes the places it is waiting on.
    ///
    /// Three places, two renders running. Holding all but one needs two and
    /// only one is free, so the hold waits until a render finishes — leaving
    /// the other running in the one place kept for it.
    #[tokio::test]
    async fn waits_for_running_work_rather_than_stopping_it() {
        let queue = WorkQueue::new(3);
        let render = |finished: tokio::sync::oneshot::Receiver<()>| {
            let running = queue.clone();

            tokio::spawn(async move {
                running
                    .run(thumbnails("a film"), None, async move {
                        let _ = finished.await;
                        Ok::<(), std::io::Error>(())
                    })
                    .await
            })
        };

        let (finish_first, first_finished) = tokio::sync::oneshot::channel::<()>();
        let (finish_second, second_finished) = tokio::sync::oneshot::channel::<()>();
        let first = render(first_finished);
        let second = render(second_finished);

        tokio::time::sleep(Duration::from_millis(20)).await;
        assert_eq!(queue.permits.available_permits(), 1);

        let holding = queue.clone();
        let waiting = tokio::spawn(async move { holding.hold_all_but_one().await });

        tokio::time::sleep(Duration::from_millis(20)).await;
        assert!(!waiting.is_finished(), "the hold waits for a render to end");

        finish_first.send(()).expect("the first render is waiting");
        first
            .await
            .expect("joins")
            .expect("the first render finishes");

        let extra_places = waiting.await.expect("joins");

        assert!(extra_places.is_some());
        assert_eq!(queue.permits.available_permits(), 0);
        assert!(!second.is_finished(), "the other render is left running");

        finish_second
            .send(())
            .expect("the second render is waiting");
        second
            .await
            .expect("joins")
            .expect("the second render finishes");
        drop(extra_places);
        assert_eq!(queue.permits.available_permits(), 3);
    }

    /// Lowering the ceiling while places are held is settled when they are let
    /// go: the held permits pass to the change rather than back into use.
    #[tokio::test]
    async fn settles_a_lowered_ceiling_once_the_hold_is_let_go() {
        let queue = WorkQueue::new(3);
        let held = queue.hold_all_but_one().await;

        queue.set_concurrency(1);
        drop(held);
        tokio::time::sleep(Duration::from_millis(20)).await;

        assert_eq!(queue.concurrency(), 1);
        assert_eq!(queue.permits.available_permits(), 1);
    }
}
