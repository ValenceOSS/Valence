//! What time it is, written as JavaScript's `toISOString` writes it.

use std::time::{SystemTime, UNIX_EPOCH};

/// The time now, as `2026-08-22T00:00:00.000Z`.
#[must_use]
pub fn now_as_iso() -> String {
    let since = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    written_as_iso(since.as_secs(), since.subsec_millis())
}

/// A moment, given in seconds and milliseconds since 1970 began, as `toISOString` writes it.
fn written_as_iso(seconds: u64, milliseconds: u32) -> String {
    let days = seconds / 86_400;
    let of_the_day = seconds % 86_400;
    let (year, month, day) = civil_from_days(days);

    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{milliseconds:03}Z",
        of_the_day / 3600,
        of_the_day % 3600 / 60,
        of_the_day % 60
    )
}

/// The year, month and day a count of days since 1970 began falls on, by Howard Hinnant's method.
fn civil_from_days(days: u64) -> (u64, u64, u64) {
    let shifted = days + 719_468;
    let era = shifted / 146_097;
    let of_the_era = shifted - era * 146_097;
    let year_of_the_era =
        (of_the_era - of_the_era / 1460 + of_the_era / 36_524 - of_the_era / 146_096) / 365;
    let day_of_the_year =
        of_the_era - (365 * year_of_the_era + year_of_the_era / 4 - year_of_the_era / 100);
    let month_from_march = (5 * day_of_the_year + 2) / 153;
    let day = day_of_the_year - (153 * month_from_march + 2) / 5 + 1;
    let month = if month_from_march < 10 {
        month_from_march + 3
    } else {
        month_from_march - 9
    };
    let year = year_of_the_era + era * 400 + u64::from(month <= 2);

    (year, month, day)
}

#[cfg(test)]
mod tests {
    use super::{now_as_iso, written_as_iso};
    use crate::held::held_file::is_a_datetime;

    #[test]
    fn writes_the_beginning_of_time() {
        assert_eq!(written_as_iso(0, 0), "1970-01-01T00:00:00.000Z");
    }

    #[test]
    fn writes_a_moment_as_javascript_does() {
        assert_eq!(written_as_iso(1_787_356_800, 7), "2026-08-22T00:00:00.007Z");
        assert_eq!(written_as_iso(951_782_400, 999), "2000-02-29T00:00:00.999Z");
    }

    #[test]
    fn writes_now_as_the_index_reads_it() {
        assert!(is_a_datetime(&now_as_iso()));
    }
}
