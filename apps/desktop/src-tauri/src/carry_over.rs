//! What somebody who ran the Electron app had, carried over to this one on its first start: the
//! session they were signed in with, and what the page kept in its own storage.
//!
//! Both are read out of the Chromium profile the Electron app left in the folder this app keeps its
//! files in, and the profile itself is left as it was. The session goes into this app's cookie
//! jar; what the page kept is handed to the page once, through the first script, and the page says
//! when it has it. The page's `IndexedDB` is not carried: it holds only answers the app asks the
//! server for again.

pub mod cookies;
pub mod local_storage;
pub mod safe_storage;
pub mod sealed_values;

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};

use cookie_store::CookieStore;
use reqwest::Url;
use tauri::{AppHandle, Manager};
use time::OffsetDateTime;

const STORAGE_CARRIED: &str = "storage-carried-over";

/// The session the Electron app held for `server`, read out of the profile in `user_data`, or
/// nothing where it held none or none of it could be opened.
#[must_use]
pub fn session(user_data: &Path, server: &str) -> Option<CookieStore> {
    let server = Url::parse(server).ok()?;
    let database = cookies::database_in(user_data)?;
    let keys = safe_storage::sealing_keys(user_data);
    let kept = cookies::read_cookies(&database, &keys)
        .inspect_err(|error| {
            eprintln!("Valence could not read the Electron app's session: {error}");
        })
        .ok()?;
    let jar = cookies::jar_for(&kept, &server, OffsetDateTime::now_utc());

    let holds_any = jar.iter_unexpired().next().is_some();

    holds_any.then_some(jar)
}

/// What the Electron app's page kept, waiting for this app's page to take it.
#[derive(Clone)]
pub struct CarriedStorage {
    held: Arc<Mutex<BTreeMap<String, String>>>,
    mark: PathBuf,
}

impl CarriedStorage {
    /// What the Electron app's page kept in the profile in `user_data`, or nothing where it has
    /// already been handed over or there is nothing to hand.
    #[must_use]
    pub fn in_folder(user_data: &Path) -> Self {
        let mark = user_data.join(STORAGE_CARRIED);
        let held = if mark.exists() {
            BTreeMap::new()
        } else {
            let database = local_storage::database_in(user_data);

            if database.is_dir() {
                local_storage::read_storage(&database).unwrap_or_else(|error| {
                    eprintln!("Valence could not read the Electron app's storage: {error}");
                    BTreeMap::new()
                })
            } else {
                BTreeMap::new()
            }
        };
        let carried = Self {
            held: Arc::new(Mutex::new(held)),
            mark,
        };

        if carried.held().is_empty() {
            carried.taken();
        }

        carried
    }

    /// What is still to be handed to the page.
    #[must_use]
    pub fn waiting(&self) -> BTreeMap<String, String> {
        self.held().clone()
    }

    /// Notes that the page has it all, so it is never handed over again, making the app's folder
    /// where this is its first start and there is none yet.
    pub fn taken(&self) {
        self.held().clear();

        if !self.mark.exists() {
            let noted = self
                .mark
                .parent()
                .map_or(Ok(()), std::fs::create_dir_all)
                .and_then(|()| std::fs::write(&self.mark, b""));

            if let Err(error) = noted {
                eprintln!("Valence could not note that the storage was carried over: {error}");
            }
        }
    }

    /// What is held, even where a thread panicked holding it.
    fn held(&self) -> MutexGuard<'_, BTreeMap<String, String>> {
        self.held.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

/// What the Electron app's page kept that this app's page has still to take.
#[must_use]
pub fn carried_storage(app: &AppHandle) -> BTreeMap<String, String> {
    app.try_state::<CarriedStorage>()
        .map(|carried| carried.waiting())
        .unwrap_or_default()
}

/// Notes that the page has written everything the Electron app's page kept into its own storage.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn carried_storage_taken(app: AppHandle) {
    if let Some(carried) = app.try_state::<CarriedStorage>() {
        carried.taken();
    }
}

/// Reads what the Electron app's page kept, where it has not been handed over yet.
pub fn setup(app: &tauri::App) {
    app.manage(CarriedStorage::in_folder(&crate::paths::user_data()));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hands_nothing_over_where_the_electron_app_left_nothing() {
        let folder = tempfile::tempdir().unwrap();
        let carried = CarriedStorage::in_folder(folder.path());

        assert!(carried.waiting().is_empty());
        assert!(folder.path().join(STORAGE_CARRIED).exists());
    }

    #[test]
    fn notes_it_on_a_first_start_with_no_folder_yet() {
        let folder = tempfile::tempdir().unwrap();
        let user_data = folder.path().join("Valence");

        assert!(CarriedStorage::in_folder(&user_data).waiting().is_empty());
        assert!(user_data.join(STORAGE_CARRIED).exists());
    }

    #[test]
    fn hands_the_storage_over_until_the_page_has_it_and_never_again() {
        let folder = tempfile::tempdir().unwrap();
        let database = local_storage::database_in(folder.path());
        let options = rusty_leveldb::Options {
            create_if_missing: true,
            ..rusty_leveldb::Options::default()
        };
        let mut written = rusty_leveldb::DB::open(&database, options).unwrap();

        written
            .put(b"_valence://app\x00\x01volume", b"\x010.5")
            .unwrap();
        written.flush().unwrap();
        drop(written);

        let carried = CarriedStorage::in_folder(folder.path());

        assert_eq!(
            carried.waiting(),
            BTreeMap::from([("volume".to_owned(), "0.5".to_owned())])
        );
        assert_eq!(CarriedStorage::in_folder(folder.path()).waiting().len(), 1);

        carried.taken();

        assert!(carried.waiting().is_empty());
        assert!(CarriedStorage::in_folder(folder.path())
            .waiting()
            .is_empty());
    }

    #[test]
    fn carries_no_session_where_there_is_no_profile_or_no_server() {
        let folder = tempfile::tempdir().unwrap();

        assert!(session(folder.path(), "http://nas:8420").is_none());
        assert!(session(folder.path(), "not an address").is_none());
    }
}
