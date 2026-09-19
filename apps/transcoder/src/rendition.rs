//! Whole files, written where a library will keep them.
//!
//! The third shape a transcode comes in, and the only one that leaves the service's own directories.
//! A session writes segments a player pulls as it goes; a download writes one progressive MP4 into
//! the cache. Both are the service's to throw away. This writes into the operator's media
//! directories, which it has never done before, and one of the two things it is for is taking the
//! place of somebody's only copy of a film.
//!
//! So the discipline is stricter than anywhere else here, and the order is not negotiable. Encode
//! to a working name nothing reads. Verify what came out — probe it, and decode it, because ffmpeg
//! exiting zero having written a corrupt file is a real occurrence and not a hypothetical one. Only
//! then rename it into place. On any failure the working file goes and whatever was there before is
//! untouched, because it was never moved.
//!
//! Nothing here deletes an original. That decision belongs to a person who has watched the result,
//! and it is made somewhere else entirely.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::download::{progress_from, rate, written_from};
use crate::integrity::decodes;
use crate::probe::{probe_colour, probe_media};
use crate::steps_aside::steps_aside;
use crate::transcode_plan::{SessionSpec, TrackCarry, TranscodePlan};

/// What a working file is called while it is being written.
///
/// Not a media extension, deliberately. A rendition is written inside the library tree, and the
/// scanner walks every file there — one named `.mkv` while half of it existed would be indexed as
/// a second, broken copy of the film. Two guards rather than one: this, and the directory it sits
/// in.
pub const WORKING_SUFFIX: &str = "valencepart";

/// How far a finished file's runtime may sit from the source's before it is refused.
///
/// A re-encode does not land on the same duration to the millisecond — the last frame lands where
/// the frame rate puts it — but it lands close. Anything a second or more out has lost something,
/// and a file truncated by a full disk or a killed process is the case this exists to catch.
const DURATION_TOLERANCE_SECONDS: f64 = 1.0;

/// What a rendition is asked for.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenditionRequest {
    /// How the picture should be produced, decided the same way a session's is.
    pub spec: SessionSpec,
    /// Every track, chapter and colour declaration to carry across.
    #[serde(default)]
    pub carry: TrackCarry,
    /// How long the source runs, so progress can be a fraction and the result can be checked
    /// against it.
    pub duration_seconds: f64,
    /// Where the finished file belongs, in full.
    ///
    /// Supplied by the caller rather than derived from a hash, because this one is not a cache: it
    /// has a place in somebody's library and a name a person will read. The caller is responsible
    /// for it being somewhere the service is allowed to write.
    pub output_path: String,
    /// Where a sample starts, in seconds.
    #[serde(default)]
    pub from_seconds: u32,
    /// How much to write, for a sample, or nothing for the whole film.
    #[serde(default)]
    pub for_seconds: Option<u32>,
}

impl RenditionRequest {
    /// What to call this piece of work while it is under way.
    ///
    /// The destination rather than a hash of the settings. Two requests writing to one path are the
    /// same work whatever they were asked for, and must never run at once; two writing to different
    /// paths are different work even if the settings match.
    #[must_use]
    pub fn id(&self) -> String {
        self.output_path.clone()
    }

    /// Whether this is a sixty second look rather than the whole film.
    #[must_use]
    pub fn is_sample(&self) -> bool {
        self.for_seconds.is_some()
    }

    /// How long the finished file should run.
    #[must_use]
    pub fn expected_seconds(&self) -> f64 {
        match self.for_seconds {
            Some(seconds) => f64::from(seconds).min(self.duration_seconds),
            None => self.duration_seconds,
        }
    }
}

/// Where a rendition has got to.
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RenditionFile {
    pub id: String,
    pub is_ready: bool,
    /// How far through, from nought to a hundred.
    pub progress: u8,
    pub bytes_per_second: Option<u64>,
    pub size_bytes: Option<u64>,
    /// Why the last attempt failed, where one did and nobody has been told yet.
    pub failure: Option<String>,
}

/// A rendition, as a piece of work on [`crate::queue::WorkQueue`].
pub struct RenditionJob {
    subject: String,
}

impl RenditionJob {
    #[must_use]
    pub fn new(subject: impl Into<String>) -> Self {
        Self {
            subject: subject.into(),
        }
    }
}

impl crate::queue::Job for RenditionJob {
    fn kind(&self) -> &'static str {
        "renditions"
    }

    fn subject(&self) -> String {
        self.subject.clone()
    }
}

/// What can go wrong producing one.
#[derive(Debug, Error)]
pub enum RenditionError {
    #[error("the destination directory could not be made: {0}")]
    Directory(std::io::Error),
    #[error("ffmpeg could not be started: {0}")]
    Spawn(std::io::Error),
    #[error("the encode failed: {0}")]
    Failed(String),
    #[error("the encode was stopped")]
    Stopped,
    #[error("the encode finished but is not fit to keep: {0}")]
    NotVerified(String),
    #[error("the finished file could not be moved into place: {0}")]
    Rename(std::io::Error),
}

/// Where the file is written while it is being written.
#[must_use]
pub fn working_path(output: &Path) -> PathBuf {
    let mut name = output.as_os_str().to_owned();

    name.push(".");
    name.push(WORKING_SUFFIX);

    PathBuf::from(name)
}

/// The muxer flags a container wants, beyond what the encode itself decides.
///
/// Only MP4 has anything to say: its index is written at the end unless it is asked otherwise, and
/// a file whose index is at the end cannot start playing until all of it has arrived.
///
/// Asked of where the file is going rather than of the name it is being written under, which
/// carries no extension a muxer would recognise.
#[must_use]
pub fn container_arguments(output: &Path) -> Vec<String> {
    let extension = output
        .extension()
        .map(|found| found.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    if matches!(extension.as_str(), "mp4" | "m4v" | "mov") {
        return vec!["-movflags".to_owned(), "+faststart".to_owned()];
    }

    Vec::new()
}

/// Which muxer to write with, named rather than left to be guessed.
///
/// ffmpeg picks a muxer from the output filename, and the file is deliberately written under a name
/// no scanner would take for media — which is also a name ffmpeg has never heard of. Left to guess,
/// it refuses to open the output at all: "unable to choose an output format, use a standard
/// extension or specify the format manually". This is specifying it manually.
///
/// Read from where the file is going rather than from where it is being written, which is the same
/// mistake in a second place: the working name carries none of the facts the muxer is chosen from.
///
/// Every container the library scanner will index has an entry. Anything else says nothing and
/// lets ffmpeg try, since a wrong muxer is worse than an absent one — it would write a file the
/// streams do not fit in.
#[must_use]
pub fn format_arguments(output: &Path) -> Vec<String> {
    let extension = output
        .extension()
        .map(|found| found.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let format = match extension.as_str() {
        "mkv" => "matroska",
        "mp4" | "m4v" => "mp4",
        "mov" => "mov",
        "webm" => "webm",
        "ts" | "m2ts" | "mts" => "mpegts",
        "avi" => "avi",
        "mpg" | "mpeg" => "mpeg",
        "wmv" => "asf",
        "flv" => "flv",
        "ogv" => "ogg",
        "3gp" => "3gp",
        _ => return Vec::new(),
    };

    vec!["-f".to_owned(), format.to_owned()]
}

/// The whole command, from the banner to the file it writes.
#[must_use]
pub fn rendition_arguments(
    plan: &TranscodePlan,
    request: &RenditionRequest,
    working: &Path,
) -> Vec<String> {
    let output = PathBuf::from(&request.output_path);

    let mut args =
        plan.to_rendition_args(&request.carry, request.from_seconds, request.for_seconds);

    args.push("-progress".to_owned());
    args.push("pipe:1".to_owned());
    args.extend(container_arguments(&output));
    args.extend(format_arguments(&output));
    args.push("-y".to_owned());
    args.push(working.to_string_lossy().into_owned());

    args
}

/// Whether what came out is fit to take the place of what went in.
///
/// Two questions, and both have to be asked. The probe answers whether the file says the right
/// things — the right runtime, the tracks that were asked for, a picture at all. The decode answers
/// whether the bytes behind those claims are sound, which no amount of reading headers can. An
/// encoder under contention can hand back a bitstream whose headers disagree with their contents,
/// and the container is written around it all the same: the right duration, the right dimensions,
/// and black on play.
///
/// Neither is a check on whether the encode is any *good*. Whether the grain turned to mush and
/// whether the picture went grey cannot be determined by probing and cannot be determined from a
/// file size. That needs eyes, and it happens after this.
///
/// # Errors
///
/// Returns what is wrong with the file, in words somebody reading a failed job would understand.
pub async fn verify(
    ffmpeg: &str,
    ffprobe: &str,
    written: &Path,
    request: &RenditionRequest,
) -> Result<u64, String> {
    let size = tokio::fs::metadata(written)
        .await
        .map_err(|error| format!("the file could not be read back: {error}"))?
        .len();

    if size == 0 {
        return Err("the file came out empty".to_owned());
    }

    let probe = probe_media(ffprobe, written)
        .await
        .map_err(|error| format!("the file could not be probed: {error}"))?;

    if probe.video.is_none() {
        return Err("the file came out with no picture in it".to_owned());
    }

    let expected = request.expected_seconds();
    let drift = (probe.duration_seconds - expected).abs();

    if drift > DURATION_TOLERANCE_SECONDS {
        return Err(format!(
            "the file runs {:.1}s where {expected:.1}s was expected, so something was lost",
            probe.duration_seconds
        ));
    }

    let wanted_audio = request.carry.audio.len();

    if probe.audio_streams.len() != wanted_audio {
        return Err(format!(
            "the file carries {} audio tracks where {wanted_audio} were asked for",
            probe.audio_streams.len()
        ));
    }

    let wanted_subtitles = request.carry.subtitle_stream_indexes.len();

    if probe.subtitle_streams.len() != wanted_subtitles {
        return Err(format!(
            "the file carries {} subtitle tracks where {wanted_subtitles} were asked for",
            probe.subtitle_streams.len()
        ));
    }

    decodes(ffmpeg, written).await?;

    Ok(size)
}

/// Produces the rendition, reporting how far through it is as it goes.
///
/// Encoded politely, so that a film somebody is watching always wins a contended processor. A
/// rendition runs for minutes against a household that is using the machine now, and the one thing
/// it must never do is make somebody's evening stutter to save disk overnight. It still takes
/// everything going spare, and gives it up the moment anything else wants it.
///
/// The source's colour is read here rather than sent by the caller. It is a fact about the file,
/// this is the process holding ffprobe, and carrying it through is what stops a PQ source coming
/// back grey — a failure that passes every automated check because the file is perfectly valid. A
/// caller that stated its own is believed, which is what makes the argument building testable
/// without a file on disk.
///
/// # Errors
///
/// Returns [`RenditionError`] when the destination cannot be made, ffmpeg cannot be started or
/// fails, the caller stopped it, what came out is not fit to keep, or it could not be moved into
/// place.
pub async fn generate(
    ffmpeg: &str,
    ffprobe: &str,
    plan: &TranscodePlan,
    request: &RenditionRequest,
    stop: &Arc<AtomicBool>,
    told: impl Fn(u8, Option<u64>),
) -> Result<RenditionFile, RenditionError> {
    let output = PathBuf::from(&request.output_path);
    let working = working_path(&output);

    if let Some(parent) = output.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(RenditionError::Directory)?;
    }

    let asked = match probe_colour(ffprobe, Path::new(&request.spec.input_path)).await {
        Ok(found) if request.carry.colour.is_empty() => RenditionRequest {
            carry: TrackCarry {
                colour: found,
                ..request.carry.clone()
            },
            ..request.clone()
        },
        Ok(_) => request.clone(),
        Err(error) => {
            tracing::warn!(
                target: "rendition",
                %error,
                subject = %request.spec.input_path,
                "the source's colour could not be read, so the encode will declare none"
            );

            request.clone()
        }
    };

    let mut child = steps_aside(&mut Command::new(ffmpeg))
        .args(rendition_arguments(plan, &asked, &working))
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(RenditionError::Spawn)?;

    if let Some(pipe) = child.stdout.take() {
        let mut lines = BufReader::new(pipe).lines();
        let started = Instant::now();
        let mut written = 0_u64;

        while let Ok(Some(line)) = lines.next_line().await {
            if stop.load(Ordering::Relaxed) {
                if let Err(error) = child.start_kill() {
                    tracing::debug!(
                        target: "rendition",
                        %error,
                        subject = %request.output_path,
                        "could not stop ffmpeg, it had likely already exited"
                    );
                }

                break;
            }

            if let Some(so_far) = written_from(&line) {
                written = so_far;
            }

            if let Some(done) = progress_from(&line, request.expected_seconds()) {
                told(done, rate(written, started.elapsed()));
            }
        }
    }

    let finished = child
        .wait_with_output()
        .await
        .map_err(RenditionError::Spawn)?;

    if stop.load(Ordering::Relaxed) {
        discard(&working).await;

        return Err(RenditionError::Stopped);
    }

    if !finished.status.success() {
        discard(&working).await;

        return Err(RenditionError::Failed(
            String::from_utf8_lossy(&finished.stderr).trim().to_owned(),
        ));
    }

    let size = match verify(ffmpeg, ffprobe, &working, request).await {
        Ok(size) => size,
        Err(reason) => {
            discard(&working).await;

            return Err(RenditionError::NotVerified(reason));
        }
    };

    tokio::fs::rename(&working, &output)
        .await
        .map_err(RenditionError::Rename)?;

    Ok(RenditionFile {
        id: request.id(),
        is_ready: true,
        progress: 100,
        bytes_per_second: None,
        size_bytes: Some(size),
        failure: None,
    })
}

/// Removes a working file, saying nothing if there was none.
///
/// Every failure path goes through here, because a half written file left beside a film is the one
/// thing this must never leave behind.
pub async fn discard(working: &Path) {
    if let Err(error) = tokio::fs::remove_file(working).await {
        if error.kind() != std::io::ErrorKind::NotFound {
            tracing::warn!(
                target: "rendition",
                %error,
                path = %working.display(),
                "a working file could not be removed"
            );
        }
    }
}

/// Removes a finished rendition, for a person who did not like it.
///
/// # Errors
///
/// Returns whatever the filesystem said, except that a file already gone is not an error — the
/// caller wanted it absent and it is.
pub async fn forget(path: &Path) -> std::io::Result<()> {
    match tokio::fs::remove_file(path).await {
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        outcome => outcome,
    }
}

/// What to say about a rendition nobody has finished yet.
#[must_use]
pub fn pending(id: String, progress: u8, bytes_per_second: Option<u64>) -> RenditionFile {
    RenditionFile {
        id,
        is_ready: false,
        progress,
        bytes_per_second,
        size_bytes: None,
        failure: None,
    }
}

/// What to say about a rendition that failed.
#[must_use]
pub fn failed(id: String, failure: String) -> RenditionFile {
    RenditionFile {
        id,
        is_ready: false,
        progress: 0,
        bytes_per_second: None,
        size_bytes: None,
        failure: Some(failure),
    }
}

/// Whether the finished file is already there.
pub async fn is_complete(output: &Path) -> bool {
    tokio::fs::metadata(output)
        .await
        .is_ok_and(|found| found.len() > 0)
}

#[cfg(test)]
mod tests {
    use super::{
        container_arguments, format_arguments, rendition_arguments, working_path, RenditionRequest,
    };
    use crate::transcode_plan::{DeviceFilters, SegmentStart, TranscodePlan, DEFAULT_DEVICE};
    use std::path::Path;

    /// The exact shape the server sends, which is where the names have to agree.
    const AS_THE_SERVER_SENDS_IT: &str = r#"{
        "spec": {
            "inputPath": "/media/Films/Azkaban (2004)/Azkaban (2004).mkv",
            "startSeconds": 0,
            "segmentSeconds": 4,
            "hardwareAccel": "none",
            "video": {"kind": "encode", "encoder": "libx265", "maxBitrateKbps": 4500,
                      "maxWidth": 1920, "maxHeight": 1080},
            "audio": {"kind": "copy"}
        },
        "carry": {
            "audio": [{"kind": "copy", "streamIndex": 1}],
            "subtitleStreamIndexes": [2],
            "colour": {"transfer": "smpte2084"},
            "keepsChapters": true
        },
        "durationSeconds": 8520,
        "outputPath": "/media/Films/Azkaban (2004)/.valence/abc.mkv"
    }"#;

    #[test]
    fn reads_the_request_the_server_actually_sends() {
        let request: RenditionRequest =
            serde_json::from_str(AS_THE_SERVER_SENDS_IT).expect("the shapes should agree");

        assert_eq!(request.carry.audio.len(), 1);
        assert_eq!(request.carry.subtitle_stream_indexes, vec![2]);
        assert!(request.carry.keeps_chapters);
        assert_eq!(request.carry.colour.transfer.as_deref(), Some("smpte2084"));
        assert!(!request.is_sample());
    }

    /// A working file named `.mkv` inside a library would be indexed as a second, broken copy of
    /// the film while half of it existed.
    #[test]
    fn writes_to_a_name_no_scanner_would_take_for_media() {
        let working = working_path(Path::new("/media/Films/X/.valence/abc.mkv"));

        assert_eq!(
            working.to_string_lossy(),
            "/media/Films/X/.valence/abc.mkv.valencepart"
        );
    }

    /// The rename that puts it in place is only atomic within one filesystem, so the working file
    /// has to sit beside the destination rather than in a cache somewhere else.
    #[test]
    fn keeps_the_working_file_beside_the_one_it_becomes() {
        let output = Path::new("/media/Films/X/.valence/abc.mkv");
        let working = working_path(output);

        assert_eq!(working.parent(), output.parent());
    }

    /// A file whose index is at the end cannot start playing until all of it has arrived.
    #[test]
    fn puts_an_mp4_index_at_the_front() {
        assert_eq!(
            container_arguments(Path::new("/media/x.mp4")),
            vec!["-movflags".to_owned(), "+faststart".to_owned()]
        );
    }

    /// Matroska writes its index where it belongs without being asked.
    #[test]
    fn says_nothing_to_the_matroska_muxer() {
        assert!(container_arguments(Path::new("/media/x.mkv")).is_empty());
    }

    #[test]
    fn reads_an_extension_however_it_was_capitalised() {
        assert!(!container_arguments(Path::new("/media/x.MP4")).is_empty());
    }

    fn asked() -> RenditionRequest {
        serde_json::from_str(AS_THE_SERVER_SENDS_IT).expect("the shapes should agree")
    }

    fn plan_for(request: &RenditionRequest) -> TranscodePlan {
        TranscodePlan {
            spec: request.spec.clone(),
            output_directory: String::new(),
            device: DEFAULT_DEVICE.to_owned(),
            device_filters: DeviceFilters::default(),
            start_at: SegmentStart::default(),
            cut_seconds: 0.0,
        }
    }

    /// ffmpeg chooses a muxer from the output name, and the working name is deliberately one it has
    /// never heard of — so left to guess it refuses to open the output at all.
    #[test]
    fn names_the_muxer_rather_than_leaving_it_to_be_guessed() {
        assert_eq!(
            format_arguments(Path::new("/media/Films/X.mkv")),
            vec!["-f".to_owned(), "matroska".to_owned()]
        );
    }

    #[test]
    fn names_a_muxer_for_every_container_the_scanner_indexes() {
        for (name, format) in [
            ("x.mkv", "matroska"),
            ("x.mp4", "mp4"),
            ("x.m4v", "mp4"),
            ("x.mov", "mov"),
            ("x.webm", "webm"),
            ("x.ts", "mpegts"),
            ("x.m2ts", "mpegts"),
            ("x.avi", "avi"),
            ("x.mpg", "mpeg"),
            ("x.wmv", "asf"),
            ("x.flv", "flv"),
            ("x.ogv", "ogg"),
            ("x.3gp", "3gp"),
        ] {
            assert_eq!(
                format_arguments(Path::new(name)),
                vec!["-f".to_owned(), format.to_owned()],
                "{name} should be written with {format}"
            );
        }
    }

    /// A wrong muxer is worse than an absent one: it would write a file the streams do not fit in.
    #[test]
    fn says_nothing_about_a_container_it_does_not_know() {
        assert!(format_arguments(Path::new("/media/Films/X.wat")).is_empty());
    }

    /// The bug this exists to stop. The working name carries none of the facts a muxer is chosen
    /// from, so asking it produced "unable to choose an output format" and no encode at all.
    #[test]
    fn chooses_the_muxer_from_where_the_file_is_going_not_the_name_it_is_written_under() {
        let request = asked();
        let working = working_path(Path::new(&request.output_path));
        let args = rendition_arguments(&plan_for(&request), &request, &working);

        assert!(args.windows(2).any(|pair| pair == ["-f", "matroska"]));
        assert!(args
            .last()
            .is_some_and(|last| last.ends_with(".valencepart")));
    }

    /// The same mistake in a second place: faststart was never applied, since the working name is
    /// not an mp4 name either.
    #[test]
    fn puts_an_mp4_index_at_the_front_even_though_it_is_written_under_another_name() {
        let mut request = asked();

        request.output_path = "/media/Films/Azkaban (2004)/.valence/abc.mp4".to_owned();

        let working = working_path(Path::new(&request.output_path));
        let args = rendition_arguments(&plan_for(&request), &request, &working);

        assert!(args
            .windows(2)
            .any(|pair| pair == ["-movflags", "+faststart"]));
        assert!(args.windows(2).any(|pair| pair == ["-f", "mp4"]));
    }

    #[test]
    fn expects_a_sample_to_run_for_as_long_as_it_was_asked_for() {
        let mut request: RenditionRequest =
            serde_json::from_str(AS_THE_SERVER_SENDS_IT).expect("the shapes should agree");

        request.for_seconds = Some(60);

        assert!(request.is_sample());
        assert!((request.expected_seconds() - 60.0).abs() < f64::EPSILON);
    }

    /// A sample of a film shorter than the sample is the whole film.
    #[test]
    fn expects_no_more_than_the_film_itself_holds() {
        let mut request: RenditionRequest =
            serde_json::from_str(AS_THE_SERVER_SENDS_IT).expect("the shapes should agree");

        request.duration_seconds = 30.0;
        request.for_seconds = Some(60);

        assert!((request.expected_seconds() - 30.0).abs() < f64::EPSILON);
    }

    /// Two requests writing to one path are the same work whatever they were asked for, and must
    /// never run at once.
    #[test]
    fn is_addressed_by_where_it_lands_rather_than_by_what_it_was_asked_for() {
        let request: RenditionRequest =
            serde_json::from_str(AS_THE_SERVER_SENDS_IT).expect("the shapes should agree");

        assert_eq!(request.id(), request.output_path);
    }
}
