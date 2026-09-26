//! Keeping track of the renders that are under way, and of why one failed.

use std::collections::{HashMap, VecDeque};
use std::sync::Arc;

use tokio::sync::{watch, Mutex};

/// How many stopped jobs are remembered, so their stragglers are turned away.
const STOPPED_JOBS_KEPT: usize = 64;

/// The switch a render in the background watches, and which job it is for.
struct Switch {
    correlation_id: Option<String>,
    stop: watch::Sender<bool>,
}

/// Finishes when the render it was handed with is told to stop, and never
/// otherwise.
pub struct StopSignal(watch::Receiver<bool>);

/// A render taken to be drawn: its address, and the signal that says when to
/// give it up.
pub struct Claim {
    pub id: String,
    pub stop: StopSignal,
}

impl StopSignal {
    /// Waits until the render is told to stop.
    ///
    /// A switch that goes away without being thrown belongs to a render that
    /// has been let go of, which is not a reason to stop anything, so that
    /// waits for ever rather than answering.
    pub async fn stopped(mut self) {
        if self.0.wait_for(|stop| *stop).await.is_err() {
            std::future::pending::<()>().await;
        }
    }
}

/// What is being drawn right now, and what went wrong the last time it was.
///
/// Shared by previews and by thumbnail sheets, which had a copy each. The two
/// copies drifted — sheets grew the ability to remember a failure and clips
/// never did, so a clip that failed in the background had nobody to tell and
/// whoever asked next started the same doomed render again.
#[derive(Clone, Default)]
pub struct RenderRegistry {
    in_flight: Arc<Mutex<HashMap<String, Arc<Mutex<()>>>>>,
    failures: Arc<Mutex<HashMap<String, String>>>,
    switches: Arc<Mutex<HashMap<String, Switch>>>,
    stopped_jobs: Arc<Mutex<VecDeque<String>>>,
}

impl RenderRegistry {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// The lock for one address, so two callers draw it once between them.
    pub async fn gate(&self, id: &str) -> Arc<Mutex<()>> {
        let mut in_flight = self.in_flight.lock().await;

        Arc::clone(in_flight.entry(id.to_owned()).or_default())
    }

    /// Takes this render, unless something already has.
    ///
    /// A caller that means to draw in the background has to say so before it
    /// spawns anything, because the work sits in a queue before it begins and
    /// nothing is marked as under way until it does. Without this, every ask
    /// while a long render was still queued started another one: a 4K remux
    /// asked about every five seconds gathered fourteen jobs for one film.
    ///
    /// The caller that is told yes owns the release, and is handed the signal
    /// that says when to give the render up. `correlation_id` is the server's
    /// job that asked, so stopping that job reaches this render.
    pub async fn claim(&self, id: &str, correlation_id: Option<&str>) -> Option<Claim> {
        let mut in_flight = self.in_flight.lock().await;

        if in_flight.contains_key(id) {
            return None;
        }

        in_flight.insert(id.to_owned(), Arc::default());

        let (stop, signal) = watch::channel(false);

        self.switches.lock().await.insert(
            id.to_owned(),
            Switch {
                correlation_id: correlation_id.map(str::to_owned),
                stop,
            },
        );

        Some(Claim {
            id: id.to_owned(),
            stop: StopSignal(signal),
        })
    }

    /// Stops the render of one address, where one is under way.
    ///
    /// # Returns
    ///
    /// Whether there was one to stop.
    pub async fn stop(&self, id: &str) -> bool {
        self.switches
            .lock()
            .await
            .get(id)
            .is_some_and(|switch| switch.stop.send(true).is_ok())
    }

    /// Stops every render one of the server's jobs asked for, and turns away
    /// any it asks for afterwards.
    ///
    /// The server stops asking when its job is stopped, but an ask already on
    /// the wire arrives after the stop and would start a fresh render — so the
    /// job is remembered, for as long as a handful of other stops.
    ///
    /// # Returns
    ///
    /// How many renders were stopped.
    pub async fn stop_job(&self, correlation_id: &str) -> usize {
        {
            let mut stopped = self.stopped_jobs.lock().await;

            if !stopped.iter().any(|held| held == correlation_id) {
                stopped.push_front(correlation_id.to_owned());
                stopped.truncate(STOPPED_JOBS_KEPT);
            }
        }

        self.switches
            .lock()
            .await
            .values()
            .filter(|switch| switch.correlation_id.as_deref() == Some(correlation_id))
            .filter(|switch| switch.stop.send(true).is_ok())
            .count()
    }

    /// Whether one of the server's jobs has been stopped.
    pub async fn is_job_stopped(&self, correlation_id: &str) -> bool {
        self.stopped_jobs
            .lock()
            .await
            .iter()
            .any(|held| held == correlation_id)
    }

    /// Whether the render of one address is still under way.
    pub async fn is_claimed(&self, id: &str) -> bool {
        self.in_flight.lock().await.contains_key(id)
    }

    /// Remembers that a render failed, for whoever asks next.
    ///
    /// A render that fails in the background has nobody to tell. Without this
    /// the next ask finds no claim and nothing drawn, starts another render,
    /// and fails the same way for ever — which is what a deadline used to stand
    /// in for. Kept until it is read so the answer reaches whoever asks next,
    /// and cleared by reading so a later ask is free to try again.
    pub async fn remember_failure(&self, id: &str, reason: String) {
        self.failures.lock().await.insert(id.to_owned(), reason);
    }

    /// Takes what went wrong, where anything did, and forgets it.
    pub async fn take_failure(&self, id: &str) -> Option<String> {
        self.failures.lock().await.remove(id)
    }

    /// Lets go of a claim whose work never ran.
    ///
    /// A render releases its own claim when it finishes, so this is only
    /// reached where the work was dropped before it began — a queue shut down
    /// mid-render, say. Without it the claim would outlive the process's
    /// interest in it and that film could never be asked for again.
    pub async fn give_up(&self, id: &str) {
        self.release(id).await;
    }

    /// Lets go of an address once nobody else is holding its gate.
    pub async fn release(&self, id: &str) {
        let mut in_flight = self.in_flight.lock().await;

        if in_flight
            .get(id)
            .is_some_and(|gate| Arc::strong_count(gate) <= 2)
        {
            in_flight.remove(id);
            self.switches.lock().await.remove(id);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::RenderRegistry;

    #[tokio::test]
    async fn lets_the_first_caller_take_a_render_and_turns_the_second_away() {
        let registry = RenderRegistry::new();

        assert!(registry.claim("abc", None).await.is_some());
        assert!(registry.claim("abc", None).await.is_none());
    }

    #[tokio::test]
    async fn frees_an_address_once_the_claim_is_given_up() {
        let registry = RenderRegistry::new();

        assert!(registry.claim("abc", None).await.is_some());
        registry.give_up("abc").await;
        assert!(
            registry.claim("abc", None).await.is_some(),
            "it should be free again"
        );
    }

    /// Kept until read, so the answer reaches whoever asks next.
    #[tokio::test]
    async fn hands_a_failure_to_the_next_asker_and_forgets_it() {
        let registry = RenderRegistry::new();

        registry
            .remember_failure("abc", "that file has no video stream".to_owned())
            .await;

        assert_eq!(
            registry.take_failure("abc").await.as_deref(),
            Some("that file has no video stream")
        );
        assert_eq!(
            registry.take_failure("abc").await,
            None,
            "reading clears it"
        );
    }

    #[tokio::test]
    async fn keeps_one_address_apart_from_another() {
        let registry = RenderRegistry::new();

        registry.remember_failure("abc", "broke".to_owned()).await;

        assert_eq!(registry.take_failure("def").await, None);
        assert!(registry.claim("def", None).await.is_some());
    }

    const SOON: std::time::Duration = std::time::Duration::from_secs(1);
    const A_MOMENT: std::time::Duration = std::time::Duration::from_millis(50);

    #[tokio::test]
    async fn stops_every_render_one_job_asked_for_and_no_other() {
        let registry = RenderRegistry::new();

        let first = registry
            .claim("abc", Some("job-1"))
            .await
            .expect("free")
            .stop;
        let second = registry
            .claim("def", Some("job-1"))
            .await
            .expect("free")
            .stop;
        let other = registry
            .claim("ghi", Some("job-2"))
            .await
            .expect("free")
            .stop;

        assert_eq!(registry.stop_job("job-1").await, 2);

        tokio::time::timeout(SOON, first.stopped())
            .await
            .expect("a render the stopped job asked for stops");
        tokio::time::timeout(SOON, second.stopped())
            .await
            .expect("a render the stopped job asked for stops");
        assert!(
            tokio::time::timeout(A_MOMENT, other.stopped())
                .await
                .is_err(),
            "another job's render keeps going"
        );
    }

    #[tokio::test]
    async fn remembers_a_stopped_job_so_its_stragglers_are_turned_away() {
        let registry = RenderRegistry::new();

        registry.stop_job("job-1").await;

        assert!(registry.is_job_stopped("job-1").await);
        assert!(!registry.is_job_stopped("job-2").await);
    }

    #[tokio::test]
    async fn stops_one_render_by_its_address() {
        let registry = RenderRegistry::new();
        let signal = registry.claim("abc", None).await.expect("free").stop;

        assert!(registry.stop("abc").await);
        assert!(!registry.stop("def").await, "nothing is drawing that");

        tokio::time::timeout(SOON, signal.stopped())
            .await
            .expect("the render is told to stop");
    }

    #[tokio::test]
    async fn a_render_let_go_of_is_not_told_to_stop() {
        let registry = RenderRegistry::new();
        let signal = registry.claim("abc", None).await.expect("free").stop;

        registry.give_up("abc").await;

        assert!(
            tokio::time::timeout(A_MOMENT, signal.stopped())
                .await
                .is_err(),
            "letting go is not a stop"
        );
        assert!(!registry.is_claimed("abc").await);
    }
}
