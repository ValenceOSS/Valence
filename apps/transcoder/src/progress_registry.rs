//! What long work is under way, how far through it is, and why the last attempt failed.
//!
//! Anything that runs for minutes and is asked about every few seconds needs this, and for the same
//! reason each time: without a claim taken before anything is spawned, the asking is what starts the
//! work, over and over. A 4K remux asked about every five seconds gathered fourteen encodes of
//! itself before previews grew the same guard.
//!
//! The failure outlives the claim on purpose. Work that fails in the background has nobody to tell,
//! so without somewhere to leave the reason the next ask finds no claim and nothing on disk, starts
//! again, and fails the same way for ever. It is cleared by being read, so a later ask is free to
//! try again.

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use tokio::sync::Mutex;

#[derive(Default)]
struct InFlight {
    progress: u8,
    bytes_per_second: Option<u64>,
    stop: Arc<AtomicBool>,
}

/// Keeps one piece of work per address, however many people ask for it, holds the switch that stops
/// each one, and remembers why the last one failed.
#[derive(Clone, Default)]
pub struct ProgressRegistry {
    in_flight: Arc<Mutex<HashMap<String, InFlight>>>,
    failures: Arc<Mutex<HashMap<String, String>>>,
}

impl ProgressRegistry {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Takes this work on, unless something already has.
    ///
    /// The caller that is told yes owns the release.
    pub async fn claim(&self, id: &str) -> bool {
        let mut in_flight = self.in_flight.lock().await;

        if in_flight.contains_key(id) {
            return false;
        }

        in_flight.insert(id.to_owned(), InFlight::default());

        true
    }

    /// Whether something is working on this now.
    pub async fn is_claimed(&self, id: &str) -> bool {
        self.in_flight.lock().await.contains_key(id)
    }

    /// The switch that stops this work, for whoever is running it.
    pub async fn stopper(&self, id: &str) -> Arc<AtomicBool> {
        self.in_flight
            .lock()
            .await
            .get(id)
            .map_or_else(Arc::default, |held| Arc::clone(&held.stop))
    }

    /// Asks running work to stop where it is.
    pub async fn stop(&self, id: &str) -> bool {
        let in_flight = self.in_flight.lock().await;

        let Some(held) = in_flight.get(id) else {
            return false;
        };

        held.stop.store(true, Ordering::Relaxed);

        true
    }

    /// Records how far through claimed work is, and how fast it is going.
    pub async fn note(&self, id: &str, progress: u8, bytes_per_second: Option<u64>) {
        let mut in_flight = self.in_flight.lock().await;

        if let Some(held) = in_flight.get_mut(id) {
            held.progress = progress;
            held.bytes_per_second = bytes_per_second;
        }
    }

    /// How far through the work is and how fast, where any is under way.
    pub async fn progress(&self, id: &str) -> Option<(u8, Option<u64>)> {
        self.in_flight
            .lock()
            .await
            .get(id)
            .map(|held| (held.progress, held.bytes_per_second))
    }

    /// Remembers why this failed, for whoever asks next.
    pub async fn fail(&self, id: &str, reason: impl Into<String>) {
        self.failures
            .lock()
            .await
            .insert(id.to_owned(), reason.into());
    }

    /// Why this last failed, taking the answer so a later ask is free to try again.
    pub async fn failure(&self, id: &str) -> Option<String> {
        self.failures.lock().await.remove(id)
    }

    /// Lets go of the work, whether it finished or failed.
    pub async fn release(&self, id: &str) {
        self.in_flight.lock().await.remove(id);
    }
}

#[cfg(test)]
mod tests {
    use super::ProgressRegistry;
    use std::sync::atomic::Ordering;

    #[tokio::test]
    async fn claims_once_and_refuses_the_second_asker() {
        let registry = ProgressRegistry::new();

        assert!(registry.claim("one").await);
        assert!(!registry.claim("one").await);
    }

    #[tokio::test]
    async fn frees_the_address_when_the_work_lets_go() {
        let registry = ProgressRegistry::new();

        assert!(registry.claim("one").await);
        registry.release("one").await;

        assert!(registry.claim("one").await);
    }

    #[tokio::test]
    async fn flips_the_switch_the_worker_is_watching() {
        let registry = ProgressRegistry::new();

        registry.claim("one").await;

        let stop = registry.stopper("one").await;

        assert!(!stop.load(Ordering::Relaxed));
        assert!(registry.stop("one").await);
        assert!(stop.load(Ordering::Relaxed));
    }

    #[tokio::test]
    async fn says_nothing_about_work_nobody_took_on() {
        let registry = ProgressRegistry::new();

        assert!(!registry.stop("one").await);
        assert!(registry.progress("one").await.is_none());
        assert!(!registry.is_claimed("one").await);
    }

    #[tokio::test]
    async fn remembers_how_far_through_claimed_work_is() {
        let registry = ProgressRegistry::new();

        registry.claim("one").await;
        registry.note("one", 40, Some(8_000_000)).await;

        assert_eq!(registry.progress("one").await, Some((40, Some(8_000_000))));
    }

    #[tokio::test]
    async fn keeps_a_failure_past_the_claim_that_produced_it() {
        let registry = ProgressRegistry::new();

        registry.claim("one").await;
        registry.fail("one", "the file would not decode").await;
        registry.release("one").await;

        assert_eq!(
            registry.failure("one").await.as_deref(),
            Some("the file would not decode")
        );
    }

    #[tokio::test]
    async fn gives_up_a_failure_once_it_has_been_read() {
        let registry = ProgressRegistry::new();

        registry.fail("one", "no").await;

        assert!(registry.failure("one").await.is_some());
        assert!(registry.failure("one").await.is_none());
    }
}
