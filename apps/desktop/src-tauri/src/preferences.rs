//! Preferences kept between launches, in the file the Electron app kept them in.
//!
//! The file is a flat JSON object. Only its text values are preferences; anything else in it is
//! left exactly as it is. A dot in a key is part of the key. What the file holds is kept in memory
//! and read again only when the file changes, which it can from another process: a development
//! build shares it with the installed app.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use std::time::SystemTime;

use serde::Serialize;
use serde_json::{Map, Value};
use tauri::{AppHandle, Manager};

/// The key the chosen server's address is kept under.
pub const SERVER_ADDRESS: &str = "valence.server.address";

/// The key the chosen app icon is kept under.
pub const APP_ICON: &str = "valence.appIcon";

const FILE: &str = "preferences.json";

const WAS: &str = "flux.";

const IS: &str = "valence.";

const KEPT_UNDER: [&str; 10] = [
    "captionStyle",
    "clientId",
    "gridSize",
    "library.last",
    "playback",
    "profile",
    "qualityPreference",
    "reader",
    "server.address",
    "soundPreference",
];

type Listener = Arc<dyn Fn(&str) + Send + Sync>;

/// The preference file and what it holds, shared by everything that reads or writes it.
#[derive(Clone)]
pub struct Preferences(Arc<Inner>);

struct Inner {
    file: PathBuf,
    kept: Mutex<Kept>,
    listeners: Mutex<Vec<Listener>>,
}

#[derive(Default)]
struct Kept {
    values: BTreeMap<String, String>,
    seen: Option<SystemTime>,
}

impl Preferences {
    /// Opens the preference file at `file`, which need not exist yet.
    #[must_use]
    pub fn open(file: PathBuf) -> Self {
        let preferences = Self(Arc::new(Inner {
            file,
            kept: Mutex::new(Kept::default()),
            listeners: Mutex::new(Vec::new()),
        }));

        drop(preferences.kept());

        preferences
    }

    /// Every preference, as the file now says.
    #[must_use]
    pub fn all(&self) -> BTreeMap<String, String> {
        self.kept().values.clone()
    }

    /// One preference, or nothing where none is kept under `key`.
    #[must_use]
    pub fn read(&self, key: &str) -> Option<String> {
        self.kept().values.get(key).cloned()
    }

    /// Keeps `value` under `key`, then tells everything listening which key changed.
    ///
    /// # Errors
    ///
    /// When the file cannot be written.
    pub fn write(&self, key: &str, value: &str) -> io::Result<()> {
        self.change(key, Some(value))?;
        self.tell(key);
        Ok(())
    }

    /// Forgets what is kept under `key`, then tells everything listening which key changed.
    ///
    /// # Errors
    ///
    /// When the file cannot be written.
    pub fn forget(&self, key: &str) -> io::Result<()> {
        self.change(key, None)?;
        self.tell(key);
        Ok(())
    }

    /// Calls `listener` with the key after every write or forget.
    pub fn when_written(&self, listener: impl Fn(&str) + Send + Sync + 'static) {
        lock(&self.0.listeners).push(Arc::new(listener));
    }

    /// Where the chosen server is, or nothing before anybody has said.
    #[must_use]
    pub fn server_address(&self) -> Option<String> {
        self.read(SERVER_ADDRESS)
            .filter(|address| !address.is_empty())
    }

    /// Moves what was kept under the old `flux.` names to the `valence.` names, leaving a value
    /// already carried over alone and forgetting the old name either way.
    ///
    /// # Errors
    ///
    /// When the file cannot be written.
    pub fn carry_old_keys_over(&self) -> io::Result<Vec<String>> {
        let mut carried = Vec::new();

        for name in KEPT_UNDER {
            let was = format!("{WAS}{name}");
            let Some(held) = self.read(&was) else {
                continue;
            };
            let is = format!("{IS}{name}");

            if self.read(&is).is_none() {
                self.change(&is, Some(&held))?;
                carried.push(name.to_owned());
            }

            self.change(&was, None)?;
        }

        Ok(carried)
    }

    /// What the file holds, read again first where it has changed since it was last read.
    fn kept(&self) -> MutexGuard<'_, Kept> {
        let mut kept = lock(&self.0.kept);
        let modified = modified_at(&self.0.file);

        if modified.is_none() || modified != kept.seen {
            kept.values = texts_in(&read_object(&self.0.file));
            kept.seen = modified;
        }

        kept
    }

    /// Sets or removes one key in the file and in memory.
    fn change(&self, key: &str, value: Option<&str>) -> io::Result<()> {
        let mut kept = self.kept();
        let mut held = read_object(&self.0.file);

        match value {
            Some(value) => {
                held.insert(key.to_owned(), Value::String(value.to_owned()));
            }
            None => {
                held.remove(key);
            }
        }

        write_object(&self.0.file, &held)?;
        kept.values = texts_in(&held);
        kept.seen = modified_at(&self.0.file);
        Ok(())
    }

    /// Tells everything listening that `key` changed.
    fn tell(&self, key: &str) {
        let listeners = lock(&self.0.listeners).clone();

        for listener in listeners {
            listener(key);
        }
    }
}

/// Locks `mutex`, carrying on with what it holds even where a thread panicked holding it.
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

/// When `file` last changed, or nothing where it cannot be read.
fn modified_at(file: &Path) -> Option<SystemTime> {
    fs::metadata(file).and_then(|found| found.modified()).ok()
}

/// The JSON object in `file`, or an empty one where there is none.
fn read_object(file: &Path) -> Map<String, Value> {
    fs::read(file)
        .ok()
        .and_then(|bytes| serde_json::from_slice::<Map<String, Value>>(&bytes).ok())
        .unwrap_or_default()
}

/// The text values in `object`, which are the preferences.
fn texts_in(object: &Map<String, Value>) -> BTreeMap<String, String> {
    object
        .iter()
        .filter_map(|(key, value)| value.as_str().map(|text| (key.clone(), text.to_owned())))
        .collect()
}

/// Writes `object` to `file` whole, through a file beside it, so a reader never sees half of it.
fn write_object(file: &Path, object: &Map<String, Value>) -> io::Result<()> {
    if let Some(folder) = file.parent() {
        fs::create_dir_all(folder)?;
    }

    let mut text = Vec::new();
    let formatter = serde_json::ser::PrettyFormatter::with_indent(b"\t");
    let mut serializer = serde_json::Serializer::with_formatter(&mut text, formatter);

    object
        .serialize(&mut serializer)
        .map_err(io::Error::other)?;

    let mut beside = file.as_os_str().to_owned();
    beside.push(".writing");
    let beside = PathBuf::from(beside);

    fs::write(&beside, text)?;
    fs::rename(&beside, file)
}

/// Where the chosen server is, or nothing before anybody has said.
#[must_use]
pub fn server_address(app: &AppHandle) -> Option<String> {
    app.try_state::<Preferences>()
        .and_then(|preferences| preferences.server_address())
}

/// Forgets the chosen server, so the app asks again.
pub fn forget_server_address(app: &AppHandle) {
    if let Some(preferences) = app.try_state::<Preferences>() {
        if let Err(error) = preferences.forget(SERVER_ADDRESS) {
            eprintln!("Valence could not forget the server: {error}");
        }
    }
}

/// One preference, or nothing where none is kept under `key`.
#[must_use]
#[cfg_attr(
    not(windows),
    allow(dead_code, reason = "only Windows lets somebody choose the app's icon")
)]
pub fn read(app: &AppHandle, key: &str) -> Option<String> {
    app.try_state::<Preferences>()
        .and_then(|preferences| preferences.read(key))
}

/// Keeps a preference, as the page asked.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn preferences_write(app: AppHandle, key: String, value: String) {
    if let Some(preferences) = app.try_state::<Preferences>() {
        if let Err(error) = preferences.write(&key, &value) {
            eprintln!("Valence could not keep {key}: {error}");
        }
    }
}

/// Forgets a preference, as the page asked.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn preferences_forget(app: AppHandle, key: String) {
    if let Some(preferences) = app.try_state::<Preferences>() {
        if let Err(error) = preferences.forget(&key) {
            eprintln!("Valence could not forget {key}: {error}");
        }
    }
}

/// Opens the preference file, carries old keys over, and shows a newly chosen app icon.
pub fn setup(app: &tauri::App) {
    let preferences = Preferences::open(crate::paths::conf_folder().join(FILE));

    if let Err(error) = preferences.carry_old_keys_over() {
        eprintln!("Valence could not carry its old preferences over: {error}");
    }

    let handle = app.handle().clone();

    preferences.when_written(move |key| {
        if key == APP_ICON {
            crate::app_icon::show(&handle);
        }
    });

    app.manage(preferences);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    fn in_a_folder() -> (tempfile::TempDir, PathBuf) {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let file = folder.path().join("preferences.json");
        (folder, file)
    }

    #[test]
    fn reads_only_the_text_values() {
        let (_folder, file) = in_a_folder();
        fs::write(
            &file,
            r#"{"valence.a":"1","valence.b":2,"valence.c":{"d":"e"}}"#,
        )
        .ok();

        let preferences = Preferences::open(file);

        assert_eq!(preferences.read("valence.a").as_deref(), Some("1"));
        assert_eq!(preferences.read("valence.b"), None);
        assert_eq!(preferences.all().len(), 1);
    }

    #[test]
    fn reads_a_missing_or_broken_file_as_empty() {
        let (_folder, file) = in_a_folder();

        assert!(Preferences::open(file.clone()).all().is_empty());

        fs::write(&file, "not json").ok();

        assert!(Preferences::open(file).all().is_empty());
    }

    #[test]
    fn keeps_a_dot_in_a_key_as_part_of_it() {
        let (_folder, file) = in_a_folder();
        let preferences = Preferences::open(file.clone());

        preferences.write(SERVER_ADDRESS, "http://nas:8420").ok();

        let written = fs::read_to_string(&file).unwrap_or_default();

        assert!(written.contains("\"valence.server.address\": \"http://nas:8420\""));
        assert_eq!(
            Preferences::open(file).server_address().as_deref(),
            Some("http://nas:8420")
        );
    }

    #[test]
    fn leaves_what_is_not_text_in_the_file() {
        let (_folder, file) = in_a_folder();
        fs::write(&file, r#"{"__internal__":{"migrations":{"version":"1"}}}"#).ok();

        let preferences = Preferences::open(file.clone());
        preferences.write("valence.a", "1").ok();
        preferences.forget("valence.a").ok();

        let written = read_object(&file);

        assert!(written.contains_key("__internal__"));
        assert!(!written.contains_key("valence.a"));
    }

    #[test]
    fn sees_a_change_another_process_made() {
        let (_folder, file) = in_a_folder();
        let preferences = Preferences::open(file.clone());

        assert_eq!(preferences.read("valence.a"), None);

        fs::write(&file, r#"{"valence.a":"from elsewhere"}"#).ok();

        assert_eq!(
            preferences.read("valence.a").as_deref(),
            Some("from elsewhere")
        );
    }

    #[test]
    fn an_empty_address_is_no_address() {
        let (_folder, file) = in_a_folder();
        let preferences = Preferences::open(file);

        preferences.write(SERVER_ADDRESS, "").ok();

        assert_eq!(preferences.server_address(), None);
    }

    #[test]
    fn tells_listeners_which_key_changed() {
        let (_folder, file) = in_a_folder();
        let preferences = Preferences::open(file);
        let heard = Arc::new(AtomicUsize::new(0));
        let counted = Arc::clone(&heard);

        preferences.when_written(move |key| {
            if key == APP_ICON {
                counted.fetch_add(1, Ordering::SeqCst);
            }
        });
        preferences.write(APP_ICON, "dark").ok();
        preferences.forget(APP_ICON).ok();
        preferences.write("valence.other", "x").ok();

        assert_eq!(heard.load(Ordering::SeqCst), 2);
    }

    #[test]
    fn carries_old_keys_over_once() {
        let (_folder, file) = in_a_folder();
        fs::write(
            &file,
            r#"{"flux.server.address":"old","flux.gridSize":"2","valence.gridSize":"3","flux.unknown":"x"}"#,
        )
        .ok();
        let preferences = Preferences::open(file);

        let carried = preferences.carry_old_keys_over().unwrap_or_default();

        assert_eq!(carried, vec!["server.address".to_owned()]);
        assert_eq!(preferences.server_address().as_deref(), Some("old"));
        assert_eq!(preferences.read("valence.gridSize").as_deref(), Some("3"));
        assert_eq!(preferences.read("flux.server.address"), None);
        assert_eq!(preferences.read("flux.gridSize"), None);
        assert_eq!(preferences.read("flux.unknown").as_deref(), Some("x"));
        assert!(preferences
            .carry_old_keys_over()
            .unwrap_or_default()
            .is_empty());
    }
}
