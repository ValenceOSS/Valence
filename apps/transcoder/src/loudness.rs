//! How loud a song is, as EBU R128 hears it.
//!
//! A library of albums mastered decades apart plays at decades of different
//! loudness, and a listener levelling them needs each song's loudness rather
//! than its tags, which most files never had. So a file can be measured once:
//! `FFmpeg`'s `ebur128` filter listens to the whole of its first audio stream
//! and reports its integrated loudness and its true peak, which the server
//! keeps and turns into a gain.

use std::path::Path;

use serde::Serialize;
use thiserror::Error;
use tokio::process::Command;

/// The integrated loudness `ebur128` reports for silence, below which nothing
/// was heard to measure.
const SILENCE_LUFS: f64 = -70.0;

/// A song's measured loudness.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Loudness {
    /// Its integrated loudness, in LUFS.
    pub integrated_lufs: f64,
    /// Its true peak, as a share of full scale.
    pub true_peak: f64,
}

/// Why a song could not be measured.
#[derive(Debug, Error)]
pub enum LoudnessError {
    #[error("FFmpeg could not be started: {0}")]
    Spawn(std::io::Error),
    #[error("FFmpeg could not read the file: {0}")]
    Failed(String),
    #[error("The file is silent, or FFmpeg did not say how loud it is.")]
    Unmeasured,
}

/// The arguments that play a file's first audio stream through `ebur128` and
/// throw the sound away, leaving only the filter's summary.
#[must_use]
pub fn measurement_arguments(input: &Path) -> Vec<String> {
    vec![
        "-nostdin".to_owned(),
        "-hide_banner".to_owned(),
        "-nostats".to_owned(),
        "-loglevel".to_owned(),
        "info".to_owned(),
        "-i".to_owned(),
        input.to_string_lossy().into_owned(),
        "-map".to_owned(),
        "0:a:0".to_owned(),
        "-vn".to_owned(),
        "-sn".to_owned(),
        "-dn".to_owned(),
        "-af".to_owned(),
        "ebur128=peak=true".to_owned(),
        "-f".to_owned(),
        "null".to_owned(),
        "-".to_owned(),
    ]
}

/// The number at the start of a summary line's value, such as `-16.3` in
/// `I:  -16.3 LUFS`, where the line is the one named.
fn value_of(line: &str, name: &str) -> Option<f64> {
    line.trim()
        .strip_prefix(name)?
        .split_whitespace()
        .next()?
        .parse()
        .ok()
}

/// Reads the loudness out of `ebur128`'s summary: the integrated loudness
/// under "Integrated loudness" and the peak under "True peak", from the last
/// summary where there is more than one.
#[must_use]
pub fn read_summary(said: &str) -> Option<Loudness> {
    let summary = &said[said.rfind("Summary:")?..];
    let mut integrated = None;
    let mut peak_db = None;
    let mut section = "";

    for line in summary.lines() {
        let trimmed = line.trim();

        if trimmed.ends_with(':') {
            section = trimmed;

            continue;
        }

        if section == "Integrated loudness:" && integrated.is_none() {
            integrated = value_of(trimmed, "I:");
        }

        if section == "True peak:" && peak_db.is_none() {
            peak_db = value_of(trimmed, "Peak:");
        }
    }

    let integrated_lufs =
        integrated.filter(|lufs: &f64| lufs.is_finite() && *lufs > SILENCE_LUFS)?;
    let true_peak = 10_f64.powf(peak_db.filter(|db: &f64| db.is_finite())? / 20.0);

    Some(Loudness {
        integrated_lufs,
        true_peak,
    })
}

/// Measures a file's loudness.
///
/// # Errors
///
/// Returns [`LoudnessError::Spawn`] when `FFmpeg` cannot be started,
/// [`LoudnessError::Failed`] when it cannot read the file, and
/// [`LoudnessError::Unmeasured`] when the file is silent or the summary is
/// missing.
pub async fn measure(ffmpeg: &str, input: &Path) -> Result<Loudness, LoudnessError> {
    let outcome = Command::new(ffmpeg)
        .args(measurement_arguments(input))
        .kill_on_drop(true)
        .output()
        .await
        .map_err(LoudnessError::Spawn)?;
    let said = String::from_utf8_lossy(&outcome.stderr);

    if !outcome.status.success() {
        return Err(LoudnessError::Failed(
            said.lines().last().unwrap_or_default().trim().to_owned(),
        ));
    }

    read_summary(&said).ok_or(LoudnessError::Unmeasured)
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use super::{measurement_arguments, read_summary};

    const SUMMARY: &str = "\
[Parsed_ebur128_0 @ 0x600] Summary:

  Integrated loudness:
    I:         -16.3 LUFS
    Threshold: -26.5 LUFS

  Loudness range:
    LRA:         6.1 LU
    Threshold: -36.6 LUFS
    LRA low:   -21.0 LUFS
    LRA high:  -14.9 LUFS

  True peak:
    Peak:       -0.4 dBFS
";

    #[test]
    fn measures_the_first_audio_stream_and_throws_the_sound_away() {
        let args = measurement_arguments(Path::new("/music/song.flac"));

        assert!(args
            .windows(2)
            .any(|pair| pair == ["-af", "ebur128=peak=true"]));
        assert!(args.windows(2).any(|pair| pair == ["-map", "0:a:0"]));
        assert!(args.windows(2).any(|pair| pair == ["-f", "null"]));
        assert_eq!(args.last().map(String::as_str), Some("-"));
    }

    #[test]
    fn reads_the_integrated_loudness_and_true_peak() {
        let loudness = read_summary(SUMMARY).expect("a summary");

        assert!((loudness.integrated_lufs - -16.3).abs() < f64::EPSILON);
        assert!((loudness.true_peak - 10_f64.powf(-0.4 / 20.0)).abs() < 1e-9);
    }

    #[test]
    fn reads_the_last_summary_where_there_are_several() {
        let said = format!("{}\n{}", SUMMARY.replace("-16.3", "-30.0"), SUMMARY);

        assert!(
            (read_summary(&said).expect("a summary").integrated_lufs - -16.3).abs() < f64::EPSILON
        );
    }

    #[test]
    fn hears_nothing_in_silence() {
        let silent = SUMMARY
            .replace("-16.3", "-70.0")
            .replace("-0.4 dBFS", "-inf dBFS");

        assert!(read_summary(&silent).is_none());
    }

    #[test]
    fn says_nothing_without_a_summary() {
        assert!(read_summary("Output #0, null, to 'pipe:':").is_none());
    }
}
