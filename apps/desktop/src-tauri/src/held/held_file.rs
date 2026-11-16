//! What is kept about one download: the shapes of `WhatToKeep` and `HeldFile` from the shared
//! contracts, with the same checks their schemas make.

use crate::serve::held_file::is_a_uuid;
use serde::{Deserialize, Serialize};

/// How far keeping a download has come.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HeldState {
    /// Arriving now.
    Fetching,
    /// Stopped by the person, with what arrived still on the disk.
    Paused,
    /// All of it is on the disk.
    Here,
    /// Stopped by something going wrong.
    Failed,
}

/// The quality a download was prepared at.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum DownloadQuality {
    /// The file as it is on the server.
    #[serde(rename = "original")]
    Original,
    /// 2160 lines.
    #[serde(rename = "2160p")]
    Lines2160,
    /// 1440 lines.
    #[serde(rename = "1440p")]
    Lines1440,
    /// 1080 lines.
    #[serde(rename = "1080p")]
    Lines1080,
    /// 720 lines.
    #[serde(rename = "720p")]
    Lines720,
    /// 480 lines.
    #[serde(rename = "480p")]
    Lines480,
    /// 360 lines.
    #[serde(rename = "360p")]
    Lines360,
    /// 240 lines.
    #[serde(rename = "240p")]
    Lines240,
    /// 144 lines.
    #[serde(rename = "144p")]
    Lines144,
}

/// What the page asks to keep.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhatToKeep {
    pub(crate) download_id: String,
    pub(crate) media_id: String,
    #[serde(default)]
    pub(crate) series_id: Option<String>,
    #[serde(default)]
    pub(crate) series_title: Option<String>,
    pub(crate) title: String,
    pub(crate) quality: DownloadQuality,
    #[serde(default)]
    pub(crate) duration_seconds: Option<f64>,
    #[serde(default)]
    pub(crate) of_bytes: Option<u64>,
}

/// One download this computer holds or is fetching, as the index keeps it and the page draws it.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeldFile {
    #[serde(flatten)]
    pub(crate) what: WhatToKeep,
    pub(crate) state: HeldState,
    pub(crate) bytes: u64,
    #[serde(default)]
    pub(crate) bytes_per_second: Option<u64>,
    #[serde(default)]
    pub(crate) failure: Option<String>,
    pub(crate) kept_at: String,
    #[serde(default)]
    pub(crate) has_poster: bool,
    #[serde(default)]
    pub(crate) has_trickplay: bool,
}

impl WhatToKeep {
    /// Reads what the page asked to keep, as `WhatToKeepSchema` would.
    #[must_use]
    pub fn from_value(said: serde_json::Value) -> Option<Self> {
        serde_json::from_value::<Self>(said)
            .ok()
            .filter(Self::is_sound)
    }

    /// Whether every field holds what the schema allows.
    fn is_sound(&self) -> bool {
        is_a_uuid(&self.download_id)
            && is_a_uuid(&self.media_id)
            && !self.title.is_empty()
            && self
                .duration_seconds
                .is_none_or(|seconds| seconds.is_finite() && seconds > 0.0)
    }
}

impl HeldFile {
    /// Reads one row of the index, as `HeldFileSchema` would, or nothing where it does not parse.
    #[must_use]
    pub fn from_value(row: serde_json::Value) -> Option<Self> {
        serde_json::from_value::<Self>(row)
            .ok()
            .filter(|held| held.what.is_sound() && is_a_datetime(&held.kept_at))
    }

    /// The prepared download this row is about.
    #[must_use]
    pub fn download_id(&self) -> &str {
        &self.what.download_id
    }
}

/// Whether text is a UTC timestamp as zod's `datetime()` accepts one.
#[must_use]
pub fn is_a_datetime(said: &str) -> bool {
    let Some((date, time)) = said.split_once('T') else {
        return false;
    };

    is_a_date(date) && is_a_time(time)
}

/// Whether text is a calendar date, `YYYY-MM-DD`, that exists.
fn is_a_date(said: &str) -> bool {
    let parts: Vec<&str> = said.split('-').collect();

    let [year, month, day] = parts.as_slice() else {
        return false;
    };

    if year.len() != 4 || month.len() != 2 || day.len() != 2 {
        return false;
    }

    let (Some(year), Some(month), Some(day)) = (digits(year), digits(month), digits(day)) else {
        return false;
    };

    let is_leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    let longest = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if is_leap => 29,
        2 => 28,
        _ => 0,
    };

    (1..=longest).contains(&day)
}

/// Whether text is a time of day in UTC, `HH:MM`, optionally with seconds and their fraction.
fn is_a_time(said: &str) -> bool {
    let Some(time) = said.strip_suffix('Z') else {
        return false;
    };

    let (clock, fraction) = match time.split_once('.') {
        Some((clock, fraction)) => (clock, Some(fraction)),
        None => (time, None),
    };

    let parts: Vec<&str> = clock.split(':').collect();
    let has_seconds = parts.len() == 3;

    if !(parts.len() == 2 || has_seconds) || parts.iter().any(|part| part.len() != 2) {
        return false;
    }

    let numbers: Vec<Option<u32>> = parts.iter().map(|part| digits(part)).collect();
    let limits = [23, 59, 59];
    let in_range = numbers
        .iter()
        .zip(limits)
        .all(|(number, limit)| number.is_some_and(|number| number <= limit));

    let fraction_is_sound = fraction.is_none_or(|fraction| {
        has_seconds && !fraction.is_empty() && fraction.bytes().all(|byte| byte.is_ascii_digit())
    });

    in_range && fraction_is_sound
}

/// Reads a run of ASCII digits as a number, or nothing where it is anything else.
fn digits(said: &str) -> Option<u32> {
    if said.is_empty() || !said.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }

    said.parse().ok()
}

#[cfg(test)]
mod tests {
    use super::{is_a_datetime, HeldFile, HeldState, WhatToKeep};
    use serde_json::json;

    fn asked() -> serde_json::Value {
        json!({
            "downloadId": "2b2b7f7e-2f0e-4a5e-9c2f-2b9b1e1f0a11",
            "mediaId": "9c858901-8a57-4791-81fe-4c455b099bc9",
            "title": "The Third Man",
            "quality": "original",
            "durationSeconds": 5940,
            "ofBytes": 11
        })
    }

    #[test]
    fn reads_what_to_keep_filling_in_what_was_left_out() {
        let what = WhatToKeep::from_value(asked());

        assert!(what.is_some_and(|what| what.series_id.is_none() && what.of_bytes == Some(11)));
    }

    #[test]
    fn refuses_a_download_id_that_is_not_one() {
        let mut said = asked();
        said["downloadId"] = json!("../../etc/passwd");

        assert!(WhatToKeep::from_value(said).is_none());
    }

    #[test]
    fn refuses_a_quality_nobody_prepares() {
        let mut said = asked();
        said["quality"] = json!("8k");

        assert!(WhatToKeep::from_value(said).is_none());
    }

    #[test]
    fn refuses_an_empty_title_and_a_running_time_of_nothing() {
        let mut untitled = asked();
        untitled["title"] = json!("");
        let mut instant = asked();
        instant["durationSeconds"] = json!(0);

        assert!(WhatToKeep::from_value(untitled).is_none());
        assert!(WhatToKeep::from_value(instant).is_none());
    }

    #[test]
    fn reads_a_row_of_the_index_and_drops_one_gone_wrong() {
        let mut row = asked();
        row["state"] = json!("here");
        row["bytes"] = json!(11);
        row["keptAt"] = json!("2026-08-22T00:00:00.000Z");

        let mut broken = row.clone();
        broken["bytes"] = json!(-1);

        assert!(
            HeldFile::from_value(row).is_some_and(|held| held.state == HeldState::Here
                && !held.has_poster
                && held.failure.is_none())
        );
        assert!(HeldFile::from_value(broken).is_none());
    }

    #[test]
    fn writes_a_row_the_way_the_page_reads_it() {
        let mut row = asked();
        row["state"] = json!("paused");
        row["bytes"] = json!(4);
        row["keptAt"] = json!("2026-08-22T00:00:00.000Z");

        let written = HeldFile::from_value(row).map(|held| serde_json::to_value(held).ok());

        assert_eq!(
            written.flatten().map(|written| (
                written["downloadId"].clone(),
                written["seriesId"].clone(),
                written["hasTrickplay"].clone()
            )),
            Some((
                json!("2b2b7f7e-2f0e-4a5e-9c2f-2b9b1e1f0a11"),
                json!(null),
                json!(false)
            ))
        );
    }

    #[test]
    fn knows_a_timestamp_as_zod_does() {
        assert!(is_a_datetime("2026-08-22T00:00:00.000Z"));
        assert!(is_a_datetime("2024-02-29T23:59Z"));
        assert!(!is_a_datetime("2026-02-29T00:00:00Z"));
        assert!(!is_a_datetime("2026-08-22T00:00:00+01:00"));
        assert!(!is_a_datetime("2026-08-22T24:00:00Z"));
        assert!(!is_a_datetime("2026-08-22"));
    }
}
