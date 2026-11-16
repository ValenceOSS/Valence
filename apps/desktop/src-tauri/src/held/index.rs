//! What this computer knows about the files it holds, in `held.json` beside the preference file,
//! written as the Electron app's `conf` wrote it: one JSON object of rows by download, tab-indented.

use super::held_file::HeldFile;
use serde::de::{Deserializer, MapAccess, Visitor};
use serde::ser::{SerializeMap, Serializer};
use serde_json::Value;
use std::fmt;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, PoisonError};

/// The index file's name.
pub const HELD_INDEX_FILE: &str = "held.json";

/// The rows of the index in the order they were first written, as a JavaScript object keeps them.
type Rows = Vec<(String, Value)>;

/// The index of held files, read once and written through on every change.
pub struct HeldIndex {
    file: PathBuf,
    rows: Mutex<Rows>,
}

impl HeldIndex {
    /// Opens the index kept in a file, which is empty where the file is missing or unreadable.
    #[must_use]
    pub fn open(file: PathBuf) -> Self {
        let rows = std::fs::read_to_string(&file)
            .ok()
            .and_then(|written| read_rows(&written))
            .unwrap_or_default();

        Self {
            file,
            rows: Mutex::new(rows),
        }
    }

    /// Every row that still parses.
    #[must_use]
    pub fn all(&self) -> Vec<HeldFile> {
        self.lock()
            .iter()
            .filter_map(|(_, row)| HeldFile::from_value(row.clone()))
            .collect()
    }

    /// The row for one download, or nothing where there is none or it no longer parses.
    #[must_use]
    pub fn read(&self, download_id: &str) -> Option<HeldFile> {
        self.lock()
            .iter()
            .find(|(key, _)| key == download_id)
            .and_then(|(_, row)| HeldFile::from_value(row.clone()))
    }

    /// Writes a row, in place of any earlier one for the same download.
    pub fn write(&self, file: &HeldFile) {
        let Ok(row) = serde_json::to_value(file) else {
            return;
        };

        let mut rows = self.lock();
        put(&mut rows, file.download_id(), row);
        self.save(&rows);
    }

    /// Changes the row for one download where there still is one, all under one lock so nothing
    /// written meanwhile is lost.
    pub fn change(&self, download_id: &str, change: impl FnOnce(&mut HeldFile)) {
        let mut rows = self.lock();

        let Some(mut current) = rows
            .iter()
            .find(|(key, _)| key == download_id)
            .and_then(|(_, row)| HeldFile::from_value(row.clone()))
        else {
            return;
        };

        change(&mut current);

        if let Ok(row) = serde_json::to_value(&current) {
            put(&mut rows, download_id, row);
            self.save(&rows);
        }
    }

    /// Forgets the row for one download.
    pub fn forget(&self, download_id: &str) {
        let mut rows = self.lock();
        let before = rows.len();

        rows.retain(|(key, _)| key != download_id);

        if rows.len() != before {
            self.save(&rows);
        }
    }

    /// Takes the rows, whatever another thread was doing when it panicked.
    fn lock(&self) -> std::sync::MutexGuard<'_, Rows> {
        self.rows.lock().unwrap_or_else(PoisonError::into_inner)
    }

    /// Writes the rows to the file whole, through a file beside it so a crash never leaves half.
    fn save(&self, rows: &Rows) {
        let Ok(written) = write_rows(rows) else {
            return;
        };

        if let Some(folder) = self.file.parent() {
            let _ = std::fs::create_dir_all(folder);
        }

        let beside = with_suffix(&self.file, ".writing");

        if std::fs::write(&beside, written).is_ok() {
            let _ = std::fs::rename(&beside, &self.file);
        }
    }
}

/// Puts a row in place of the one with the same key, or at the end where there is none.
fn put(rows: &mut Rows, key: &str, row: Value) {
    match rows.iter_mut().find(|(existing, _)| existing == key) {
        Some((_, existing)) => *existing = row,
        None => rows.push((key.to_owned(), row)),
    }
}

/// A path with something added to the end of its file name.
fn with_suffix(path: &Path, suffix: &str) -> PathBuf {
    let mut named = path.as_os_str().to_owned();
    named.push(suffix);
    PathBuf::from(named)
}

/// Reads the rows of a JSON object in the order they are written.
fn read_rows(written: &str) -> Option<Rows> {
    let mut reading = serde_json::Deserializer::from_str(written);

    reading.deserialize_map(InOrder).ok()
}

/// Writes rows as a JSON object, tab-indented as `conf` writes it.
fn write_rows(rows: &Rows) -> serde_json::Result<Vec<u8>> {
    let mut written = Vec::new();
    let mut writing = serde_json::Serializer::with_formatter(
        &mut written,
        serde_json::ser::PrettyFormatter::with_indent(b"\t"),
    );
    let mut object = writing.serialize_map(Some(rows.len()))?;

    for (key, row) in rows {
        object.serialize_entry(key, row)?;
    }

    object.end()?;

    Ok(written)
}

/// Reads a JSON object's entries in order.
struct InOrder;

impl<'de> Visitor<'de> for InOrder {
    type Value = Rows;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("an object of rows by download")
    }

    fn visit_map<A: MapAccess<'de>>(self, mut map: A) -> Result<Rows, A::Error> {
        let mut rows = Rows::new();

        while let Some((key, row)) = map.next_entry::<String, Value>()? {
            put(&mut rows, &key, row);
        }

        Ok(rows)
    }
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    reason = "a test that cannot set up should fail loudly"
)]
mod tests {
    use super::{HeldIndex, HELD_INDEX_FILE};
    use crate::held::held_file::{HeldFile, HeldState};
    use serde_json::json;

    fn a_row(download_id: &str) -> HeldFile {
        HeldFile::from_value(json!({
            "downloadId": download_id,
            "mediaId": "9c858901-8a57-4791-81fe-4c455b099bc9",
            "title": "The Third Man",
            "quality": "original",
            "state": "fetching",
            "bytes": 0,
            "keptAt": "2026-08-22T00:00:00.000Z"
        }))
        .unwrap()
    }

    const ONE: &str = "11111111-1111-4111-8111-111111111111";
    const TWO: &str = "22222222-2222-4222-8222-222222222222";

    #[test]
    fn remembers_rows_across_opening_it_again() {
        let folder = tempfile::tempdir().unwrap();
        let file = folder.path().join(HELD_INDEX_FILE);

        let index = HeldIndex::open(file.clone());
        index.write(&a_row(TWO));
        index.write(&a_row(ONE));
        index.change(TWO, |row| row.state = HeldState::Here);

        let again = HeldIndex::open(file);
        let rows: Vec<(String, HeldState)> = again
            .all()
            .into_iter()
            .map(|row| (row.download_id().to_owned(), row.state))
            .collect();

        assert_eq!(
            rows,
            vec![
                (TWO.to_owned(), HeldState::Here),
                (ONE.to_owned(), HeldState::Fetching)
            ]
        );
    }

    #[test]
    fn writes_the_file_as_conf_wrote_it() {
        let folder = tempfile::tempdir().unwrap();
        let file = folder.path().join(HELD_INDEX_FILE);

        HeldIndex::open(file.clone()).write(&a_row(ONE));

        let written = std::fs::read_to_string(file).unwrap();

        assert!(written.starts_with("{\n\t\"11111111-1111-4111-8111-111111111111\": {\n\t\t"));
    }

    #[test]
    fn drops_a_row_that_no_longer_parses_and_keeps_the_rest() {
        let folder = tempfile::tempdir().unwrap();
        let file = folder.path().join(HELD_INDEX_FILE);
        let good = serde_json::to_value(a_row(ONE)).unwrap();

        std::fs::write(
            &file,
            serde_json::to_string(&json!({ ONE: good, TWO: { "downloadId": TWO } })).unwrap(),
        )
        .unwrap();

        let index = HeldIndex::open(file);

        assert_eq!(index.all().len(), 1);
        assert!(index.read(TWO).is_none());
    }

    #[test]
    fn changes_nothing_that_was_forgotten() {
        let folder = tempfile::tempdir().unwrap();
        let index = HeldIndex::open(folder.path().join(HELD_INDEX_FILE));

        index.write(&a_row(ONE));
        index.forget(ONE);
        index.change(ONE, |row| row.state = HeldState::Here);

        assert!(index.read(ONE).is_none());
    }

    #[test]
    fn starts_empty_where_there_is_no_file() {
        let folder = tempfile::tempdir().unwrap();

        assert!(
            HeldIndex::open(folder.path().join("missing").join(HELD_INDEX_FILE))
                .all()
                .is_empty()
        );
    }
}
