//! Reading the words out of picture subtitles, so they play as text.
//!
//! A Blu-ray's subtitles are pictures, which no phone, browser or television
//! player draws over a stream, so choosing one used to mean burning it into
//! the video: a new session, a pause, and an encode for as long as it was on.
//! Here each picture is read by Tesseract once, in the background, and the
//! words are kept beside the file's other subtitles as `WebVTT`, which every
//! player shows instantly and styles as the viewer likes.
//!
//! Reading a film's captions takes a few minutes of work nobody is waiting
//! for, so it is started the first time anybody asks and answered as still
//! working until it is done; the picture track carries on being offered in
//! the meantime.

use std::collections::HashSet;
use std::fmt::Write as _;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::{Arc, Mutex as StdMutex, PoisonError};

use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::sync::Semaphore;

use crate::pgs::{captions, Caption};

const DIRECTORY: &str = "subtitles";

/// How many films are read at once. Each read keeps several cores busy on its
/// own, so a second would only slow the first.
const FILMS_AT_ONCE: usize = 1;

/// The ISO 639-2 bibliographic codes files often carry, and the terminology
/// codes Tesseract names its languages by.
const TESSERACT_NAMES: &[(&str, &str)] = &[
    ("fre", "fra"),
    ("ger", "deu"),
    ("dut", "nld"),
    ("cze", "ces"),
    ("gre", "ell"),
    ("rum", "ron"),
    ("slo", "slk"),
    ("ice", "isl"),
    ("per", "fas"),
    ("arm", "hye"),
    ("geo", "kat"),
    ("mac", "mkd"),
    ("alb", "sqi"),
    ("bur", "mya"),
    ("baq", "eus"),
    ("wel", "cym"),
    ("may", "msa"),
    ("chi", "chi_sim"),
    ("zho", "chi_sim"),
    ("en", "eng"),
    ("fr", "fra"),
    ("de", "deu"),
    ("es", "spa"),
    ("it", "ita"),
    ("nl", "nld"),
    ("pt", "por"),
    ("sv", "swe"),
    ("da", "dan"),
    ("no", "nor"),
    ("fi", "fin"),
    ("pl", "pol"),
    ("ru", "rus"),
    ("ja", "jpn"),
    ("ko", "kor"),
    ("cs", "ces"),
    ("uk", "ukr"),
    ("tr", "tur"),
    ("el", "ell"),
    ("he", "heb"),
    ("ar", "ara"),
    ("zh", "chi_sim"),
];

/// What a caller asks to be read.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PictureSubtitleRequest {
    #[serde(deserialize_with = "crate::path_map::deserialize")]
    pub input_path: String,
    /// The stream to read, as ffprobe numbered it.
    pub stream_index: u32,
    /// The track's language, as the file names it, where it names one.
    #[serde(default)]
    pub language: Option<String>,
}

/// Where a read has got to.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase", tag = "state")]
pub enum PictureSubtitleState {
    /// Read, and these are the words.
    Ready { content: String },
    /// Being read, or waiting its turn to be.
    Working,
    /// Cannot be read here: no Tesseract, no data for the language, or a
    /// track that is not PGS.
    Unavailable,
}

/// The reads under way, so one track is never read twice at once.
#[derive(Clone)]
pub struct PictureSubtitleRegistry {
    working: Arc<StdMutex<HashSet<PathBuf>>>,
    slots: Arc<Semaphore>,
}

impl Default for PictureSubtitleRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl PictureSubtitleRegistry {
    #[must_use]
    pub fn new() -> Self {
        Self {
            working: Arc::new(StdMutex::new(HashSet::new())),
            slots: Arc::new(Semaphore::new(FILMS_AT_ONCE)),
        }
    }

    /// Answers with the words of a picture track where they have been read,
    /// and otherwise starts reading them in the background.
    pub async fn read_or_start(
        &self,
        ffmpeg: &str,
        artefact_root: &Path,
        path: PathBuf,
        stream_index: u32,
        language: Option<&str>,
    ) -> PictureSubtitleState {
        let Some(address) = crate::source_address::of(&path).await else {
            return PictureSubtitleState::Unavailable;
        };
        let directory = artefact_root.join(DIRECTORY).join(&address);
        let kept = kept_at(&directory, stream_index);

        if let Ok(content) = tokio::fs::read_to_string(&kept).await {
            return if content.trim().len() > "WEBVTT".len() {
                PictureSubtitleState::Ready { content }
            } else {
                PictureSubtitleState::Unavailable
            };
        }

        let Some(reader) = tesseract_language(language).await else {
            return PictureSubtitleState::Unavailable;
        };

        {
            let mut working = self.working.lock().unwrap_or_else(PoisonError::into_inner);

            if !working.insert(kept.clone()) {
                return PictureSubtitleState::Working;
            }
        }

        let registry = self.clone();
        let ffmpeg = ffmpeg.to_owned();

        tokio::spawn(async move {
            let permit = registry.slots.clone().acquire_owned().await;
            let outcome = read_track(&ffmpeg, &path, stream_index, &reader).await;

            match outcome {
                Ok(vtt) => keep(&directory, &kept, &vtt).await,
                Err(reason) => {
                    tracing::warn!(path = %path.display(), stream_index, "could not read picture subtitles: {reason}");
                    keep(&directory, &kept, "WEBVTT\n").await;
                }
            }

            drop(permit);
            registry
                .working
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .remove(&kept);
        });

        PictureSubtitleState::Working
    }
}

/// Where a track's words are kept once read.
fn kept_at(directory: &Path, stream_index: u32) -> PathBuf {
    directory.join(format!("{stream_index}.pictures.vtt"))
}

/// Writes a finished track where it is kept, by way of a partial file so a
/// crash never leaves half a track that looks whole.
async fn keep(directory: &Path, kept: &Path, content: &str) {
    if tokio::fs::create_dir_all(directory).await.is_err() {
        return;
    }

    let partial = kept.with_extension("vtt.partial");

    if tokio::fs::write(&partial, content).await.is_ok() {
        let _ = tokio::fs::rename(&partial, kept).await;
    }
}

/// The name Tesseract knows a track's language by, where its data for that
/// language is installed: English for a track that names none.
async fn tesseract_language(language: Option<&str>) -> Option<String> {
    let asked = language
        .map(str::trim)
        .filter(|named| !named.is_empty() && *named != "und");
    let wanted = asked.map_or_else(
        || "eng".to_owned(),
        |named| {
            let lowered = named.to_lowercase();

            TESSERACT_NAMES
                .iter()
                .find(|(file, _)| *file == lowered)
                .map_or(lowered, |(_, reader)| (*reader).to_owned())
        },
    );
    let listed = Command::new(tesseract())
        .arg("--list-langs")
        .kill_on_drop(true)
        .output()
        .await
        .ok()?;
    let installed = String::from_utf8_lossy(&listed.stdout).into_owned()
        + &String::from_utf8_lossy(&listed.stderr);

    installed
        .lines()
        .any(|line| line.trim() == wanted)
        .then_some(wanted)
}

/// The Tesseract to run.
fn tesseract() -> String {
    std::env::var("VALENCE_TESSERACT").unwrap_or_else(|_| "tesseract".to_owned())
}

/// Reads every caption of one track and writes them out as `WebVTT`.
async fn read_track(
    ffmpeg: &str,
    path: &Path,
    stream_index: u32,
    language: &str,
) -> Result<String, String> {
    let output = Command::new(ffmpeg)
        .args([
            "-nostdin",
            "-v",
            "error",
            "-i",
            &path.display().to_string(),
            "-map",
            &format!("0:{stream_index}"),
            "-c:s",
            "copy",
            "-f",
            "sup",
            "-",
        ])
        .kill_on_drop(true)
        .output()
        .await
        .map_err(|failure| failure.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
    }

    let found = captions(&output.stdout);
    let readers = std::thread::available_parallelism()
        .map_or(2, std::num::NonZeroUsize::get)
        .clamp(1, 6);
    let lines = Arc::new(Semaphore::new(readers));
    let mut reading = Vec::with_capacity(found.len());

    for caption in found {
        let lines = lines.clone();
        let language = language.to_owned();

        reading.push(tokio::spawn(async move {
            let _permit = lines.acquire_owned().await;
            let words = read_caption(&caption, &language).await;

            (caption.start_ms, caption.end_ms, words)
        }));
    }

    let mut cues = Vec::new();

    for one in reading {
        if let Ok((start, end, Some(words))) = one.await {
            cues.push((start, end, words));
        }
    }

    Ok(as_webvtt(&cues))
}

/// Reads the words of one caption, or nothing where there are none to read.
async fn read_caption(caption: &Caption, language: &str) -> Option<String> {
    let mut child = Command::new(tesseract())
        .args(["stdin", "stdout", "-l", language, "--psm", "6"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .kill_on_drop(true)
        .spawn()
        .ok()?;

    let mut input = child.stdin.take()?;
    let picture = caption.as_pgm();

    input.write_all(&picture).await.ok()?;
    drop(input);

    let output = child.wait_with_output().await.ok()?;
    let words = tidy(&String::from_utf8_lossy(&output.stdout));

    (!words.is_empty()).then_some(words)
}

/// Mends what a reader of printed text gets wrong about subtitles: a capital
/// I read as a bar, stray marks from the outline, and blank lines.
fn tidy(read: &str) -> String {
    read.lines()
        .map(|line| {
            line.trim()
                .replace('|', "I")
                .replace(['“', '”'], "\"")
                .replace(['‘', '’'], "'")
        })
        .filter(|line| line.chars().any(char::is_alphanumeric))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Formats a time as `WebVTT` writes it.
fn timestamp(ms: u64) -> String {
    format!(
        "{:02}:{:02}:{:02}.{:03}",
        ms / 3_600_000,
        (ms / 60_000) % 60,
        (ms / 1_000) % 60,
        ms % 1_000
    )
}

/// Writes cues out as a `WebVTT` track.
fn as_webvtt(cues: &[(u64, u64, String)]) -> String {
    let mut out = String::from("WEBVTT\n");

    for (start, end, words) in cues {
        let _ = write!(
            out,
            "\n{} --> {}\n{}\n",
            timestamp(*start),
            timestamp(*end),
            words
        );
    }

    out
}

#[cfg(test)]
mod tests {
    use super::{as_webvtt, tidy, timestamp};

    #[test]
    fn writes_times_as_webvtt_does() {
        assert_eq!(timestamp(3_723_045), "01:02:03.045");
    }

    #[test]
    fn writes_each_cue_with_its_times_and_words() {
        let written = as_webvtt(&[(1_000, 2_500, "Hello there.".to_owned())]);

        assert_eq!(
            written,
            "WEBVTT\n\n00:00:01.000 --> 00:00:02.500\nHello there.\n"
        );
    }

    #[test]
    fn mends_a_capital_i_read_as_a_bar_and_drops_stray_marks() {
        assert_eq!(
            tidy("| don't know.\n  .,\n\nWhere?"),
            "I don't know.\nWhere?"
        );
    }
}
