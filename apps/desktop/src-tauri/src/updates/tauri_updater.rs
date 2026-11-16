//! Tauri's updater, as what follows the updates sees it.

use crate::updates::follow::Updater;
use std::sync::{Mutex, PoisonError};
use tauri::{AppHandle, Manager, Url};
use tauri_plugin_updater::{Update, UpdaterExt};

/// Looks for a release on one feed, fetches it, and installs it.
pub struct TauriUpdater {
    app: AppHandle,
    feed: Url,
    found: Mutex<Option<Update>>,
    fetched: Mutex<Option<Vec<u8>>>,
}

impl TauriUpdater {
    /// The updater, looking at a feed.
    #[must_use]
    pub fn new(app: AppHandle, feed: Url) -> Self {
        Self {
            app,
            feed,
            found: Mutex::new(None),
            fetched: Mutex::new(None),
        }
    }

    /// Brings the main window back and takes the update windows away, after an install that
    /// failed, so the app is not left hidden behind a window that says it is installing.
    fn come_back(&self) {
        for (label, window) in self.app.webview_windows() {
            if label == super::MAIN_WINDOW {
                let _ = window.show();
            } else if label.starts_with("update-") {
                let _ = window.close();
            }
        }
    }

    /// The release last found.
    fn found(&self) -> Option<Update> {
        self.found
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .clone()
    }
}

impl Updater for TauriUpdater {
    async fn check(&self) -> Result<Option<String>, String> {
        let updater = self
            .app
            .updater_builder()
            .endpoints(vec![self.feed.clone()])
            .and_then(tauri_plugin_updater::UpdaterBuilder::build)
            .map_err(|error| error.to_string())?;
        let found = updater.check().await.map_err(|error| error.to_string())?;
        let version = found.as_ref().map(|update| update.version.clone());

        *self.found.lock().unwrap_or_else(PoisonError::into_inner) = found;

        Ok(version)
    }

    async fn download(
        &self,
        progress: Box<dyn FnMut(usize, Option<u64>) + Send>,
    ) -> Result<(), String> {
        let update = self
            .found()
            .ok_or_else(|| String::from("Nothing has been found to download"))?;
        let bytes = update
            .download(progress, || {})
            .await
            .map_err(|error| error.to_string())?;

        *self.fetched.lock().unwrap_or_else(PoisonError::into_inner) = Some(bytes);

        Ok(())
    }

    fn install(&self) -> Result<(), String> {
        let update = self
            .found()
            .ok_or_else(|| String::from("Nothing has been found to install"))?;
        let bytes = self
            .fetched
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .take()
            .ok_or_else(|| String::from("Nothing has been downloaded to install"))?;

        if let Err(error) = update.install(bytes) {
            self.come_back();

            return Err(error.to_string());
        }

        self.app.restart()
    }
}
