//! What the Electron app's page kept in its own storage, read out of Chromium's Local Storage
//! database.
//!
//! Chromium keeps one `LevelDB` for every origin's Local Storage. Each entry the page kept is under
//! `_` and the origin, a zero byte, then the key; the key and the value each start with a byte that
//! says how the rest is written, 0 for UTF-16LE and 1 for Latin-1. The database is copied before it
//! is opened, because opening it writes to it.

use std::collections::BTreeMap;
use std::fs;
use std::io;
use std::path::Path;

use rusty_leveldb::{LdbIterator, Options, DB};

const DATABASE: &str = "Local Storage/leveldb";

const ELECTRON_ORIGIN: &str = "valence://app";

const UTF_16: u8 = 0;

const LATIN_1: u8 = 1;

/// The Local Storage database the Electron app kept in `user_data`.
#[must_use]
pub fn database_in(user_data: &Path) -> std::path::PathBuf {
    user_data.join(DATABASE)
}

/// What a string kept by Chromium's Local Storage says, or nothing where it is not written in
/// either way Chromium writes one.
#[must_use]
pub fn decoded(kept: &[u8]) -> Option<String> {
    let (&how, rest) = kept.split_first()?;

    match how {
        UTF_16 => {
            if rest.len() % 2 != 0 {
                return None;
            }

            let units: Vec<u16> = rest
                .chunks_exact(2)
                .map(|pair| u16::from_le_bytes([pair[0], pair[1]]))
                .collect();

            String::from_utf16(&units).ok()
        }
        LATIN_1 => Some(rest.iter().copied().map(char::from).collect()),
        _ => None,
    }
}

/// The key the page kept under, where `entry` is one of `origin`'s.
#[must_use]
pub fn key_of(entry: &[u8], origin: &str) -> Option<String> {
    let rest = entry.strip_prefix(b"_")?.strip_prefix(origin.as_bytes())?;

    decoded(rest.strip_prefix(&[0])?)
}

/// Everything the Electron app's page kept in Local Storage, from the database in `folder`.
///
/// # Errors
///
/// When the database cannot be copied or opened.
pub fn read_storage(folder: &Path) -> io::Result<BTreeMap<String, String>> {
    let copy = tempfile::tempdir()?;

    for entry in fs::read_dir(folder)? {
        let entry = entry?;

        if entry.file_type()?.is_file() && entry.file_name() != "LOCK" {
            fs::copy(entry.path(), copy.path().join(entry.file_name()))?;
        }
    }

    let options = Options {
        create_if_missing: false,
        ..Options::default()
    };
    let mut database =
        DB::open(copy.path(), options).map_err(|status| io::Error::other(status.err))?;
    let mut entries = database
        .new_iter()
        .map_err(|status| io::Error::other(status.err))?;
    let mut kept = BTreeMap::new();

    while let Some((entry, value)) = entries.next() {
        if let (Some(key), Some(value)) = (key_of(&entry, ELECTRON_ORIGIN), decoded(&value)) {
            kept.insert(key, value);
        }
    }

    Ok(kept)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn utf_16(text: &str) -> Vec<u8> {
        std::iter::once(UTF_16)
            .chain(text.encode_utf16().flat_map(u16::to_le_bytes))
            .collect()
    }

    fn latin_1(text: &str) -> Vec<u8> {
        std::iter::once(LATIN_1)
            .chain(
                text.chars()
                    .map(|letter| u8::try_from(u32::from(letter)).unwrap()),
            )
            .collect()
    }

    fn entry(origin: &str, key: &[u8]) -> Vec<u8> {
        [b"_", origin.as_bytes(), &[0], key].concat()
    }

    #[test]
    fn reads_both_ways_chromium_writes_a_string() {
        assert_eq!(decoded(&latin_1("volume")), Some("volume".to_owned()));
        assert_eq!(decoded(&latin_1("café")), Some("café".to_owned()));
        assert_eq!(decoded(&utf_16("音量 🎵")), Some("音量 🎵".to_owned()));
        assert_eq!(decoded(&[UTF_16, 0x61]), None);
        assert_eq!(decoded(&[7, 0x61]), None);
        assert_eq!(decoded(&[]), None);
    }

    #[test]
    fn takes_only_the_electron_apps_own_entries() {
        assert_eq!(
            key_of(
                &entry("valence://app", &latin_1("valence.playback")),
                "valence://app"
            ),
            Some("valence.playback".to_owned())
        );
        assert_eq!(
            key_of(
                &entry("https://example.com", &latin_1("x")),
                "valence://app"
            ),
            None
        );
        assert_eq!(
            key_of(&entry("valence://app.evil", &latin_1("x")), "valence://app"),
            None
        );
        assert_eq!(key_of(b"META:valence://app", "valence://app"), None);
        assert_eq!(key_of(b"VERSION", "valence://app"), None);
    }

    #[test]
    fn reads_what_the_page_kept_and_leaves_the_database_alone() {
        let folder = tempfile::tempdir().unwrap();
        let database_folder = folder.path().join("leveldb");
        let options = Options {
            create_if_missing: true,
            ..Options::default()
        };
        let mut database = DB::open(&database_folder, options).unwrap();

        database.put(b"VERSION", b"1").unwrap();
        database.put(b"META:valence://app", b"\x08\x01").unwrap();
        database
            .put(
                &entry("valence://app", &latin_1("valence.playback")),
                &latin_1(r#"{"volume":0.4}"#),
            )
            .unwrap();
        database
            .put(
                &entry("valence://app", &utf_16("valence.lastChannel")),
                &utf_16("chaîne ✓"),
            )
            .unwrap();
        database
            .put(&entry("valence://app", &latin_1("gone")), &latin_1("x"))
            .unwrap();
        database
            .delete(&entry("valence://app", &latin_1("gone")))
            .unwrap();
        database
            .put(
                &entry("https://www.youtube.com", &latin_1("yt")),
                &latin_1("x"),
            )
            .unwrap();
        database.flush().unwrap();
        drop(database);

        let before: Vec<_> = fs::read_dir(&database_folder)
            .unwrap()
            .map(|entry| entry.unwrap().file_name())
            .collect();

        let kept = read_storage(&database_folder).unwrap();

        assert_eq!(
            kept,
            BTreeMap::from([
                ("valence.lastChannel".to_owned(), "chaîne ✓".to_owned()),
                (
                    "valence.playback".to_owned(),
                    r#"{"volume":0.4}"#.to_owned()
                ),
            ])
        );

        let after: Vec<_> = fs::read_dir(&database_folder)
            .unwrap()
            .map(|entry| entry.unwrap().file_name())
            .collect();

        assert_eq!(before, after);
    }

    #[test]
    fn cannot_read_a_database_that_is_not_there() {
        let folder = tempfile::tempdir().unwrap();

        assert!(read_storage(&folder.path().join("missing")).is_err());
    }
}
