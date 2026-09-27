//! Reading a file's text subtitles out of its container.
//!
//! A track embedded in Matroska is not kept in one place: each cue is a packet
//! filed beside the frames it plays over, spread from one end of the file to
//! the other. Collecting them means reading every byte of the video between
//! them, which is minutes on a large remux on spinning disks — however little
//! text there turns out to be.
//!
//! So a file is read once. Every text track it carries comes out of that one
//! pass, since thirty languages cost no more to collect than one, and each is
//! kept under the file's [`source_address`](crate::source_address) so no
//! viewer, and no other track, pays for that read again.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::process::Command;
use tokio::sync::{Mutex, OwnedMutexGuard};

const DIRECTORY: &str = "subtitles";

/// What a caller asks to be pulled out of a container.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleRequest {
    pub input_path: String,
    /// The stream to take, as ffprobe numbered it.
    pub stream_index: u32,
}

/// A track pulled out of a container.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleTrack {
    /// The whole track as `WebVTT`.
    pub content: String,
}

/// Why a track could not be read.
#[derive(Debug, Error)]
pub enum SubtitleError {
    #[error("could not start ffmpeg: {0}")]
    Spawn(std::io::Error),
    #[error("ffmpeg could not read that subtitle stream: {0}")]
    Failed(String),
    #[error("that subtitle stream is empty")]
    Empty,
}

/// The arguments that convert one embedded track to `WebVTT`.
///
/// Only the one stream is mapped and nothing else is decoded, so this reads
/// the subtitle packets and skips the video entirely — a feature length film
/// converts in about a second rather than in the minutes a re-encode takes.
#[must_use]
pub fn extract_arguments(path: &Path, stream_index: u32) -> Vec<String> {
    vec![
        "-nostdin".to_owned(),
        "-loglevel".to_owned(),
        "error".to_owned(),
        "-i".to_owned(),
        path.to_string_lossy().into_owned(),
        "-map".to_owned(),
        format!("0:{stream_index}"),
        "-c:s".to_owned(),
        "webvtt".to_owned(),
        "-f".to_owned(),
        "webvtt".to_owned(),
        "-".to_owned(),
    ]
}

/// The arguments that convert every listed track to `WebVTT` in one read.
///
/// One output per track, each written beside the others under a name ending
/// `.partial` so nothing reads a track still being written.
#[must_use]
pub fn extract_all_arguments(path: &Path, stream_indices: &[u32], directory: &Path) -> Vec<String> {
    let mut arguments = vec![
        "-nostdin".to_owned(),
        "-y".to_owned(),
        "-loglevel".to_owned(),
        "error".to_owned(),
        "-i".to_owned(),
        path.to_string_lossy().into_owned(),
    ];

    for index in stream_indices {
        arguments.extend([
            "-map".to_owned(),
            format!("0:{index}"),
            "-c:s".to_owned(),
            "webvtt".to_owned(),
            "-f".to_owned(),
            "webvtt".to_owned(),
            partial_at(directory, *index).to_string_lossy().into_owned(),
        ]);
    }

    arguments
}

/// Where a finished track is kept.
fn kept_at(directory: &Path, stream_index: u32) -> PathBuf {
    directory.join(format!("{stream_index}.vtt"))
}

/// Where a track is written before it is finished.
fn partial_at(directory: &Path, stream_index: u32) -> PathBuf {
    directory.join(format!("{stream_index}.vtt.partial"))
}

/// Answers from what an earlier read kept, where there is anything.
async fn kept(directory: &Path, stream_index: u32) -> Option<Result<SubtitleTrack, SubtitleError>> {
    let content = tokio::fs::read_to_string(kept_at(directory, stream_index))
        .await
        .ok()?;

    Some(as_track(content))
}

/// Refuses a track that converted to nothing but its header.
fn as_track(content: String) -> Result<SubtitleTrack, SubtitleError> {
    if content.trim().len() <= "WEBVTT".len() {
        return Err(SubtitleError::Empty);
    }

    Ok(SubtitleTrack { content })
}

/// Keeps one file from being read for its subtitles twice at once.
///
/// A player asks for a track the moment it is chosen, and choosing a second
/// while the first is still coming out is ordinary. Without this each request
/// starts its own read of the whole file, and the disk serves both at half
/// the speed.
#[derive(Clone, Default)]
pub struct SubtitleRegistry {
    reading: Arc<Mutex<HashMap<String, Arc<Mutex<()>>>>>,
}

impl SubtitleRegistry {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Waits for any read of this file already under way, then takes the next.
    async fn hold(&self, address: &str) -> OwnedMutexGuard<()> {
        let lock = self
            .reading
            .lock()
            .await
            .entry(address.to_owned())
            .or_default()
            .clone();

        lock.lock_owned().await
    }

    /// Forgets a file nobody else is waiting to read.
    async fn release(&self, address: &str, guard: OwnedMutexGuard<()>) {
        drop(guard);

        let mut reading = self.reading.lock().await;

        if reading
            .get(address)
            .is_some_and(|lock| Arc::strong_count(lock) == 1)
        {
            reading.remove(address);
        }
    }

    /// One text track of a file as `WebVTT`, read out of the container only
    /// if no earlier request already did.
    ///
    /// The first request for any track reads every text track the file
    /// carries, so the rest are already waiting when they are asked for.
    /// Where that fails — one track ffmpeg cannot convert fails them all — or
    /// the file's header does not list the track asked for as text, that track
    /// is read on its own, so one bad track never costs a viewer the one they
    /// wanted.
    ///
    /// # Errors
    ///
    /// Returns [`SubtitleError`] when ffmpeg cannot be started, it refuses the
    /// stream, or the stream turns out to hold nothing.
    pub async fn read(
        &self,
        tools: Tools<'_>,
        artefact_root: &Path,
        path: &Path,
        stream_index: u32,
    ) -> Result<SubtitleTrack, SubtitleError> {
        let Some(address) = crate::source_address::of(path).await else {
            return extract_subtitle(tools.ffmpeg, path, stream_index).await;
        };

        let directory = artefact_root.join(DIRECTORY).join(&address);

        if let Some(found) = kept(&directory, stream_index).await {
            return found;
        }

        let guard = self.hold(&address).await;
        let outcome = self
            .read_holding(tools, &directory, path, stream_index)
            .await;

        self.release(&address, guard).await;

        outcome
    }

    /// Reads a file's text tracks into the directory kept for it, where the
    /// track asked for is not there already.
    async fn read_holding(
        &self,
        tools: Tools<'_>,
        directory: &Path,
        path: &Path,
        stream_index: u32,
    ) -> Result<SubtitleTrack, SubtitleError> {
        if let Some(found) = kept(directory, stream_index).await {
            return found;
        }

        tokio::fs::create_dir_all(directory)
            .await
            .map_err(SubtitleError::Spawn)?;

        let indices = text_tracks(tools.ffprobe, path).await;

        if !indices.contains(&stream_index)
            || extract_all(tools.ffmpeg, path, &indices, directory)
                .await
                .is_err()
        {
            let content = extract_subtitle(tools.ffmpeg, path, stream_index)
                .await
                .map(|track| track.content)
                .or_else(|failure| match failure {
                    SubtitleError::Empty => Ok(String::new()),
                    other => Err(other),
                })?;

            keep(directory, stream_index, &content).await;

            return as_track(content);
        }

        kept(directory, stream_index)
            .await
            .unwrap_or(Err(SubtitleError::Empty))
    }
}

/// The programs a read needs.
#[derive(Clone, Copy)]
pub struct Tools<'a> {
    pub ffmpeg: &'a str,
    pub ffprobe: &'a str,
}

/// Every text track a file carries, by stream index.
///
/// Read from the header, which is quick. A file that cannot be probed gives
/// none, and the caller reads only the track it was asked for.
async fn text_tracks(ffprobe: &str, path: &Path) -> Vec<u32> {
    crate::probe::probe_media(ffprobe, path)
        .await
        .map(|probe| {
            probe
                .subtitle_streams
                .iter()
                .filter(|stream| !stream.is_image_based)
                .map(|stream| stream.index)
                .collect()
        })
        .unwrap_or_default()
}

/// Converts every listed track in one read of the file, moving each into
/// place once ffmpeg has finished with all of them.
async fn extract_all(
    ffmpeg: &str,
    path: &Path,
    stream_indices: &[u32],
    directory: &Path,
) -> Result<(), SubtitleError> {
    let output = Command::new(ffmpeg)
        .args(extract_all_arguments(path, stream_indices, directory))
        .kill_on_drop(true)
        .output()
        .await
        .map_err(SubtitleError::Spawn)?;

    if !output.status.success() {
        for index in stream_indices {
            let _ = tokio::fs::remove_file(partial_at(directory, *index)).await;
        }

        return Err(SubtitleError::Failed(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }

    for index in stream_indices {
        let _ = tokio::fs::rename(partial_at(directory, *index), kept_at(directory, *index)).await;
    }

    Ok(())
}

/// Keeps one track read on its own.
async fn keep(directory: &Path, stream_index: u32, content: &str) {
    let partial = partial_at(directory, stream_index);

    if tokio::fs::write(&partial, content).await.is_ok() {
        let _ = tokio::fs::rename(&partial, kept_at(directory, stream_index)).await;
    }
}

/// Reads one subtitle stream out of a container as `WebVTT`.
///
/// Text tracks only. A picture based track — PGS or `VobSub` — carries images
/// rather than characters and cannot become text at all; those are burned into
/// the video instead, which is decided when playback is negotiated.
///
/// # Errors
///
/// Returns [`SubtitleError`] when ffmpeg cannot be started, it refuses the
/// stream, or the stream turns out to hold nothing.
pub async fn extract_subtitle(
    ffmpeg: &str,
    path: &Path,
    stream_index: u32,
) -> Result<SubtitleTrack, SubtitleError> {
    let output = Command::new(ffmpeg)
        .args(extract_arguments(path, stream_index))
        .kill_on_drop(true)
        .output()
        .await
        .map_err(SubtitleError::Spawn)?;

    if !output.status.success() {
        return Err(SubtitleError::Failed(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }

    as_track(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[cfg(test)]
mod tests {
    use super::{extract_all_arguments, extract_arguments};
    use std::path::Path;

    #[test]
    fn reads_every_track_in_one_pass() {
        let arguments =
            extract_all_arguments(Path::new("/media/film.mkv"), &[2, 3, 7], Path::new("/kept"));

        assert_eq!(
            arguments
                .iter()
                .filter(|argument| *argument == "-i")
                .count(),
            1
        );
        assert_eq!(
            arguments
                .iter()
                .filter(|argument| *argument == "-map")
                .count(),
            3
        );
        assert!(arguments.iter().any(|argument| argument == "0:7"));
    }

    #[test]
    fn writes_each_track_beside_the_others_until_it_is_finished() {
        let arguments =
            extract_all_arguments(Path::new("/media/film.mkv"), &[2, 3], Path::new("/kept"));

        assert!(arguments
            .iter()
            .any(|argument| argument == "/kept/2.vtt.partial"));
        assert!(arguments
            .iter()
            .any(|argument| argument == "/kept/3.vtt.partial"));
    }

    #[test]
    fn writes_over_a_partial_track_a_crashed_read_left_behind() {
        let arguments =
            extract_all_arguments(Path::new("/media/film.mkv"), &[2], Path::new("/kept"));

        assert!(arguments.iter().any(|argument| argument == "-y"));
    }

    #[test]
    fn maps_only_the_stream_it_was_asked_for() {
        let arguments = extract_arguments(Path::new("/media/film.mkv"), 3);

        let map = arguments.iter().position(|argument| argument == "-map");

        assert_eq!(arguments[map.expect("maps") + 1], "0:3");
    }

    #[test]
    fn writes_webvtt_to_standard_output() {
        let arguments = extract_arguments(Path::new("/media/film.mkv"), 2);

        assert_eq!(arguments.last().map(String::as_str), Some("-"));
        assert!(arguments.iter().any(|argument| argument == "webvtt"));
    }

    #[test]
    fn never_waits_on_standard_input() {
        let arguments = extract_arguments(Path::new("/media/film.mkv"), 0);

        assert_eq!(arguments.first().map(String::as_str), Some("-nostdin"));
    }
}
