//! Where this app's background work runs.

use std::future::Future;

use tokio::runtime::Handle;
use tokio::task::JoinHandle;

/// The runtime to run background work on: the one this is called from, or else Tauri's own.
#[must_use]
pub fn handle() -> Handle {
    Handle::try_current().unwrap_or_else(|_| tauri::async_runtime::handle().inner().clone())
}

/// Runs `work` in the background, on the runtime [`handle`] gives.
pub fn spawn<F>(work: F) -> JoinHandle<F::Output>
where
    F: Future + Send + 'static,
    F::Output: Send + 'static,
{
    handle().spawn(work)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn runs_work_without_a_runtime_of_its_own() {
        let answer = tauri::async_runtime::block_on(spawn(async { 2 + 2 }));

        assert_eq!(answer.ok(), Some(4));
    }

    #[tokio::test]
    async fn runs_work_on_the_runtime_it_is_called_from() {
        assert_eq!(spawn(async { 3 }).await.ok(), Some(3));
    }
}
