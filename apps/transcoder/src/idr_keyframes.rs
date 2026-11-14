//! Whether an HEVC source's keyframes are all places Firefox will start a picture.
//!
//! A copied stream reaches a browser through Media Source, and every time the
//! player resets a buffer (when it starts, when it resumes, on every seek, and
//! on the small seeks its stall detector makes) the browser discards what it is
//! given until a picture it can start from. Chromium and Safari start from any
//! keyframe. Firefox starts an HEVC picture only from an IDR: a CRA, which is
//! what an open-GOP encode puts on every keyframe after its first, is thrown
//! away with everything after it, and so is the same CRA relabelled as a BLA.
//!
//! Measured on an x265 Main 10 episode copied into fragmented MP4: one IDR, at
//! nought, and a CRA on every other keyframe. Firefox and Zen on macOS took the
//! first segment and then nothing, with every later append reported as done and
//! the buffer never growing. Played from the start the picture froze at the
//! first seek; resumed partway it never began. The same segments appended in
//! Chromium after the same resets played through.
//!
//! H.264 is not asked about. Its open-GOP keyframes are I-slices without an
//! IDR, and Firefox measured the same way takes them after a reset, so every
//! H.264 film would pay for a read that never changes the answer.
//!
//! The container cannot say which kind a keyframe is. Matroska and MP4 mark a
//! CRA as a keyframe exactly as they mark an IDR, so the picture itself is read:
//! a few keyframes from the middle of the film, one packet each, copied out as a
//! raw elementary stream and read for the type of their first picture. Encoders
//! are consistent about this, so a few answer for the whole film, and the answer
//! is kept beside the keyframe index so it is only ever worked out once.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tokio::process::Command;
use tokio::task::JoinSet;

use crate::keyframes::Keyframes;

const DIRECTORY: &str = "idr";

/// The one codec this question applies to.
const CODEC: &str = "hevc";

/// How many keyframes are read to decide.
const SAMPLES: usize = 3;

/// How long one keyframe is given to be read.
///
/// Each read is a seek and one packet, well under a second from a local disk.
/// It runs before the session can answer, so a source that will not give one
/// up promptly, a stalled network share or a remote one, is left copied as it
/// always was rather than holding the viewer at a spinner.
const READ_DEADLINE: Duration = Duration::from_secs(5);

/// Numbers each answer written, so two sessions keeping the same answer at once
/// never write through the same temporary file.
static WRITES: AtomicU64 = AtomicU64::new(0);

/// Where a film with no keyframe index yet is looked at, in seconds.
///
/// Each read lands on the keyframe at or before the time asked, so any time past
/// the first group of pictures reaches a keyframe other than the opening one.
const UNINDEXED_SAMPLE_SECONDS: [f64; SAMPLES] = [60.0, 300.0, 900.0];

/// The HEVC unit types of an IDR picture: `IDR_W_RADL` and `IDR_N_LP`.
const IDR_UNIT_TYPES: [u8; 2] = [19, 20];

/// The first HEVC unit type that is not a picture.
const FIRST_NON_PICTURE_UNIT_TYPE: u8 = 32;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Kept {
    opens_only_on_idr: bool,
}

/// What kind of picture a keyframe opens on.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Opening {
    /// An IDR picture, which every decoder can start from.
    Idr,
    /// Any other picture the container marks as a keyframe: a CRA or a BLA.
    Other,
}

/// Whether a codec is the one this question applies to.
#[must_use]
pub fn applies_to(codec: &str) -> bool {
    codec == CODEC
}

/// Where a file's answer would be kept.
fn at(artefact_root: &Path, address: &str) -> PathBuf {
    artefact_root
        .join(DIRECTORY)
        .join(format!("{address}.json"))
}

/// The times to read a keyframe at: spread across the middle of the film, never
/// its first keyframe.
#[must_use]
pub fn sample_times(keyframes: Option<&Keyframes>) -> Vec<f64> {
    let Some(keyframes) = keyframes else {
        return UNINDEXED_SAMPLE_SECONDS.to_vec();
    };

    let later = keyframes.cuts.get(1..).unwrap_or_default();

    if later.is_empty() {
        return Vec::new();
    }

    let mut times: Vec<f64> = (1..=SAMPLES)
        .map(|part| later[(later.len() * part / (SAMPLES + 1)).min(later.len() - 1)].at_seconds)
        .collect();

    times.dedup_by(|a, b| (*a - *b).abs() < f64::EPSILON);
    times
}

/// What kind of picture an HEVC elementary stream opens on.
///
/// Reads the Annex B stream ffmpeg writes for a copied packet: start codes, then
/// network abstraction units, the parameter sets first and the picture after
/// them. The first unit that carries a picture decides.
#[must_use]
pub fn opening_of(stream: &[u8]) -> Option<Opening> {
    let mut at = 0;

    while at + 3 < stream.len() {
        if stream[at] != 0 || stream[at + 1] != 0 || stream[at + 2] != 1 {
            at += 1;
            continue;
        }

        let kind = (stream[at + 3] >> 1) & 0x3f;

        at += 3;

        if kind < FIRST_NON_PICTURE_UNIT_TYPE {
            return Some(if IDR_UNIT_TYPES.contains(&kind) {
                Opening::Idr
            } else {
                Opening::Other
            });
        }
    }

    None
}

/// The command line that copies out the first picture at or before a time.
#[must_use]
pub fn reading_arguments(path: &Path, at_seconds: f64) -> Vec<String> {
    crate::joined_input::opened(vec![
        "-v".to_owned(),
        "error".to_owned(),
        "-nostdin".to_owned(),
        "-ss".to_owned(),
        format!("{at_seconds:.3}"),
        "-i".to_owned(),
        path.to_string_lossy().into_owned(),
        "-map".to_owned(),
        "0:v:0".to_owned(),
        "-c:v".to_owned(),
        "copy".to_owned(),
        "-frames:v".to_owned(),
        "1".to_owned(),
        "-f".to_owned(),
        CODEC.to_owned(),
        "pipe:1".to_owned(),
    ])
}

/// Reads what kind of picture the keyframe at or before a time opens on, or
/// nothing where it does not answer within [`READ_DEADLINE`].
async fn read_opening(ffmpeg: String, path: PathBuf, at_seconds: f64) -> Option<Opening> {
    let reading = Command::new(ffmpeg)
        .args(reading_arguments(&path, at_seconds))
        .kill_on_drop(true)
        .output();
    let output = tokio::time::timeout(READ_DEADLINE, reading)
        .await
        .ok()?
        .ok()?;

    if !output.status.success() {
        return None;
    }

    opening_of(&output.stdout)
}

/// Whether every keyframe of an HEVC source opens on an IDR picture.
///
/// Kept once known. One keyframe that is not an IDR answers for the film; an
/// IDR-only answer needs every sample read, since a keyframe that did not
/// answer may be the CRA, and at least one read: a film with no keyframe after
/// its first says nothing, since a file cut from a broadcast can open on a CRA. Nothing where it cannot be told, which is not kept,
/// so a later session asks again; and nothing for a codec this does not apply
/// to.
pub async fn opens_only_on_idr(
    ffmpeg: &str,
    artefact_root: &Path,
    path: &Path,
    codec: &str,
) -> Option<bool> {
    if !applies_to(codec) {
        return None;
    }

    let address = crate::source_address::of(path).await?;
    let kept_at = at(artefact_root, &address);

    if let Some(known) = read_kept(&kept_at).await {
        return Some(known);
    }

    let keyframes = crate::keyframe_index::read(artefact_root, path).await;
    let times = sample_times(keyframes.as_ref());

    if times.is_empty() {
        return None;
    }

    let mut reads = JoinSet::new();

    for at_seconds in times {
        reads.spawn(read_opening(
            ffmpeg.to_owned(),
            path.to_path_buf(),
            at_seconds,
        ));
    }

    let mut read_all = true;

    while let Some(read) = reads.join_next().await {
        match read.ok().flatten() {
            Some(Opening::Idr) => {}
            Some(Opening::Other) => {
                reads.abort_all();
                keep(artefact_root, &kept_at, false).await;

                return Some(false);
            }
            None => read_all = false,
        }
    }

    if !read_all {
        return None;
    }

    keep(artefact_root, &kept_at, true).await;

    Some(true)
}

/// The answer kept at a place, where there is one.
async fn read_kept(kept_at: &Path) -> Option<bool> {
    let held = tokio::fs::read_to_string(kept_at).await.ok()?;

    serde_json::from_str::<Kept>(&held)
        .ok()
        .map(|kept| kept.opens_only_on_idr)
}

/// Keeps an answer, written through a neighbouring name so a half-written one
/// is never read.
async fn keep(artefact_root: &Path, kept_at: &Path, opens_only_on_idr: bool) {
    let Ok(payload) = serde_json::to_string(&Kept { opens_only_on_idr }) else {
        return;
    };

    if tokio::fs::create_dir_all(artefact_root.join(DIRECTORY))
        .await
        .is_err()
    {
        return;
    }

    let partial = kept_at.with_extension(format!(
        "{}-{}.partial",
        std::process::id(),
        WRITES.fetch_add(1, Ordering::Relaxed)
    ));

    if tokio::fs::write(&partial, payload).await.is_ok() {
        let _ = tokio::fs::rename(&partial, kept_at).await;
    }
}

#[cfg(test)]
mod tests {
    use super::{applies_to, opening_of, reading_arguments, sample_times, Opening};
    use crate::keyframes::{Cut, Keyframes};
    use std::path::Path;

    fn keyframes(times: &[f64]) -> Keyframes {
        Keyframes {
            cuts: times
                .iter()
                .map(|&at| Cut {
                    at_seconds: at,
                    starts_at_seconds: at,
                })
                .collect(),
            starts_at_seconds: 0.0,
            duration_seconds: 1440.0,
        }
    }

    #[test]
    fn an_idr_opens_cleanly() {
        let stream = [
            0, 0, 0, 1, 0x40, 0x01, 0, 0, 0, 1, 0x42, 0x01, 0, 0, 1, 0x28, 0x01,
        ];

        assert_eq!(opening_of(&stream), Some(Opening::Idr));
    }

    #[test]
    fn a_cra_does_not() {
        let stream = [
            0, 0, 0, 1, 0x40, 0x01, 0, 0, 0, 1, 0x44, 0x01, 0, 0, 1, 0x2a, 0x01,
        ];

        assert_eq!(opening_of(&stream), Some(Opening::Other));
    }

    #[test]
    fn a_bla_does_not_either() {
        assert_eq!(opening_of(&[0, 0, 1, 0x20, 0x01]), Some(Opening::Other));
    }

    #[test]
    fn parameter_sets_alone_say_nothing() {
        assert_eq!(opening_of(&[0, 0, 1, 0x40, 0x01, 0, 0, 1, 0x42]), None);
        assert_eq!(opening_of(&[]), None);
    }

    #[test]
    fn only_hevc_is_asked_about() {
        assert!(applies_to("hevc"));
        assert!(!applies_to("h264"));
        assert!(!applies_to("av1"));
        assert!(!applies_to("vp9"));
    }

    #[test]
    fn samples_skip_the_first_keyframe_and_spread_across_the_rest() {
        let times = sample_times(Some(&keyframes(&[
            0.0, 10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0,
        ])));

        assert_eq!(times, vec![20.0, 40.0, 60.0]);
    }

    #[test]
    fn a_short_index_samples_what_it_has() {
        assert_eq!(sample_times(Some(&keyframes(&[0.0, 5.0]))), vec![5.0]);
        assert_eq!(sample_times(Some(&keyframes(&[0.0]))), Vec::<f64>::new());
    }

    #[test]
    fn without_an_index_it_looks_well_past_the_opening() {
        assert_eq!(sample_times(None), vec![60.0, 300.0, 900.0]);
    }

    #[test]
    fn the_read_copies_one_picture_out_as_a_raw_stream() {
        let arguments = reading_arguments(Path::new("/media/film.mkv"), 37.788);

        assert_eq!(
            arguments,
            [
                "-v",
                "error",
                "-nostdin",
                "-ss",
                "37.788",
                "-protocol_whitelist",
                "file,pipe",
                "-i",
                "/media/film.mkv",
                "-map",
                "0:v:0",
                "-c:v",
                "copy",
                "-frames:v",
                "1",
                "-f",
                "hevc",
                "pipe:1"
            ]
        );
    }
}
