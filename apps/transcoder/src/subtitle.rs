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
use std::sync::{Arc, Mutex as StdMutex, PoisonError};

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::process::Command;
use tokio::sync::{Mutex, OwnedMutexGuard, OwnedSemaphorePermit, Semaphore};

const DIRECTORY: &str = "subtitles";

/// How many files may be read for their subtitles at once.
///
/// A read runs to its end once begun, whether or not anybody still wants it,
/// so somebody skipping through a season would otherwise leave a whole-file
/// read behind on every episode, all of them fighting the film being watched
/// for the same disk.
const READS_AT_ONCE: usize = 2;

/// What a caller asks to be pulled out of a container.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtitleRequest {
    #[serde(deserialize_with = "crate::path_map::deserialize")]
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

/// Keeps one file from being read for its subtitles twice at once, and only
/// a few files at all.
///
/// A player asks for a track the moment it is chosen, and choosing a second
/// while the first is still coming out is ordinary. Without this each request
/// starts its own read of the whole file, and the disk serves both at half
/// the speed.
#[derive(Clone)]
pub struct SubtitleRegistry {
    reading: Arc<StdMutex<HashMap<String, Arc<Mutex<()>>>>>,
    slots: Arc<Semaphore>,
}

impl Default for SubtitleRegistry {
    fn default() -> Self {
        Self {
            reading: Arc::default(),
            slots: Arc::new(Semaphore::new(READS_AT_ONCE)),
        }
    }
}

/// The right to read one file, given up when it is dropped — however the
/// read ends, including by the request behind it going away.
struct Claim {
    reading: Arc<StdMutex<HashMap<String, Arc<Mutex<()>>>>>,
    address: String,
    guard: Option<OwnedMutexGuard<()>>,
}

impl Drop for Claim {
    fn drop(&mut self) {
        self.guard.take();

        let mut reading = self.reading.lock().unwrap_or_else(PoisonError::into_inner);

        if reading
            .get(&self.address)
            .is_some_and(|lock| Arc::strong_count(lock) == 1)
        {
            reading.remove(&self.address);
        }
    }
}

impl SubtitleRegistry {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Waits for any read of this file already under way, then takes the next.
    async fn claim(&self, address: &str) -> Claim {
        let lock = self
            .reading
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .entry(address.to_owned())
            .or_default()
            .clone();

        Claim {
            reading: Arc::clone(&self.reading),
            address: address.to_owned(),
            guard: Some(lock.lock_owned().await),
        }
    }

    /// Waits for room to read another file.
    async fn slot(&self) -> Result<OwnedSemaphorePermit, SubtitleError> {
        self.slots
            .clone()
            .acquire_owned()
            .await
            .map_err(|_| SubtitleError::Failed("subtitle reading has stopped".to_owned()))
    }

    /// One text track of a file as `WebVTT`, read out of the container only
    /// if no earlier request already did.
    ///
    /// A track already kept is answered at once. Otherwise this waits for
    /// any read of the same file to finish, which usually answers it, and
    /// only then for one of a few reading slots, so a second request for a
    /// file never holds a slot another file could use. Waiting is the part a
    /// caller may give up on. Once its turn comes the read runs as a task of
    /// its own, so a viewer who closes the player partway does not stop it:
    /// the file has been read that far already, and finishing is what keeps
    /// it from being read again.
    ///
    /// The first read of a file takes every text track it carries, so the
    /// rest are already waiting when they are asked for. Where that fails —
    /// one track ffmpeg cannot convert fails them all — or the file's header
    /// does not list the track asked for as text, that track is read on its
    /// own, so one bad track never costs a viewer the one they wanted.
    ///
    /// # Errors
    ///
    /// Returns [`SubtitleError`] when ffmpeg cannot be started, it refuses the
    /// stream, or the stream turns out to hold nothing.
    pub async fn read(
        &self,
        tools: Tools,
        artefact_root: &Path,
        path: PathBuf,
        stream_index: u32,
    ) -> Result<SubtitleTrack, SubtitleError> {
        let Some(address) = crate::source_address::of(&path).await else {
            let slot = self.slot().await?;

            return finish(async move {
                let _slot = slot;

                extract_subtitle(&tools.ffmpeg, &path, stream_index).await
            })
            .await;
        };

        let directory = artefact_root.join(DIRECTORY).join(&address);

        if let Some(found) = kept(&directory, stream_index).await {
            return found;
        }

        let claim = self.claim(&address).await;

        if let Some(found) = kept(&directory, stream_index).await {
            return found;
        }

        let slot = self.slot().await?;

        finish(async move {
            let _claim = claim;
            let _slot = slot;

            read_into(&tools, &directory, &path, stream_index).await
        })
        .await
    }
}

/// Runs a read as a task of its own, so dropping the caller does not stop it.
async fn finish(
    read: impl std::future::Future<Output = Result<SubtitleTrack, SubtitleError>> + Send + 'static,
) -> Result<SubtitleTrack, SubtitleError> {
    tokio::spawn(read)
        .await
        .map_err(|failure| SubtitleError::Failed(failure.to_string()))?
}

/// Reads a file's text tracks into the directory kept for it.
async fn read_into(
    tools: &Tools,
    directory: &Path,
    path: &Path,
    stream_index: u32,
) -> Result<SubtitleTrack, SubtitleError> {
    tokio::fs::create_dir_all(directory)
        .await
        .map_err(SubtitleError::Spawn)?;

    let indices = text_tracks(&tools.ffprobe, path).await;

    if !indices.contains(&stream_index)
        || extract_all(&tools.ffmpeg, path, &indices, directory)
            .await
            .is_err()
    {
        let content = extract_subtitle(&tools.ffmpeg, path, stream_index)
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

/// The programs a read needs.
#[derive(Clone)]
pub struct Tools {
    pub ffmpeg: String,
    pub ffprobe: String,
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
    use super::{extract_all_arguments, extract_arguments, SubtitleRegistry, READS_AT_ONCE};
    use std::path::Path;
    use std::time::Duration;

    #[tokio::test]
    async fn reads_only_a_few_files_at_once() {
        let registry = SubtitleRegistry::new();
        let mut taken = Vec::new();

        for _ in 0..READS_AT_ONCE {
            taken.push(registry.slot().await.expect("has room"));
        }

        let waiting = tokio::time::timeout(Duration::from_millis(50), registry.slot()).await;

        assert!(waiting.is_err(), "a read past the limit must wait");

        taken.pop();

        let admitted = tokio::time::timeout(Duration::from_millis(50), registry.slot()).await;

        assert!(matches!(admitted, Ok(Ok(_))), "a finished read makes room");
    }

    #[tokio::test]
    async fn waits_for_a_read_of_the_same_file_but_not_of_another() {
        let registry = SubtitleRegistry::new();
        let first = registry.claim("film").await;

        let same = tokio::time::timeout(Duration::from_millis(50), registry.claim("film")).await;
        let other = tokio::time::timeout(Duration::from_millis(50), registry.claim("other")).await;

        assert!(same.is_err(), "a second read of one file must wait");
        assert!(other.is_ok(), "another file must not wait on it");

        drop(first);
    }

    #[tokio::test]
    async fn forgets_a_file_once_nobody_is_reading_it() {
        let registry = SubtitleRegistry::new();

        drop(registry.claim("film").await);

        assert!(registry.reading.lock().expect("not poisoned").is_empty());
    }

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
