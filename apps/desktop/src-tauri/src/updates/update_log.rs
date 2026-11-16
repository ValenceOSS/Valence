//! What the updater did, written down a line at a time in `updates.log`.
//!
//! An update that never arrives says nothing on its own. This is the record of each check, what it
//! found, the download and how it ended, and anything that went wrong. Lines are written in the
//! order they were said, and a line that cannot be written is dropped rather than taking the
//! updater down with it.

use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::SystemTime;

/// The log, in the folder this app keeps its files in.
pub struct UpdateLog {
    file: PathBuf,
    writing: Mutex<()>,
}

/// A moment as an ISO 8601 timestamp in UTC, to the millisecond, as JavaScript writes one.
#[must_use]
pub fn iso_timestamp(at: SystemTime) -> String {
    let since = at
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let seconds = since.as_secs();
    let days = i64::try_from(seconds / 86_400).unwrap_or_default();
    let in_day = seconds % 86_400;
    let shifted = days + 719_468;
    let era = shifted.div_euclid(146_097);
    let of_era = shifted.rem_euclid(146_097);
    let year_of_era = (of_era - of_era / 1460 + of_era / 36_524 - of_era / 146_096) / 365;
    let of_year = of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_index = (5 * of_year + 2) / 153;
    let day = of_year - (153 * month_index + 2) / 5 + 1;
    let month = if month_index < 10 {
        month_index + 3
    } else {
        month_index - 9
    };
    let year = year_of_era + era * 400 + i64::from(month <= 2);

    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{:03}Z",
        in_day / 3600,
        in_day % 3600 / 60,
        in_day % 60,
        since.subsec_millis()
    )
}

impl UpdateLog {
    /// The log in a folder.
    #[must_use]
    pub fn in_folder(folder: &Path) -> Self {
        Self {
            file: folder.join("updates.log"),
            writing: Mutex::new(()),
        }
    }

    /// Writes a line down, stamped with when it was said.
    pub fn write(&self, line: &str) {
        let stamped = format!("{} {line}\n", iso_timestamp(SystemTime::now()));
        let _writing = self.writing.lock();
        let written = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.file)
            .and_then(|mut file| file.write_all(stamped.as_bytes()));

        drop(written);
    }
}

#[cfg(test)]
mod tests {
    use super::{iso_timestamp, UpdateLog};
    use std::time::{Duration, SystemTime};

    fn a_folder() -> tempfile::TempDir {
        tempfile::tempdir().unwrap_or_else(|error| panic!("no folder: {error}"))
    }

    #[test]
    fn writes_each_line_down_in_the_order_it_was_said() {
        let folder = a_folder();
        let log = UpdateLog::in_folder(folder.path());

        log.write("Found 1.2.0");
        log.write("Asked to download 1.2.0");

        let written =
            std::fs::read_to_string(folder.path().join("updates.log")).unwrap_or_default();
        let lines: Vec<&str> = written.lines().collect();

        assert_eq!(lines.len(), 2);
        assert!(lines[0].ends_with("Z Found 1.2.0"));
        assert_eq!(lines[0].as_bytes()[4], b'-');
        assert!(lines[1].ends_with(" Asked to download 1.2.0"));
    }

    #[test]
    fn drops_a_line_it_cannot_write_rather_than_failing() {
        let folder = a_folder();

        UpdateLog::in_folder(&folder.path().join("not").join("there")).write("Found 1.2.0");
    }

    #[test]
    fn stamps_a_line_as_javascript_would() {
        let at = SystemTime::UNIX_EPOCH + Duration::from_millis(1_755_000_000_123);

        assert_eq!(iso_timestamp(at), "2025-08-12T12:00:00.123Z");
        assert_eq!(
            iso_timestamp(SystemTime::UNIX_EPOCH),
            "1970-01-01T00:00:00.000Z"
        );
        assert_eq!(
            iso_timestamp(SystemTime::UNIX_EPOCH + Duration::from_secs(951_782_400)),
            "2000-02-29T00:00:00.000Z"
        );
    }
}
