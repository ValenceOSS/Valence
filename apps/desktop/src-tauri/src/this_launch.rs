//! What the page keeps for as long as this launch lasts: who chose a profile since the app
//! started, and the like. Held in memory, shared by every window, and gone when the app quits.

use std::collections::BTreeMap;
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};

use tauri::{AppHandle, Manager};

/// What is kept for this launch.
#[derive(Clone, Default)]
pub struct ThisLaunch(Arc<Mutex<BTreeMap<String, String>>>);

impl ThisLaunch {
    /// Everything kept for this launch.
    #[must_use]
    pub fn all(&self) -> BTreeMap<String, String> {
        self.held().clone()
    }

    /// Keeps `value` under `key` until the app quits.
    pub fn write(&self, key: &str, value: &str) {
        self.held().insert(key.to_owned(), value.to_owned());
    }

    /// Forgets what is kept under `key`.
    pub fn forget(&self, key: &str) {
        self.held().remove(key);
    }

    /// What is held, even where a thread panicked holding it.
    fn held(&self) -> MutexGuard<'_, BTreeMap<String, String>> {
        self.0.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

/// Keeps something for this launch.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn this_launch_write(app: AppHandle, key: String, value: String) {
    if let Some(this_launch) = app.try_state::<ThisLaunch>() {
        this_launch.write(&key, &value);
    }
}

/// Forgets something kept for this launch.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn this_launch_forget(app: AppHandle, key: String) {
    if let Some(this_launch) = app.try_state::<ThisLaunch>() {
        this_launch.forget(&key);
    }
}

/// Starts this launch with nothing kept.
pub fn setup(app: &tauri::App) {
    app.manage(ThisLaunch::default());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_and_forgets() {
        let this_launch = ThisLaunch::default();

        this_launch.write("valence.profile", "a");
        this_launch.write("valence.other", "b");
        this_launch.forget("valence.other");

        assert_eq!(
            this_launch.all(),
            BTreeMap::from([("valence.profile".to_owned(), "a".to_owned())])
        );
    }

    #[test]
    fn is_shared_by_every_copy() {
        let this_launch = ThisLaunch::default();
        let copy = this_launch.clone();

        copy.write("k", "v");

        assert_eq!(this_launch.all().get("k").map(String::as_str), Some("v"));
    }
}
