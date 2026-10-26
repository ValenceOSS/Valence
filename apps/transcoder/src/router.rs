use std::collections::HashSet;
use std::path::{Component, Path, PathBuf};
use std::time::Duration;

use axum::body::Body;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path as AxumPath, Query, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::audio::{touch, AudioBitrate, AudioRegistry};
use crate::cache_sweep;
use crate::capability::{detect_capabilities, Capabilities};
use crate::codec_string::codec_string;
use crate::credit_frames::{read_credit_frames, CreditFramesJob, CreditFramesRequest};
use crate::download::{self, DownloadFile, DownloadJob, DownloadRequest};
use crate::fingerprint::{fingerprint, FingerprintJob, FingerprintRequest};
use crate::frame::{take_frame, FrameRequest};
use crate::monitor::{Monitor, Report};
use crate::playlist::{
    build_ladder_playlist, AudioRendition, LadderVariant, VideoRendition, AUDIO_PLAYLIST_NAME,
    VIDEO_PLAYLIST_NAME,
};
use crate::preview::{
    directory_for as preview_directory, is_complete as preview_ready, PreviewClip, PreviewJob,
    PreviewRegistry, PreviewRequest,
};
use crate::probe::probe_media;
use crate::progress_registry::ProgressRegistry;
use crate::queue::WorkQueue;
use crate::render_registry::{Claim, RenderRegistry};
use crate::rendition::{self, RenditionJob, RenditionRequest};
use crate::session::{await_run, segment_number, Reuse, SessionRegistry};
use crate::split_session::{self, Half};
use crate::subtitle::{SubtitleError, SubtitleRegistry, SubtitleRequest, SubtitleTrack, Tools};
use crate::transcode_plan::HardwareAccel;
use crate::transcode_plan::{DeviceFilters, SegmentStart, TranscodePlan};
use crate::transcode_plan::{SessionSpec, INIT_SEGMENT_NAME, MANIFEST_NAME};
use crate::trickplay::{
    directory_for, is_complete, pending_index, tile_height_for, SheetSource, TrickplayJob,
    TrickplayRegistry, TrickplayRequest,
};

/// How long a request for a segment waits for the transcode to reach it.
///
/// Long enough to cover a run being restarted somewhere else in the film and
/// producing the first segment there, which is where the longest honest wait
/// is. Past that the transcode is not making progress, and a viewer is better
/// told so than left holding a connection open.
const SEGMENT_TIMEOUT: Duration = Duration::from_secs(30);

/// How long a segment can take before it is worth saying so.
///
/// A viewer notices a wait long before a request times out, and a wait is the
/// only thing about delivery that a log can usefully carry: everything else is
/// a file being sent. Anything under this is the transcode keeping up.
const SLOW_SEGMENT: Duration = Duration::from_millis(250);

/// How often a watching page is sent a new reading.
///
/// A second is fast enough to watch a transcode start and slow enough that
/// measuring costs less than the thing being measured.
const MONITOR_INTERVAL: Duration = Duration::from_secs(1);

/// What to call a file in a list of work.
///
/// The name alone: an operator watching a queue recognises "Parasite.mkv" and
/// learns nothing from the eighty characters of path in front of it.
fn name_of(path: &Path) -> String {
    path.file_name().map_or_else(
        || path.to_string_lossy().into_owned(),
        |name| name.to_string_lossy().into_owned(),
    )
}

/// Everything the routes need.
#[derive(Clone)]
pub struct AppState {
    pub registry: SessionRegistry,
    pub ffprobe: String,
    /// Directories the media service will read from.
    ///
    /// The service has no authentication of its own, so without this any
    /// caller that can reach the socket could read any file the process can.
    pub media_roots: Vec<PathBuf>,
    /// Keeps one set of thumbnails from being rendered twice at once.
    pub trickplay: TrickplayRegistry,
    /// Keeps one file from being read for its subtitles twice at once, and
    /// what was read from being read again.
    pub subtitles: SubtitleRegistry,
    /// Keeps a picture subtitle track from being read into words twice at once.
    pub picture_subtitles: crate::picture_subtitles::PictureSubtitleRegistry,
    /// Keeps a film from being listened to for its words twice at once.
    pub generated_subtitles: crate::whisper_subtitles::GeneratedSubtitleRegistry,
    /// Keeps one download from being prepared twice at once, and remembers how
    /// far through each is.
    ///
    /// A download runs for minutes and is asked about every few seconds, so
    /// without this the asking would be what started the work, over and over.
    pub downloads: ProgressRegistry,
    /// Keeps one clip from being rendered twice at once.
    ///
    /// Previews share an output path derived from the request, so concurrent
    /// renders truncate each other's file and every one of them fails to
    /// verify. See VAL-104.
    pub previews: PreviewRegistry,
    /// Where background work waits its turn.
    ///
    /// Everything that reads a whole file goes through here, so there is a
    /// ceiling on how much of the machine work nobody is waiting for can take.
    pub queue: WorkQueue,
    /// What the machine is using, and what has happened lately.
    pub monitor: Monitor,
    /// Keeps one rendition of a track from being encoded twice at once.
    pub audio: AudioRegistry,
    /// Keeps one kept file from being written twice at once, remembers how far through it is, and
    /// holds why the last attempt failed.
    ///
    /// Two writers to one path in a library would truncate each other's work, and the caller polls
    /// rather than waits — so without a claim taken before anything is spawned, the asking would be
    /// what starts the encode, over and over.
    pub renditions: ProgressRegistry,
    /// Directories the media service will write finished files into.
    ///
    /// Separate from `media_roots`, and deliberately narrower. Reading a file somebody asked to
    /// watch and writing one over the top of it are not the same permission, and a service with no
    /// authentication of its own should not treat them as though they were. Empty means it will
    /// write nowhere at all, which is the right answer for an installation that never turned this
    /// on.
    pub write_roots: Vec<PathBuf>,
}

impl AppState {
    /// Whether a path lies inside a configured media root.
    ///
    /// A film kept as several files arrives as a list this service wrote into
    /// its own cache, which is no media root. It may be read where every part
    /// it joins may, which is also what stops a list being a way past the
    /// roots: the parts are what is opened.
    ///
    /// A path holding a `..` is refused outright, as [`is_writable`](Self::is_writable) refuses
    /// one, because a prefix test on it proves nothing about where the file is. Where the path
    /// leads through a link is the operator's own arrangement and is trusted.
    #[must_use]
    pub fn is_readable(&self, path: &Path) -> bool {
        if self.media_roots.is_empty() {
            return true;
        }

        let is_inside = |path: &Path| {
            !path
                .components()
                .any(|component| matches!(component, std::path::Component::ParentDir))
                && self.media_roots.iter().any(|root| path.starts_with(root))
        };

        if path.to_str().is_some_and(crate::joined_input::is_joined) {
            return crate::joined_input::parts_of(path)
                .is_some_and(|parts| parts.iter().all(|part| is_inside(part)));
        }

        is_inside(path)
    }

    /// Whether a path lies inside a configured write root.
    ///
    /// Fails shut where `is_readable` fails open, and the difference is the point. An empty read
    /// list means an installation that never restricted reading; an empty write list means one that
    /// never asked for anything to be written, and writing into a library on the strength of a
    /// request arriving is exactly what must not happen.
    ///
    /// A parent component anywhere in the path is refused outright rather than resolved, because a
    /// prefix test on a path holding `..` proves nothing about where the file lands. A drive letter
    /// is not one: every Windows path starts with one, and refusing it refused every write there.
    #[must_use]
    pub fn is_writable(&self, path: &Path) -> bool {
        if path.components().any(|component| {
            !matches!(
                component,
                Component::Normal(_) | Component::RootDir | Component::Prefix(_)
            )
        }) {
            return false;
        }

        self.write_roots.iter().any(|root| path.starts_with(root))
    }
}

#[derive(Debug, Deserialize)]
pub struct ProbeRequest {
    #[serde(deserialize_with = "crate::path_map::deserialize")]
    pub path: String,
}

/// Asks a session file's request to answer with where the file is rather
/// than with its bytes.
#[derive(Debug, Default, Deserialize)]
pub struct SessionFileQuery {
    #[serde(default)]
    pub locate: bool,
}

/// Where the files that answer a session request are, in the order to send
/// them, and what they are.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocatedFiles {
    pub files: Vec<String>,
    pub content_type: String,
}

#[derive(Debug, Deserialize)]
pub struct FileQuery {
    #[serde(deserialize_with = "crate::path_map::deserialize")]
    pub path: String,
}

/// Which track to play, and at which of the offered bitrates.
///
/// The bitrate arrives as text so that a number nobody offers is answered the
/// same way as a word: with the service's own error rather than the extractor's.
#[derive(Debug, Deserialize)]
pub struct AudioQuery {
    #[serde(deserialize_with = "crate::path_map::deserialize")]
    pub path: String,
    pub kbps: String,
}

/// One byte range, as parsed from a `Range` header.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ByteRange {
    pub start: u64,
    pub end: u64,
}

/// Parses a single-range `Range` header.
///
/// Only one range is supported, which is all a video element ever asks for.
/// Multi-range requests are answered with the whole file rather than a
/// malformed multipart response.
#[must_use]
pub fn parse_range(header: &str, length: u64) -> Option<ByteRange> {
    if length == 0 {
        return None;
    }

    let spec = header.strip_prefix("bytes=")?;

    if spec.contains(',') {
        return None;
    }

    let (from, to) = spec.split_once('-')?;

    let range = match (from.trim(), to.trim()) {
        ("", "") => return None,
        ("", last) => {
            let count: u64 = last.parse().ok()?;
            let count = count.min(length);

            ByteRange {
                start: length - count,
                end: length - 1,
            }
        }
        (first, "") => ByteRange {
            start: first.parse().ok()?,
            end: length - 1,
        },
        (first, last) => ByteRange {
            start: first.parse().ok()?,
            end: last.parse::<u64>().ok()?.min(length - 1),
        },
    };

    if range.start > range.end || range.start >= length {
        return None;
    }

    Some(range)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionResponse {
    pub id: String,
    pub manifest: String,
    /// Whether the video is being encoded, whatever the caller asked for.
    ///
    /// A copy is refused when the source's own keyframes cannot produce
    /// segments a player will take. The caller decided to copy and will tell a
    /// viewer so, and this is how it learns that what it decided is not what is
    /// happening. See VAL-125.
    pub encodes_video: bool,
    /// What this session found already made when it started.
    ///
    /// A transcode is addressed by the treatment it performs, so a request for
    /// one somebody has already had done is answered out of what is on disk.
    /// Nobody downstream can see that from the manifest — the segments arrive
    /// the same either way — so it is said here or it is not said at all.
    pub reuse: Reuse,
    /// Where the same film is described as DASH, for a session that has it:
    /// one sent as picture and sound apart. See [`crate::dash`].
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dash_manifest: Option<String>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
}

fn error(status: StatusCode, message: &str) -> Response {
    (
        status,
        Json(ErrorResponse {
            error: message.to_owned(),
        }),
    )
        .into_response()
}

/// Refuses a file outside the media roots, and says so in the log.
///
/// The server turns any refusal into "that could not be read", so the operator
/// who needs to know which folder is missing from `VALENCE_MEDIA_ROOTS` is
/// reading this service's log or its monitor, never the player.
fn outside_the_roots(path: &Path) -> Response {
    tracing::warn!(
        target: "paths",
        "refused to read {}: it is outside the media roots, which VALENCE_MEDIA_ROOTS sets",
        path.display()
    );

    error(
        StatusCode::FORBIDDEN,
        "That file is outside the media roots.",
    )
}

/// Rejects any segment name that is not a plain file name.
///
/// Segment names arrive in the URL, so without this a request for
/// `../../etc/passwd` would be served from the session directory. Rejecting
/// anything containing a separator or a parent component is simpler to reason
/// about than trying to canonicalise afterwards.
fn is_safe_segment_name(name: &str) -> bool {
    if name.is_empty() || name.len() > 128 {
        return false;
    }

    Path::new(name).components().count() == 1
        && Path::new(name)
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
}

fn content_type_for(name: &str) -> &'static str {
    let extension = Path::new(name)
        .extension()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    match extension.as_str() {
        "m3u8" => "application/vnd.apple.mpegurl",
        "mpd" => "application/dash+xml",
        "ts" => "video/mp2t",
        "m4s" | "mp4" => "video/mp4",
        "jpg" | "jpeg" => "image/jpeg",
        "vtt" => "text/vtt",
        "mp3" => "audio/mpeg",
        "flac" => "audio/flac",
        "m4a" | "alac" => "audio/mp4",
        "aac" => "audio/aac",
        "ogg" | "oga" | "opus" => "audio/ogg",
        "wav" => "audio/wav",
        "wma" => "audio/x-ms-wma",
        "aiff" | "aif" => "audio/aiff",
        "ape" => "audio/x-ape",
        "wv" => "audio/x-wavpack",
        _ => "application/octet-stream",
    }
}

async fn serve_file(directory: &Path, name: &str, requested: Option<&str>) -> Response {
    if !is_safe_segment_name(name) {
        return error(StatusCode::BAD_REQUEST, "Invalid segment name.");
    }

    stream_file(
        &directory.join(name),
        content_type_for(name),
        requested,
        "No such segment.",
    )
    .await
}

/// Serves several of the muxer's segments as the one segment a playlist offers.
///
/// Fragmented MP4 pieces follow one another as they are, which is what lets a
/// handful of very short ones be offered as a single segment rather than as a
/// request each. Sent whole rather than by range: a range over pieces means
/// nothing to the files underneath, and no player asks for one of a segment it
/// is about to play from the beginning.
async fn serve_group(directory: &Path, names: &[String]) -> Response {
    for name in names {
        if !is_safe_segment_name(name) {
            return error(StatusCode::BAD_REQUEST, "Invalid segment name.");
        }
    }

    let content_type = names
        .first()
        .map_or("application/octet-stream", |name| content_type_for(name));

    let paths: Vec<PathBuf> = names.iter().map(|name| directory.join(name)).collect();

    let mut length = 0_u64;

    for path in &paths {
        let Ok(metadata) = tokio::fs::metadata(path).await else {
            return error(StatusCode::NOT_FOUND, "No such segment.");
        };

        length += metadata.len();
    }

    let body = Body::from_stream(async_stream::stream! {
        use tokio::io::AsyncReadExt as _;

        let mut buffer = vec![0_u8; STREAM_CHUNK];

        for path in paths {
            let mut file = match tokio::fs::File::open(&path).await {
                Ok(file) => file,
                Err(problem) => {
                    yield Err(problem);
                    break;
                }
            };

            loop {
                match file.read(&mut buffer).await {
                    Ok(0) => break,
                    Ok(read) => {
                        yield Ok::<_, std::io::Error>(
                            axum::body::Bytes::copy_from_slice(&buffer[..read]),
                        );
                    }
                    Err(problem) => {
                        yield Err(problem);
                        break;
                    }
                }
            }
        }
    });

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CONTENT_LENGTH, length)
        .body(body)
        .unwrap_or_else(|_| error(StatusCode::INTERNAL_SERVER_ERROR, "Could not send it."))
}

/// The `Range` header, if the caller sent a readable one.
fn requested_range(headers: &HeaderMap) -> Option<&str> {
    headers
        .get(header::RANGE)
        .and_then(|value| value.to_str().ok())
}

/// How much is lifted off disk at a time.
///
/// Large enough that a 20 MB clip is a few hundred reads rather than thousands,
/// small enough that a hundred people watching at once is megabytes of buffers
/// and not gigabytes.
const STREAM_CHUNK: usize = 64 * 1024;

/// Sends a file from disk without holding it in memory, honouring byte ranges.
///
/// Reading a whole file to answer for part of it is the wrong shape twice over.
/// A preview is 18 MB and every request for one put all of it on the heap before
/// a byte reached the viewer, which is why the first hover felt slow. An original
/// file is measured in gigabytes, and a video element seeking through one asks
/// for a few hundred kilobytes at a time — so answering a scrub by reading the
/// whole film was the difference between a buffer and an outage.
///
/// Reads only the bytes asked for, a chunk at a time, and starts sending as soon
/// as the first chunk lands.
async fn stream_file(
    path: &Path,
    content_type: &str,
    requested: Option<&str>,
    missing: &str,
) -> Response {
    use tokio::io::{AsyncReadExt as _, AsyncSeekExt as _};

    let Ok(metadata) = tokio::fs::metadata(path).await else {
        return error(StatusCode::NOT_FOUND, missing);
    };

    let length = metadata.len();

    let range = requested.and_then(|value| parse_range(value, length));

    let (status, start, count) = match range {
        Some(ref found) => (
            StatusCode::PARTIAL_CONTENT,
            found.start,
            found.end.saturating_sub(found.start).saturating_add(1),
        ),
        None => (StatusCode::OK, 0, length),
    };

    let Ok(mut file) = tokio::fs::File::open(path).await else {
        return error(StatusCode::NOT_FOUND, missing);
    };

    if start > 0 && file.seek(std::io::SeekFrom::Start(start)).await.is_err() {
        return error(StatusCode::NOT_FOUND, missing);
    }

    let body = Body::from_stream(async_stream::stream! {
        let mut remaining = count;
        let mut buffer = vec![0_u8; STREAM_CHUNK];

        while remaining > 0 {
            let want = usize::try_from(remaining)
                .unwrap_or(STREAM_CHUNK)
                .min(STREAM_CHUNK);

            match file.read(&mut buffer[..want]).await {
                Ok(0) => break,
                Ok(read) => {
                    remaining = remaining
                        .saturating_sub(u64::try_from(read).unwrap_or(remaining));

                    yield Ok::<_, std::io::Error>(
                        axum::body::Bytes::copy_from_slice(&buffer[..read]),
                    );
                }
                Err(problem) => {
                    yield Err(problem);
                    break;
                }
            }
        }
    });

    let mut response = Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::ACCEPT_RANGES, "bytes")
        .header(header::CONTENT_LENGTH, count);

    if let Some(found) = range {
        response = response.header(
            header::CONTENT_RANGE,
            format!("bytes {}-{}/{length}", found.start, found.end),
        );
    }

    response.body(body).unwrap_or_else(|_| {
        error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Could not send the file.",
        )
    })
}

#[allow(clippy::unused_async, reason = "axum handlers must be async")]
/// Serves an original file, honouring byte ranges.
///
/// Direct play is the cheapest delivery there is: no transcode, no remux, no
/// segment cache, just the file. A video element seeks with `Range` requests,
/// so a server that ignores them forces the browser to download from the start
/// every time the viewer scrubs.
async fn direct_file(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<FileQuery>,
) -> Response {
    let path = PathBuf::from(&query.path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    stream_file(
        &path,
        content_type_for(&query.path),
        headers
            .get(header::RANGE)
            .and_then(|value| value.to_str().ok()),
        "No such file.",
    )
    .await
}

/// Serves a track at a lower bitrate, encoding it the first time it is asked for.
///
/// Encoded on a task of its own so a listener who skips ahead mid-encode does
/// not throw the work away: whoever asks next finds it finished, or waits on
/// the same encode rather than starting another.
async fn audio_rendition(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AudioQuery>,
) -> Response {
    let Some(bitrate) = AudioBitrate::parse(&query.kbps) else {
        return error(
            StatusCode::BAD_REQUEST,
            "Audio is offered at 96, 160 or 320 kbps.",
        );
    };

    let path = PathBuf::from(&query.path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    let config = state.registry.config();
    let audio = state.audio.clone();
    let ffmpeg = config.ffmpeg.clone();
    let ffprobe = state.ffprobe.clone();
    let artefact_root = config.artefact_root.clone();

    let made = tokio::spawn(async move {
        audio
            .render(
                crate::audio::Tools {
                    ffmpeg: &ffmpeg,
                    ffprobe: &ffprobe,
                },
                &artefact_root,
                &path,
                bitrate,
            )
            .await
    })
    .await;

    let rendition = match made {
        Ok(Ok(rendition)) => rendition,
        Ok(Err(failure)) if failure.is_missing() => {
            return error(StatusCode::NOT_FOUND, &failure.to_string());
        }
        Ok(Err(failure)) => {
            tracing::warn!(target: "audio", %failure, "could not encode {}", query.path);

            return error(StatusCode::INTERNAL_SERVER_ERROR, &failure.to_string());
        }
        Err(_) => {
            return error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "The encode stopped before it finished.",
            );
        }
    };

    if let Err(failure) = touch(&rendition).await {
        tracing::debug!(target: "audio", %failure, "could not mark a rendition as played");
    }

    stream_file(
        &rendition,
        "audio/mp4",
        requested_range(&headers),
        "No such rendition.",
    )
    .await
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn capabilities(State(state): State<AppState>) -> Json<Capabilities> {
    let config = state.registry.config();

    Json(detect_capabilities(&config.ffmpeg, &config.device).await)
}

async fn hardware() -> Json<crate::hardware::Hardware> {
    Json(crate::hardware::read_hardware().await)
}

/// Tries the backend and encoder asked for on a short real transcode.
async fn test_hardware(
    State(state): State<AppState>,
    Json(request): Json<crate::hardware_test::HardwareTestRequest>,
) -> Json<crate::hardware_test::HardwareTestReport> {
    let config = state.registry.config();

    Json(
        crate::hardware_test::test_hardware(
            &config.ffmpeg,
            &config.device,
            &config.cache_root,
            request,
        )
        .await,
    )
}

/// The segment length a probe judges copyability against.
///
/// Everything Valence needs to know about a file, read from its header.
///
/// Deliberately not whether its segments can be copied. That costs a read of
/// every video packet in the file — flat against a header read, and growing
/// with the film — and a library scan asks this once per file, including for
/// the files nobody ever plays. It was the whole cost of a scan: a header is
/// read in about seventy milliseconds whatever the size, and the packet index
/// of a two hour remux takes tens of seconds.
///
/// Nothing is lost by not knowing. A session reads the boundaries itself when
/// it starts, and `deliverable` turns a copy into an encode where they say the
/// source cannot be cut — so a plan made without this is corrected before a
/// frame is written, and the read happens once, for a file somebody is actually
/// watching.
async fn probe(State(state): State<AppState>, Json(request): Json<ProbeRequest>) -> Response {
    let path = Path::new(&request.path);

    let Ok(result) = probe_media(&state.ffprobe, path).await else {
        return error(StatusCode::BAD_REQUEST, "That file could not be probed.");
    };

    (StatusCode::OK, Json(result)).into_response()
}

/// The folders the server keeps libraries in, named as the server names them.
#[derive(Debug, Deserialize)]
pub struct ReachRequest {
    pub folders: Vec<String>,
}

/// Whether this service may read a library folder, and write finished files into it.
#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FolderReach {
    pub folder: String,
    pub is_readable: bool,
    pub is_writable: bool,
}

/// Says whether a folder the server names is one this service may read and
/// write, after translating it the way a request naming a file in it would be.
///
/// A folder whose path cannot be translated can be done nothing with.
fn reach_of(state: &AppState, folder: &str) -> FolderReach {
    let Ok(here) = crate::path_map::translate(folder.to_owned()) else {
        return FolderReach {
            folder: folder.to_owned(),
            is_readable: false,
            is_writable: false,
        };
    };

    FolderReach {
        folder: folder.to_owned(),
        is_readable: state.is_readable(Path::new(&here)),
        is_writable: state.is_writable(Path::new(&here)),
    }
}

/// Answers which of the server's library folders this service may read and
/// write, so the server can warn about a library it would scan but never play
/// rather than every track in it failing to.
async fn reach_folders(
    State(state): State<AppState>,
    Json(request): Json<ReachRequest>,
) -> Json<Vec<FolderReach>> {
    Json(
        request
            .folders
            .iter()
            .map(|folder| reach_of(&state, folder))
            .collect(),
    )
}

/// A request to start a session, and who is asking.
///
/// The device is carried beside the spec rather than inside it because it must
/// not change the session's address: two devices asking for the same transcode
/// should share one directory and one encode. What the device decides is not
/// which transcode is made, but which one is worth keeping afterwards.
#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartSessionRequest {
    #[serde(flatten)]
    spec: SessionSpec,
    #[serde(default)]
    device_id: Option<String>,
    /// Other qualities of the same film for the player to switch between,
    /// each a picture copied from a file kept beside the original. Only a
    /// session sent as picture and sound apart can offer them. See VAL-363.
    #[serde(default)]
    variants: Vec<SessionSpec>,
}

async fn start_session(
    State(state): State<AppState>,
    Json(request): Json<StartSessionRequest>,
) -> Response {
    match start_from(&state, &request).await {
        Ok(started) => {
            keep_the_start(&state, &started.id, &request).await;

            (StatusCode::OK, Json(started)).into_response()
        }
        Err(refused) => *refused,
    }
}

/// Where the request that started a session is kept, beside its segments.
///
/// A restart forgets every session while the players watching them carry on
/// asking for segments by the same address. With the request kept, the first
/// of those asks starts the session again where it was, as Jellyfin does with
/// a transcode it no longer holds, and the viewer sees a pause rather than an
/// error.
pub const START_REQUEST_NAME: &str = ".start.json";

/// The request that started a session, and which session it was asked for.
///
/// Written into every directory the request made: the sound sent apart from
/// the picture and each other quality of it are asked for by their own
/// addresses, and any of them can be the first a player asks for again.
#[derive(serde::Serialize, serde::Deserialize)]
struct KeptStart {
    root: String,
    request: StartSessionRequest,
}

/// Keeps the request that started a session beside its segments, and beside
/// those of everything started with it.
async fn keep_the_start(state: &AppState, root: &str, request: &StartSessionRequest) {
    let kept = KeptStart {
        root: root.to_owned(),
        request: StartSessionRequest {
            spec: request.spec.clone(),
            device_id: request.device_id.clone(),
            variants: request.variants.clone(),
        },
    };

    let Ok(payload) = serde_json::to_vec(&kept) else {
        return;
    };

    let companion = state.registry.companion_of(root).await;
    let variants = state.registry.variants_of(root).await;
    let cache_root = &state.registry.config().cache_root;

    for id in std::iter::once(root.to_owned())
        .chain(companion)
        .chain(variants)
    {
        if let Err(failure) =
            write_replacing(&cache_root.join(&id).join(START_REQUEST_NAME), &payload).await
        {
            tracing::warn!(
                target: "session",
                session_id = %id,
                %failure,
                "could not keep what started this session, so a restart will end it"
            );
        }
    }
}

/// Whether an address is one a session could have, which is what makes it
/// safe to look for a directory by.
fn is_session_address(id: &str) -> bool {
    id.len() == 32 && id.bytes().all(|byte| byte.is_ascii_hexdigit())
}

/// Picks a session up again after a restart, from the request kept beside its
/// segments, when nothing holds it.
///
/// The session is started as it first was, so it lands on the same address
/// and the segments already made are served as they are; the run starts where
/// they run out, and moves to wherever the player asks. A request that now
/// starts somewhere else, because what an address is made from has changed
/// in an update since, is let go of again: the player's own reconnecting
/// starts it afresh.
///
/// Run on its own, so a player that gives up on the request it asked with
/// does not take the session down halfway through starting.
///
/// `true` once the session is held, whether it already was or has just been
/// started again.
async fn revive(state: &AppState, id: &str) -> bool {
    if state.registry.holds(id).await {
        return true;
    }

    if !is_session_address(id) {
        return false;
    }

    let state = state.clone();
    let id = id.to_owned();

    tokio::spawn(async move { revive_now(&state, &id).await })
        .await
        .unwrap_or(false)
}

/// Picks a session up again from what started it, one session at a time.
async fn revive_now(state: &AppState, id: &str) -> bool {
    let _turn = state.registry.turn_to_revive().await;

    if state.registry.holds(id).await {
        return true;
    }

    let directory = state.registry.config().cache_root.join(id);
    let Some(kept) = tokio::fs::read(directory.join(START_REQUEST_NAME))
        .await
        .ok()
        .and_then(|found| serde_json::from_slice::<KeptStart>(&found).ok())
    else {
        return false;
    };

    let device_id = kept.request.device_id.as_deref();

    match start_from(state, &kept.request).await {
        Ok(started) if started.id == kept.root => {
            tracing::info!(
                target: "session",
                session_id = %id,
                "picked up again after a restart"
            );

            state.registry.holds(id).await
        }
        Ok(started) => {
            tracing::warn!(
                target: "session",
                session_id = %id,
                "could not be picked up again, since it now starts as {}",
                started.id
            );

            let _ = let_go(state, &started.id, device_id).await;

            false
        }
        Err(_) => false,
    }
}

/// Lets go of a session and everything started with it, and forgets what
/// started any of them that nobody holds any more, so a player still asking
/// after it was stopped does not start it again.
///
/// `false` means there is no such session.
async fn let_go(state: &AppState, id: &str, device_id: Option<&str>) -> bool {
    let companion = state.registry.companion_of(id).await;
    let variants = state.registry.variants_of(id).await;

    if !state.registry.stop(id, device_id).await {
        return false;
    }

    let kept: Vec<String> = companion.into_iter().chain(variants).collect();

    for other in &kept {
        state.registry.stop(other, device_id).await;
    }

    for ended in std::iter::once(id).chain(kept.iter().map(String::as_str)) {
        if !state.registry.holds(ended).await {
            let _ = tokio::fs::remove_file(
                state
                    .registry
                    .config()
                    .cache_root
                    .join(ended)
                    .join(START_REQUEST_NAME),
            )
            .await;
        }
    }

    true
}

/// Starts whatever a request to start a session asks for: one session, or a picture, its sound and
/// the other qualities of it, sent apart.
async fn start_from(
    state: &AppState,
    request: &StartSessionRequest,
) -> Result<SessionResponse, Box<Response>> {
    let StartSessionRequest {
        spec,
        device_id,
        variants,
    } = request;

    tracing::info!(
        target: "session",
        "{} {}",
        spec.summary(),
        spec.input_path
    );

    if !tokio::fs::try_exists(&spec.input_path)
        .await
        .unwrap_or(false)
    {
        tracing::warn!(
            target: "session",
            "refused: no such input file: {}",
            spec.input_path
        );

        return Err(Box::new(error(
            StatusCode::NOT_FOUND,
            "No such input file.",
        )));
    }

    if split_session::splits(spec, state.registry.config().split_audio) {
        if let Some(outcome) = start_split(state, spec, variants, device_id.as_deref()).await {
            return outcome;
        }
    }

    start_both(state, spec.clone(), device_id.as_deref()).await
}

/// Starts one session carrying the picture and sound together.
async fn start_both(
    state: &AppState,
    spec: SessionSpec,
    device_id: Option<&str>,
) -> Result<SessionResponse, Box<Response>> {
    let started = match state.registry.start(spec, device_id).await {
        Ok(started) => started,
        Err(failure) => {
            tracing::error!(target: "session", %failure, "refused");

            return Err(Box::new(error(
                StatusCode::INTERNAL_SERVER_ERROR,
                &failure.to_string(),
            )));
        }
    };

    let id = started.id;

    let Some(directory) = state.registry.touch(&id).await else {
        return Err(Box::new(error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "The session disappeared.",
        )));
    };

    let manifest_timeout = state.registry.config().manifest_timeout;

    if !await_run(&directory, manifest_timeout).await {
        tracing::error!(
            target: "session",
            session_id = %id,
            "produced no manifest within {}s; see the ffmpeg output above",
            manifest_timeout.as_secs()
        );

        state.registry.stop(&id, device_id).await;

        return Err(Box::new(error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ffmpeg produced no manifest.",
        )));
    }

    Ok(SessionResponse {
        manifest: format!("/sessions/{id}/{MANIFEST_NAME}"),
        id,
        encodes_video: started.encodes_video,
        reuse: started.reuse,
        dash_manifest: None,
    })
}

/// Starts a session as its picture and its sound, sent apart.
///
/// `None` sends the caller back to one session carrying both: a file with no
/// sound has nothing to split, and a half whose codec cannot be read cannot be
/// named in the playlist a player sets its decoders up from. See VAL-307.
async fn start_split(
    state: &AppState,
    spec: &SessionSpec,
    variants: &[SessionSpec],
    device_id: Option<&str>,
) -> Option<Result<SessionResponse, Box<Response>>> {
    let probe = probe_media(&state.ffprobe, Path::new(&spec.input_path))
        .await
        .ok()?;
    let stream =
        split_session::chosen_audio(&probe.audio_streams, spec.audio_stream_index)?.clone();

    let halves = match start_halves(state, spec, stream.index, device_id).await {
        Ok(halves) => halves,
        Err(response) => return Some(Err(response)),
    };

    let (Some(video_codec), Some(audio_codec)) = (
        codec_of(&halves.video_directory).await,
        codec_of(&halves.audio_directory).await,
    ) else {
        tracing::warn!(
            target: "session",
            session_id = %halves.video.id,
            "could not read what the picture or the sound is, so they are sent together"
        );
        stop_halves(state, &halves, device_id).await;

        return None;
    };

    let size = matches!(spec.video, crate::transcode_plan::VideoAction::Copy)
        .then(|| {
            probe
                .video
                .as_ref()
                .map(|video| (video.width, video.height))
        })
        .flatten();

    let rungs = start_variants(state, variants, device_id).await;

    state
        .registry
        .bind_ladder(
            &halves.video.id,
            &rungs.iter().map(|(id, _)| id.clone()).collect::<Vec<_>>(),
        )
        .await;

    let ladder: Vec<LadderVariant> = std::iter::once(LadderVariant {
        rendition: VideoRendition {
            codec: video_codec,
            bandwidth: split_session::bandwidth(spec, probe.bitrate_kbps),
            size,
        },
        uri: VIDEO_PLAYLIST_NAME.to_owned(),
    })
    .chain(rungs.into_iter().map(|(_, variant)| variant))
    .collect();

    let audio = split_session::audio_rendition(&stream, &spec.audio, audio_codec);
    let playlist = build_ladder_playlist(&ladder, &audio);

    let has_dash = write_dash_manifest(&halves, &ladder, &audio).await;

    if let Err(failure) = write_replacing(
        &halves
            .video_directory
            .join(split_session::MULTIVARIANT_NAME),
        playlist.as_bytes(),
    )
    .await
    {
        tracing::error!(target: "session", %failure, "could not write the playlist joining picture and sound");
        stop_halves(state, &halves, device_id).await;

        return Some(Err(Box::new(error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Could not write the playlist.",
        ))));
    }

    Some(Ok(SessionResponse {
        manifest: format!("/sessions/{}/{MANIFEST_NAME}", halves.video.id),
        dash_manifest: has_dash.then(|| {
            format!(
                "/sessions/{}/{}",
                halves.video.id,
                crate::dash::DASH_MANIFEST_NAME
            )
        }),
        id: halves.video.id,
        encodes_video: halves.video.encodes_video,
        reuse: halves.video.reuse,
    }))
}

/// The two sessions a split session is made of, once both have begun writing.
struct Halves {
    video: crate::session::Started,
    audio: crate::session::Started,
    video_directory: PathBuf,
    audio_directory: PathBuf,
}

/// Starts a session's picture and its sound, and waits for both to begin.
///
/// Neither is left running if the other cannot be started, since half a film
/// is nothing a player can use.
async fn start_halves(
    state: &AppState,
    spec: &SessionSpec,
    audio_stream_index: u32,
    device_id: Option<&str>,
) -> Result<Halves, Box<Response>> {
    let refused = |failure: &crate::session::SessionError| {
        tracing::error!(target: "session", %failure, "refused");

        Box::new(error(
            StatusCode::INTERNAL_SERVER_ERROR,
            &failure.to_string(),
        ))
    };

    let sound = SessionSpec {
        audio_stream_index: Some(audio_stream_index),
        ..spec.audio_alone(split_session::AUDIO_SEGMENT_SECONDS)
    };

    let video = state
        .registry
        .start(spec.video_alone(), device_id)
        .await
        .map_err(|failure| refused(&failure))?;

    let audio = match state.registry.start(sound, device_id).await {
        Ok(started) => started,
        Err(failure) => {
            state.registry.stop(&video.id, device_id).await;

            return Err(refused(&failure));
        }
    };

    state.registry.link(&video.id, &audio.id).await;

    let directories = (
        state.registry.touch(&video.id).await,
        state.registry.touch(&audio.id).await,
    );

    let (Some(video_directory), Some(audio_directory)) = directories else {
        state.registry.stop(&video.id, device_id).await;
        state.registry.stop(&audio.id, device_id).await;

        return Err(Box::new(error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "The session disappeared.",
        )));
    };

    let halves = Halves {
        video,
        audio,
        video_directory,
        audio_directory,
    };

    let manifest_timeout = state.registry.config().manifest_timeout;

    if !(await_run(&halves.video_directory, manifest_timeout).await
        && await_run(&halves.audio_directory, manifest_timeout).await)
    {
        tracing::error!(
            target: "session",
            session_id = %halves.video.id,
            "produced no manifest within {}s; see the ffmpeg output above",
            manifest_timeout.as_secs()
        );
        stop_halves(state, &halves, device_id).await;

        return Err(Box::new(error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ffmpeg produced no manifest.",
        )));
    }

    Ok(halves)
}

/// Starts the other qualities of a film as pictures of their own, together.
///
/// A rung that cannot be started, or whose codec cannot be read, is left out of
/// the ladder rather than failing the film: the player still has every other
/// quality, and the one it was started on.
async fn start_variants(
    state: &AppState,
    variants: &[SessionSpec],
    device_id: Option<&str>,
) -> Vec<(String, LadderVariant)> {
    let mut starting = tokio::task::JoinSet::new();

    for (order, variant) in variants.iter().enumerate() {
        let state = state.clone();
        let spec = variant.video_alone();
        let device = device_id.map(str::to_owned);

        starting.spawn(async move {
            let started = start_variant(&state, spec, device.as_deref()).await;

            (order, started)
        });
    }

    let mut rungs = Vec::new();

    while let Some(joined) = starting.join_next().await {
        if let Ok((order, Some(rung))) = joined {
            rungs.push((order, rung));
        }
    }

    rungs.sort_by_key(|(order, _)| *order);

    rungs.into_iter().map(|(_, rung)| rung).collect()
}

/// Starts one quality of a ladder and describes it for the playlist.
async fn start_variant(
    state: &AppState,
    spec: SessionSpec,
    device_id: Option<&str>,
) -> Option<(String, LadderVariant)> {
    let probe = probe_media(&state.ffprobe, Path::new(&spec.input_path))
        .await
        .ok()?;
    let started = match state.registry.start(spec.clone(), device_id).await {
        Ok(started) => started,
        Err(failure) => {
            tracing::warn!(target: "session", %failure, "a rung of the ladder could not be started");

            return None;
        }
    };
    let directory = state.registry.touch(&started.id).await?;

    if !await_run(&directory, state.registry.config().manifest_timeout).await {
        state.registry.stop(&started.id, device_id).await;

        return None;
    }

    let Some(codec) = codec_of(&directory).await else {
        state.registry.stop(&started.id, device_id).await;

        return None;
    };

    let size = probe
        .video
        .as_ref()
        .map(|video| (video.width, video.height));
    let variant = LadderVariant {
        rendition: VideoRendition {
            codec,
            bandwidth: split_session::bandwidth(&spec, probe.bitrate_kbps),
            size,
        },
        uri: format!("../{}/{MANIFEST_NAME}", started.id),
    };

    Some((started.id, variant))
}

/// Writes the same film as DASH beside its HLS playlist, for a player that
/// prefers it, and says whether it did. A film it cannot be written for is
/// still played as HLS, so a failure here is noted rather than refused.
async fn write_dash_manifest(
    halves: &Halves,
    ladder: &[LadderVariant],
    audio: &AudioRendition,
) -> bool {
    let lengths_in = |directory: PathBuf| async move {
        tokio::fs::read_to_string(directory.join(MANIFEST_NAME))
            .await
            .map(|playlist| crate::dash::lengths_of(&playlist))
            .unwrap_or_default()
    };
    let session_root = halves
        .video_directory
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_default();
    let mut videos = Vec::with_capacity(ladder.len());

    for variant in ladder {
        let base = variant
            .uri
            .strip_suffix(MANIFEST_NAME)
            .filter(|base| base.starts_with("../"))
            .unwrap_or("")
            .to_owned();
        let directory = match base.strip_prefix("../") {
            Some(session) => session_root.join(session.trim_end_matches('/')),
            None => halves.video_directory.clone(),
        };

        videos.push(crate::dash::DashVideo {
            codec: variant.rendition.codec.clone(),
            bandwidth: variant.rendition.bandwidth,
            size: variant.rendition.size,
            base,
            lengths: lengths_in(directory).await,
        });
    }

    let mpd = crate::dash::build_mpd(
        &videos,
        &crate::dash::DashAudio {
            codec: audio.codec.clone(),
            channels: audio.channels,
            language: audio.language.clone(),
            name: audio.name.clone(),
            lengths: lengths_in(halves.audio_directory.clone()).await,
        },
    );

    match write_replacing(
        &halves.video_directory.join(crate::dash::DASH_MANIFEST_NAME),
        mpd.as_bytes(),
    )
    .await
    {
        Ok(()) => true,
        Err(failure) => {
            tracing::warn!(target: "session", %failure, "could not write the DASH manifest");

            false
        }
    }
}

/// Lets go of both halves of a split session.
async fn stop_halves(state: &AppState, halves: &Halves, device_id: Option<&str>) {
    state.registry.stop(&halves.video.id, device_id).await;
    state.registry.stop(&halves.audio.id, device_id).await;
}

/// Serves the sound's playlist of a split session, matched to its picture's.
async fn serve_audio_playlist(state: &AppState, video: &str, audio: &str) -> Response {
    let (Some(video_directory), Some(audio_directory)) = (
        state.registry.touch(video).await,
        state.registry.touch(audio).await,
    ) else {
        return error(StatusCode::NOT_FOUND, "No such session.");
    };

    let (Ok(video_playlist), Ok(audio_playlist)) = (
        tokio::fs::read_to_string(video_directory.join(MANIFEST_NAME)).await,
        tokio::fs::read_to_string(audio_directory.join(MANIFEST_NAME)).await,
    ) else {
        return error(StatusCode::NOT_FOUND, "No such segment.");
    };

    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, content_type_for(AUDIO_PLAYLIST_NAME))],
        split_session::with_target_of(&audio_playlist, &video_playlist),
    )
        .into_response()
}

/// The codec string of the stream a session's initialisation segment describes.
async fn codec_of(directory: &Path) -> Option<String> {
    let init = tokio::fs::read(directory.join(INIT_SEGMENT_NAME))
        .await
        .ok()?;

    codec_string(&init)
}

/// Writes a file whole, so a reader never finds half of it.
///
/// Two viewers starting the same film write the same playlist at the same
/// moment, and a player reading between them must see one or the other.
async fn write_replacing(path: &Path, contents: &[u8]) -> std::io::Result<()> {
    static WRITES: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

    let write = WRITES.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let staging = path.with_extension(format!("{}.{write}.part", std::process::id()));

    tokio::fs::write(&staging, contents).await?;
    tokio::fs::rename(&staging, path).await
}

/// Serves a file out of a session, waiting for one that is still being made.
///
/// A segment is not a file that either exists or does not. It is a piece of
/// film that has been produced, is being produced, or is somewhere nothing is
/// heading — and the difference decides whether this waits, restarts the
/// transcode, or answers at once.
///
/// Serving whatever was on disk is what produced a stutter at every segment
/// boundary: ffmpeg is still writing the segment it is on, so the player was
/// handed part of one and stalled where it ran out.
async fn session_file(
    State(state): State<AppState>,
    AxumPath((id, name)): AxumPath<(String, String)>,
    Query(query): Query<SessionFileQuery>,
    headers: HeaderMap,
) -> Response {
    revive(&state, &id).await;

    let companion = state.registry.companion_of(&id).await;

    if let (Some(companion), true) = (companion.as_deref(), name == AUDIO_PLAYLIST_NAME) {
        return serve_audio_playlist(&state, &id, companion).await;
    }

    let (id, name) = match companion {
        Some(companion) => match split_session::route(&name) {
            (Half::Video, named) => (id, named),
            (Half::Audio, named) => (companion, named),
        },
        None => (id, name),
    };

    let Some(directory) = state.registry.touch(&id).await else {
        return error(StatusCode::NOT_FOUND, "No such session.");
    };

    if let Some(wanted) = segment_number(&name) {
        let view = state.registry.segment_view(&id).await;
        let (first, last) = view
            .as_ref()
            .and_then(|view| view.span_of(wanted))
            .unwrap_or((wanted, wanted));

        let asked = std::time::Instant::now();
        let is_ready = state
            .registry
            .await_segment(&id, first, SEGMENT_TIMEOUT)
            .await
            && (last == first
                || state
                    .registry
                    .await_segment(&id, last, SEGMENT_TIMEOUT)
                    .await);
        let waited = asked.elapsed();

        if waited > SLOW_SEGMENT {
            tracing::info!(
                target: "session",
                session_id = %id,
                "segment {wanted}: {} after {waited:?}",
                if is_ready { "served" } else { "gave up" }
            );
        }

        if !is_ready {
            return error(
                StatusCode::SERVICE_UNAVAILABLE,
                "That segment is not ready.",
            );
        }

        let names: Vec<String> = match view.as_ref() {
            Some(view) => (first..=last)
                .map(|index| view.segment_name(index))
                .collect(),
            None => vec![name.clone()],
        };

        state
            .registry
            .reached(&id, names.first().map_or(name.as_str(), String::as_str))
            .await;

        if query.locate {
            return locate(&directory, &names);
        }

        return match names.as_slice() {
            [only] => serve_file(&directory, only, requested_range(&headers)).await,
            several => serve_group(&directory, several).await,
        };
    }

    if query.locate {
        return locate(&directory, std::slice::from_ref(&name));
    }

    serve_file(&directory, &name, requested_range(&headers)).await
}

/// Answers a session request with where its files are, once they are ready,
/// rather than with their bytes.
///
/// The server and this service usually share a disk, and on a slow processor
/// passing a segment's bytes through the server's socket and streams cost most
/// of its speed: a remux's large segments arrived slower than they played. The
/// server reads the files itself, and this keeps deciding when a segment is
/// ready and which files make it, which is the part only it knows.
fn locate(directory: &Path, names: &[String]) -> Response {
    if names.iter().any(|name| !is_safe_segment_name(name)) {
        return error(StatusCode::BAD_REQUEST, "Invalid segment name.");
    }

    let content_type = names
        .first()
        .map_or("application/octet-stream", |name| content_type_for(name));

    Json(LocatedFiles {
        files: names
            .iter()
            .map(|name| directory.join(name).to_string_lossy().into_owned())
            .collect(),
        content_type: content_type.to_owned(),
    })
    .into_response()
}

/// Makes the short clip a library page plays.
///
/// Encoded once and served as a file afterwards, so a wall of cards playing
/// previews costs nothing running: the alternative is half a dozen transcodes
/// competing with whatever somebody is actually watching.
/// The answer for a clip that was already cut, which needs no work at all.
fn already_drawn(id: String) -> Response {
    (
        StatusCode::OK,
        Json(PreviewClip {
            url: format!("/previews/{id}/{}", crate::preview::PREVIEW_NAME),
            id,
            is_ready: true,
        }),
    )
        .into_response()
}

async fn start_preview(
    State(state): State<AppState>,
    Json(request): Json<PreviewRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    if is_from_a_stopped_job(state.previews.renders(), request.correlation_id.as_deref()).await {
        return error(StatusCode::CONFLICT, JOB_STOPPED);
    }

    let config = state.registry.config().clone();
    let id = request.id();

    if preview_ready(&config.artefact_root, &id).await {
        return already_drawn(id);
    }

    if let Some(failure) = state.previews.take_failure(&id).await {
        return error(StatusCode::INTERNAL_SERVER_ERROR, &failure);
    }

    let probe = match probe_media(&state.ffprobe, &path).await {
        Ok(probe) => probe,
        Err(failure) => return error(StatusCode::BAD_REQUEST, &failure.to_string()),
    };

    let Some(video) = probe.video.as_ref() else {
        return error(StatusCode::BAD_REQUEST, "That file has no video stream.");
    };

    let range = video.range;
    let range_base = video.range_base;
    let bit_depth = video.bit_depth;
    let size = Some((video.width, video.height));
    let capabilities = detect_capabilities(&config.ffmpeg, &config.device).await;
    let duration = probe.duration_seconds;

    if !request.wait {
        match claim_for_a_live_job(
            state.previews.renders(),
            &id,
            request.correlation_id.as_deref(),
        )
        .await
        {
            Claimed::JobStopped => return error(StatusCode::CONFLICT, JOB_STOPPED),
            Claimed::UnderWay => {}
            Claimed::Taken(claimed) => {
                cut_in_the_background(
                    &state,
                    &request,
                    &path,
                    crate::preview::Source {
                        range,
                        range_base,
                        bit_depth,
                        size,
                        bars: None,
                    },
                    &capabilities,
                    duration,
                    claimed,
                );
            }
        }

        return (
            StatusCode::ACCEPTED,
            Json(PreviewClip {
                url: format!("/previews/{id}/{}", crate::preview::PREVIEW_NAME),
                id,
                is_ready: false,
            }),
        )
            .into_response();
    }

    match state
        .queue
        .run(
            PreviewJob::new(name_of(&path)),
            request.correlation_id.as_deref(),
            state.previews.generate(
                crate::preview::Tools {
                    ffmpeg: &config.ffmpeg,
                    device: &config.device,
                },
                &config.artefact_root,
                &request,
                crate::preview::Source {
                    range,
                    range_base,
                    bit_depth,
                    size,
                    bars: None,
                },
                &capabilities,
                duration,
            ),
        )
        .await
    {
        Ok(clip) => (StatusCode::OK, Json(clip)).into_response(),
        Err(failure) => error(StatusCode::INTERNAL_SERVER_ERROR, &failure.to_string()),
    }
}

/// What is still wanted, as the requests that would ask for it.
///
/// Requests rather than addresses, deliberately. The address is a hash of the
/// request and belongs to the request type; a caller that computed it instead
/// would be a second implementation of the naming scheme, and the first time the
/// two disagreed the sweep would delete every artefact still in use.
///
/// Read one entry at a time. An entry naming a film kept as several files whose
/// list cannot be written now — a part gone missing since the server last
/// looked — is left out rather than failing the sweep, which only lets that
/// film's artefacts go until it is whole again. It is told apart by reading
/// the entry again with its first part in place of its parts: one that reads
/// then failed only for its parts. Any other entry that cannot be read still
/// refuses the whole sweep, since leaving it out would delete what it keeps.
#[derive(Debug, Deserialize)]
struct SweepRequest {
    keep: Vec<serde_json::Value>,
}

impl SweepRequest {
    /// The entries as the requests they are, or why the sweep cannot go ahead.
    fn kept<T: serde::de::DeserializeOwned>(self) -> Result<Vec<T>, String> {
        let mut kept = Vec::with_capacity(self.keep.len());

        for entry in self.keep {
            let first_part = entry
                .get("inputPath")
                .and_then(serde_json::Value::as_array)
                .and_then(|parts| parts.first())
                .and_then(|part| part.get("path"))
                .cloned();
            let reads_as_one_file = first_part.is_some_and(|path| {
                let mut alone = entry.clone();

                alone["inputPath"] = path;

                serde_json::from_value::<T>(alone).is_ok()
            });

            match serde_json::from_value::<T>(entry) {
                Ok(request) => kept.push(request),
                Err(error) if reads_as_one_file => {
                    tracing::warn!(
                        target: "transcode",
                        %error,
                        "left a film kept as several files out of a sweep"
                    );
                }
                Err(error) => return Err(error.to_string()),
            }
        }

        Ok(kept)
    }
}

/// Removes preview clips nothing addresses any more.
async fn sweep_previews(
    State(state): State<AppState>,
    Json(request): Json<SweepRequest>,
) -> Response {
    let keep: HashSet<String> = match request.kept::<PreviewRequest>() {
        Ok(kept) => kept.iter().map(PreviewRequest::id).collect(),
        Err(reason) => return error(StatusCode::UNPROCESSABLE_ENTITY, &reason),
    };
    let root = state.registry.config().artefact_root.join("previews");

    let report = cache_sweep::sweep(&root, &keep, cache_sweep::GRACE).await;

    (StatusCode::OK, Json(report)).into_response()
}

/// Counts what the artefact cache holds, now.
///
/// The figure on the dashboard is taken on a timer, because walking every
/// artefact directory is far too expensive to do when a page loads. This is
/// the exception an operator can ask for: somebody who has just run a sweep
/// wants to see the number move rather than wait five minutes to believe it.
async fn measure_cache(State(state): State<AppState>) -> Response {
    let root = state.registry.config().artefact_root.clone();
    let reading = state.monitor.count_cache(&root).await;

    (StatusCode::OK, Json(reading)).into_response()
}

/// Removes thumbnail sheets nothing addresses any more.
async fn sweep_trickplay(
    State(state): State<AppState>,
    Json(request): Json<SweepRequest>,
) -> Response {
    let keep: HashSet<String> = match request.kept::<TrickplayRequest>() {
        Ok(kept) => kept.iter().map(TrickplayRequest::id).collect(),
        Err(reason) => return error(StatusCode::UNPROCESSABLE_ENTITY, &reason),
    };
    let root = state.registry.config().artefact_root.join("trickplay");

    let report = cache_sweep::sweep(&root, &keep, cache_sweep::GRACE).await;

    (StatusCode::OK, Json(report)).into_response()
}

/// What a forget answers.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ForgetReport {
    /// Whether there was anything there to remove.
    forgotten: bool,
}

/// What a render asked for by a stopped job is answered with.
const JOB_STOPPED: &str = "The job that asked for this was stopped.";

/// Whether an ask comes from one of the server's jobs that has been stopped.
async fn is_from_a_stopped_job(renders: &RenderRegistry, correlation_id: Option<&str>) -> bool {
    match correlation_id {
        Some(job) => renders.is_job_stopped(job).await,
        None => false,
    }
}

/// What asking to draw a render for one of the server's jobs came to.
enum Claimed {
    /// This caller draws it.
    Taken(Claim),
    /// Something else is already drawing it.
    UnderWay,
    /// The job that asked has been stopped, so the render is not drawn.
    JobStopped,
}

/// Takes a render to draw for one of the server's jobs, unless something
/// already has it or the job has been stopped.
///
/// The job is looked at again once the render is claimed. A stop that lands
/// while the file is still being probed finds no switch to throw, because the
/// claim that makes one has not happened yet; the job is recorded before any
/// switch is thrown, so this second look sees it.
///
/// # Returns
///
/// The claim, or why there is none.
async fn claim_for_a_live_job(
    renders: &RenderRegistry,
    id: &str,
    correlation_id: Option<&str>,
) -> Claimed {
    let Some(claimed) = renders.claim(id, correlation_id).await else {
        return Claimed::UnderWay;
    };

    if is_from_a_stopped_job(renders, correlation_id).await {
        renders.give_up(id).await;

        return Claimed::JobStopped;
    }

    Claimed::Taken(claimed)
}

/// Stops the render of an address and waits for it to let go, so its files
/// are not removed from under a running ffmpeg.
///
/// Removing them first is what made clearing a library's previews read as an
/// encode failure: ffmpeg was part way through a clip, lost the folder it was
/// writing into, and said so.
async fn stop_before_forgetting(renders: &RenderRegistry, id: &str) {
    if !renders.stop(id).await {
        return;
    }

    for _ in 0..STOPPING_CHECKS {
        if !renders.is_claimed(id).await {
            break;
        }

        tokio::time::sleep(STOPPING_CHECK_EVERY).await;
    }
}

/// Which of the server's jobs to stop the renders of.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StopRenders {
    correlation_id: String,
}

/// How many renders were stopped.
#[derive(Debug, Serialize)]
struct StoppedRenders {
    stopped: usize,
}

/// Stops every clip and sheet one of the server's jobs asked for, at once.
///
/// Stopping a job on the server only stops it asking. What it had already
/// asked for went on encoding here, for as long as each render took, while
/// the jobs page said it had stopped.
async fn stop_renders(State(state): State<AppState>, Json(request): Json<StopRenders>) -> Response {
    let stopped = state
        .previews
        .renders()
        .stop_job(&request.correlation_id)
        .await
        + state
            .trickplay
            .renders()
            .stop_job(&request.correlation_id)
            .await;

    (StatusCode::OK, Json(StoppedRenders { stopped })).into_response()
}

/// Removes one clip, so the next request for it makes it again.
///
/// Takes the request rather than an address for the same reason the sweep does:
/// the address is a hash of the request and belongs here, so there is no id for
/// a caller to get wrong and nothing to escape a directory with.
async fn forget_preview(
    State(state): State<AppState>,
    Json(request): Json<PreviewRequest>,
) -> Response {
    let root = state.registry.config().artefact_root.join("previews");
    let id = request.id();

    stop_before_forgetting(state.previews.renders(), &id).await;

    let forgotten = cache_sweep::forget(&root, &id).await;

    (StatusCode::OK, Json(ForgetReport { forgotten })).into_response()
}

/// Removes one set of sheets, so the next request draws them again.
/// Prepares a whole file for keeping, or says how far along one is.
///
/// Answers immediately either way. Preparing a feature film takes minutes, and
/// a request that waited for it would hold a socket open long past anything
/// sensible — so the first ask starts the work and every ask, including that
/// one, gets back how far through it is.
async fn start_download(
    State(state): State<AppState>,
    Json(request): Json<DownloadRequest>,
) -> Response {
    let path = PathBuf::from(&request.spec.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    let config = state.registry.config();
    let id = request.id();

    if download::is_complete(&config.cache_root, &id).await {
        return (
            StatusCode::OK,
            Json(DownloadFile {
                file: format!("/downloads/{id}/{}", download::DOWNLOAD_NAME),
                is_ready: true,
                progress: 100,
                bytes_per_second: None,
                size_bytes: download::size_of(&config.cache_root, &id).await,
                id,
                failure: None,
                seconds_left: None,
            }),
        )
            .into_response();
    }

    if let Some((progress, rate)) = state.downloads.progress(&id).await {
        let left = state.downloads.time_left(&id).await;

        return (
            StatusCode::ACCEPTED,
            Json(download::pending(id, progress, rate, left)),
        )
            .into_response();
    }

    if let Some(reason) = state.downloads.failure(&id).await {
        return (StatusCode::OK, Json(download::failed(id, reason))).into_response();
    }

    if !state.downloads.claim(&id).await {
        return (
            StatusCode::ACCEPTED,
            Json(download::pending(id, 0, None, None)),
        )
            .into_response();
    }

    prepare_in_the_background(&state, &request, &path, id.clone());

    (
        StatusCode::ACCEPTED,
        Json(download::pending(id, 0, None, None)),
    )
        .into_response()
}

/// Serves a prepared download.
async fn download_file(
    State(state): State<AppState>,
    AxumPath((id, name)): AxumPath<(String, String)>,
    headers: HeaderMap,
) -> Response {
    serve_file(
        &download::directory_for(&state.registry.config().cache_root, &id),
        &name,
        requested_range(&headers),
    )
    .await
}

/// Stops a preparation where it is, keeping what it has finished.
///
/// The parts already written stay on disk, so asking for the same download again
/// picks up from there. Answering that nothing was stopped is not a failure — it
/// means the work had already finished or had never started.
async fn stop_download(
    State(state): State<AppState>,
    Json(request): Json<ForgetDownload>,
) -> Response {
    let stopped = state.downloads.stop(&request.id).await;

    (StatusCode::OK, Json(StopReport { stopped })).into_response()
}

/// Whether there was anything to stop.
#[derive(Debug, Serialize)]
struct StopReport {
    stopped: bool,
}

/// Throws away a prepared download, so its disk can be used for something else.
async fn forget_download(
    State(state): State<AppState>,
    Json(request): Json<ForgetDownload>,
) -> Response {
    let root = state.registry.config().cache_root.join("downloads");

    if state.downloads.stop(&request.id).await {
        for _ in 0..STOPPING_CHECKS {
            if !state.downloads.is_claimed(&request.id).await {
                break;
            }

            tokio::time::sleep(STOPPING_CHECK_EVERY).await;
        }
    }

    let forgotten = cache_sweep::forget(&root, &request.id).await;

    (StatusCode::OK, Json(ForgetReport { forgotten })).into_response()
}

/// How many times to look for a stopped download to have let go before its files are removed.
const STOPPING_CHECKS: u32 = 50;

/// How long to wait between those looks.
const STOPPING_CHECK_EVERY: std::time::Duration = std::time::Duration::from_millis(100);

/// Which prepared download to throw away.
#[derive(Debug, Deserialize)]
struct ForgetDownload {
    id: String,
}

async fn forget_trickplay(
    State(state): State<AppState>,
    Json(request): Json<TrickplayRequest>,
) -> Response {
    let root = state.registry.config().artefact_root.join("trickplay");
    let id = request.id();

    stop_before_forgetting(state.trickplay.renders(), &id).await;

    let forgotten = cache_sweep::forget(&root, &id).await;

    (StatusCode::OK, Json(ForgetReport { forgotten })).into_response()
}

/// Serves a made clip.
async fn preview_file(
    State(state): State<AppState>,
    AxumPath((id, name)): AxumPath<(String, String)>,
    headers: HeaderMap,
) -> Response {
    let directory = preview_directory(&state.registry.config().artefact_root, &id);

    serve_file(&directory, &name, requested_range(&headers)).await
}

/// Takes a single frame out of a file.
///
/// Answers with the JPEG itself rather than a path, because the caller is
/// about to put it on a page and a second round trip would defeat the point of
/// having it early.
async fn start_frame(State(state): State<AppState>, Json(request): Json<FrameRequest>) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    match take_frame(
        &state.registry.config().ffmpeg,
        &path,
        request.at_seconds,
        request.width,
    )
    .await
    {
        Ok(picture) => (
            StatusCode::OK,
            [(header::CONTENT_TYPE, "image/jpeg")],
            picture,
        )
            .into_response(),
        Err(failure) => error(StatusCode::BAD_REQUEST, &failure.to_string()),
    }
}

/// Answers with a subtitle track, or with why it could not be read.
fn answer_with_track(outcome: Result<SubtitleTrack, SubtitleError>) -> Response {
    match outcome {
        Ok(track) => (StatusCode::OK, Json(track)).into_response(),
        Err(failure) => error(StatusCode::BAD_REQUEST, &failure.to_string()),
    }
}

/// Lists the fonts a file carries for its subtitles.
async fn list_fonts(
    State(state): State<AppState>,
    Json(request): Json<crate::fonts::FontsRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    let config = state.registry.config();
    let tools = Tools {
        ffmpeg: config.ffmpeg.clone(),
        ffprobe: state.ffprobe.clone(),
    };

    match crate::fonts::list(&tools, &config.artefact_root, &path).await {
        Ok(found) => (StatusCode::OK, Json(found)).into_response(),
        Err(failure) => error(StatusCode::BAD_REQUEST, &failure.to_string()),
    }
}

/// Hands over one font a file carries, by name.
async fn read_font(
    State(state): State<AppState>,
    Json(request): Json<crate::fonts::FontRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    let config = state.registry.config();
    let tools = Tools {
        ffmpeg: config.ffmpeg.clone(),
        ffprobe: state.ffprobe.clone(),
    };

    match crate::fonts::read(&tools, &config.artefact_root, &path, &request.name).await {
        Ok(bytes) => (
            StatusCode::OK,
            [(header::CONTENT_TYPE, "application/octet-stream")],
            bytes,
        )
            .into_response(),
        Err(failure) => error(StatusCode::NOT_FOUND, &failure.to_string()),
    }
}

/// Reads one subtitle track out of a container.
///
/// Answers with the whole track rather than a path, because a subtitle file is
/// a few tens of kilobytes and the player wants all of it before the first cue
/// is due. Not queued: somebody is waiting for it.
///
/// How long it waits, and what happens when the viewer gives up, is the
/// registry's to decide.
async fn start_subtitle(
    State(state): State<AppState>,
    Json(request): Json<SubtitleRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    let config = state.registry.config();
    let tools = Tools {
        ffmpeg: config.ffmpeg.clone(),
        ffprobe: state.ffprobe.clone(),
    };

    answer_with_track(
        state
            .subtitles
            .read(
                tools,
                &config.artefact_root,
                path,
                request.stream_index,
                request.format,
            )
            .await,
    )
}

/// Answers with the words of a picture subtitle track where they have been
/// read, and otherwise starts reading them and says so.
async fn read_picture_subtitle(
    State(state): State<AppState>,
    Json(request): Json<crate::picture_subtitles::PictureSubtitleRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    let config = state.registry.config();
    let answer = state
        .picture_subtitles
        .read_or_start(
            &config.ffmpeg,
            &config.artefact_root,
            path,
            request.stream_index,
            request.language.as_deref(),
        )
        .await;

    (StatusCode::OK, Json(answer)).into_response()
}

/// Answers with the subtitles Whisper wrote for a film where it has listened
/// to it, and otherwise starts listening and says so.
async fn read_generated_subtitle(
    State(state): State<AppState>,
    Json(request): Json<crate::whisper_subtitles::GeneratedSubtitleRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    let config = state.registry.config();
    let answer = state
        .generated_subtitles
        .read_or_start(&config.ffmpeg, &config.artefact_root, path, &request)
        .await;

    (StatusCode::OK, Json(answer)).into_response()
}

/// Renders seek-bar previews for a file.
///
/// Answers with the index rather than the images: the player fetches sheets
/// only for the part of the timeline the viewer actually hovers over.
/// Draws a set of thumbnails on the queue, for a caller that is not waiting.
///
/// The claim is already taken by the caller, and is given up here whatever
/// becomes of the work — including where the queue drops it before it runs,
/// which would otherwise leave that film unable to be asked for again.
/// Names a rendition to stop or to remove: the path it was to be written to.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenditionPath {
    #[serde(deserialize_with = "crate::path_map::deserialize")]
    pub output_path: String,
}

/// Starts producing a kept file, or says how the one already under way is getting on.
///
/// The one route here that writes outside the service's own directories, so it checks two things
/// rather than one: that the source may be read, and that the destination may be written. The
/// second is not the first — a library mounted read only is a normal and sensible way to run a
/// media server, and this is the place to say so rather than two hours into an encode.
async fn start_rendition(
    State(state): State<AppState>,
    Json(request): Json<RenditionRequest>,
) -> Response {
    let source = PathBuf::from(&request.spec.input_path);
    let output = PathBuf::from(&request.output_path);

    if !state.is_readable(&source) {
        return outside_the_roots(&source);
    }

    if !state.is_writable(&output) {
        return error(
            StatusCode::FORBIDDEN,
            "That destination is outside the directories this service may write to.",
        );
    }

    let id = request.id();

    if rendition::is_complete(&output).await {
        let size = tokio::fs::metadata(&output)
            .await
            .ok()
            .map(|found| found.len());

        return (
            StatusCode::OK,
            Json(rendition::RenditionFile {
                id,
                is_ready: true,
                progress: 100,
                bytes_per_second: None,
                size_bytes: size,
                failure: None,
            }),
        )
            .into_response();
    }

    if let Some(reason) = state.renditions.failure(&id).await {
        return (StatusCode::OK, Json(rendition::failed(id, reason))).into_response();
    }

    if let Some((progress, rate)) = state.renditions.progress(&id).await {
        return (
            StatusCode::ACCEPTED,
            Json(rendition::pending(id, progress, rate)),
        )
            .into_response();
    }

    if !state.renditions.claim(&id).await {
        return (StatusCode::ACCEPTED, Json(rendition::pending(id, 0, None))).into_response();
    }

    write_in_the_background(&state, &request, &source, id.clone());

    (StatusCode::ACCEPTED, Json(rendition::pending(id, 0, None))).into_response()
}

/// Asks a running encode to stop, and takes its working file with it.
async fn stop_rendition(
    State(state): State<AppState>,
    Json(request): Json<RenditionPath>,
) -> Response {
    let stopped = state.renditions.stop(&request.output_path).await;

    (
        StatusCode::OK,
        Json(serde_json::json!({ "stopped": stopped })),
    )
        .into_response()
}

/// Removes a finished rendition, for somebody who did not like it.
///
/// Refused for anything outside a write root, on the same reasoning as writing one: the service
/// should never be handed a path to delete on somebody else's authority.
async fn forget_rendition(
    State(state): State<AppState>,
    Json(request): Json<RenditionPath>,
) -> Response {
    let path = PathBuf::from(&request.output_path);

    if !state.is_writable(&path) {
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the directories this service may write to.",
        );
    }

    match rendition::forget(&path).await {
        Ok(()) => (StatusCode::OK, Json(serde_json::json!({ "removed": true }))).into_response(),
        Err(failure) => error(StatusCode::BAD_REQUEST, &failure.to_string()),
    }
}

/// Writes a kept file on the queue, for a caller that is not waiting.
///
/// The claim is taken before this is called and released here whatever happens. A failure is left
/// against the address rather than dropped, because an encode that fails in the background has
/// nobody to tell and the next ask would otherwise start the same doomed two hours again.
fn write_in_the_background(state: &AppState, request: &RenditionRequest, path: &Path, id: String) {
    let config = state.registry.config();
    let renditions = state.renditions.clone();
    let queue = state.queue.clone();
    let ffmpeg = config.ffmpeg.clone();
    let ffprobe = state.ffprobe.clone();
    let device = config.device.clone();
    let asked = request.clone();
    let subject = name_of(path);

    tokio::spawn(async move {
        let plan = TranscodePlan {
            device_filters: crate::capability::device_filters_for(
                &ffmpeg,
                &device,
                asked.spec.hardware_accel,
            )
            .await,
            spec: asked.spec.clone(),
            output_directory: String::new(),
            device,
            start_at: SegmentStart::default(),
            cut_seconds: 0.0,
        };

        let noting = renditions.clone();
        let noted = id.clone();
        let stop = renditions.stopper(&id).await;

        let outcome = queue
            .run(
                RenditionJob::new(subject),
                None,
                rendition::generate(
                    &ffmpeg,
                    &ffprobe,
                    &plan,
                    &asked,
                    &stop,
                    move |progress, rate| {
                        let noting = noting.clone();
                        let noted = noted.clone();

                        tokio::spawn(async move {
                            noting.note(&noted, progress, rate).await;
                        });
                    },
                ),
            )
            .await;

        if let Err(failure) = outcome {
            tracing::warn!(target: "rendition", %failure, subject = %id, "could not write the rendition");
            renditions.fail(&id, failure.to_string()).await;
        }

        renditions.release(&id).await;
    });
}

/// Starts preparing a download and returns without waiting for it.
///
/// The claim is taken before this is called and released here whatever happens.
/// A preparation that fails while still holding its claim is a film nobody can
/// ask for again until the service restarts.
fn prepare_in_the_background(state: &AppState, request: &DownloadRequest, path: &Path, id: String) {
    let config = state.registry.config();
    let downloads = state.downloads.clone();
    let queue = state.queue.clone();
    let ffmpeg = config.ffmpeg.clone();
    let cache_root = config.cache_root.clone();
    let device = config.device.clone();
    let asked = request.clone();
    let subject = name_of(path);

    tokio::spawn(async move {
        let plan = TranscodePlan {
            spec: asked.spec.clone(),
            output_directory: download::directory_for(&cache_root, &id)
                .to_string_lossy()
                .into_owned(),
            device,
            device_filters: DeviceFilters::default(),
            start_at: SegmentStart::default(),
            cut_seconds: 0.0,
        };

        let noting = downloads.clone();
        let noted = id.clone();
        let stop = downloads.stopper(&id).await;

        let outcome = queue
            .run(
                DownloadJob::new(subject),
                None,
                download::generate(
                    &ffmpeg,
                    &cache_root,
                    &plan,
                    &asked,
                    stop,
                    move |progress, rate| {
                        let noting = noting.clone();
                        let noted = noted.clone();

                        tokio::spawn(async move {
                            noting.note(&noted, progress, rate).await;
                        });
                    },
                ),
            )
            .await;

        if let Err(failure) = outcome {
            tracing::warn!(target: "download", %failure, subject = %id, "could not prepare the download");

            if !matches!(failure, download::DownloadError::Stopped) {
                downloads.fail(&id, failure.to_string()).await;
            }
        }

        downloads.release(&id).await;
    });
}

/// Cuts a clip without holding the asker, and remembers what went wrong.
///
/// The same shape sheets use. A caller that will not wait is answered at once
/// and asks again; the failure that would otherwise have nobody to tell is kept
/// against the address until somebody does.
fn cut_in_the_background(
    state: &AppState,
    request: &PreviewRequest,
    path: &Path,
    source: crate::preview::Source,
    capabilities: &Capabilities,
    duration_seconds: f64,
    claimed: Claim,
) {
    let config = state.registry.config();
    let previews = state.previews.clone();
    let queue = state.queue.clone();
    let ffmpeg = config.ffmpeg.clone();
    let device = config.device.clone();
    let artefact_root = config.artefact_root.clone();
    let queued = request.clone();
    let correlation_id = request.correlation_id.clone();
    let subject = name_of(path);
    let found = capabilities.clone();

    let Claim { id, stop } = claimed;

    tokio::spawn(async move {
        let outcome = queue
            .run_until(
                PreviewJob::new(subject),
                correlation_id.as_deref(),
                stop.stopped(),
                previews.generate(
                    crate::preview::Tools {
                        ffmpeg: &ffmpeg,
                        device: &device,
                    },
                    &artefact_root,
                    &queued,
                    source,
                    &found,
                    duration_seconds,
                ),
            )
            .await;

        match outcome {
            Ok(Ok(_)) => {}
            Ok(Err(failure)) => {
                previews.remember_failure(&id, failure.to_string()).await;
            }
            Err(()) => {
                cache_sweep::forget(&artefact_root.join("previews"), &id).await;
            }
        }

        previews.give_up(&id).await;
    });
}

fn draw_in_the_background(
    state: &AppState,
    request: &TrickplayRequest,
    path: &Path,
    source: SheetSource,
    on_device: (Option<HardwareAccel>, Capabilities),
    claimed: Claim,
) {
    let config = state.registry.config();
    let trickplay = state.trickplay.clone();
    let queue = state.queue.clone();
    let ffmpeg = config.ffmpeg.clone();
    let device = config.device.clone();
    let artefact_root = config.artefact_root.clone();
    let queued = request.clone();
    let correlation_id = request.correlation_id.clone();
    let subject = name_of(path);
    let (accel, found) = on_device;

    let Claim { id, stop } = claimed;

    tokio::spawn(async move {
        let outcome = queue
            .run_until(
                TrickplayJob::new(subject),
                correlation_id.as_deref(),
                stop.stopped(),
                trickplay.generate(
                    crate::trickplay::Tools {
                        ffmpeg: &ffmpeg,
                        device: &device,
                        capabilities: &found,
                    },
                    &artefact_root,
                    &queued,
                    source,
                    accel,
                ),
            )
            .await;

        match outcome {
            Ok(Ok(_)) => {}
            Ok(Err(failure)) => {
                trickplay.remember_failure(&id, failure.to_string()).await;
            }
            Err(()) => {
                cache_sweep::forget(&artefact_root.join("trickplay"), &id).await;
            }
        }

        trickplay.give_up(&id).await;
    });
}

/// What a probed file is, as far as drawing its thumbnails cares.
fn sheet_source(video: &crate::media::VideoStream, duration_seconds: f64) -> SheetSource {
    SheetSource {
        width: video.width,
        height: video.height,
        range: video.range,
        range_base: video.range_base,
        frames_per_second: video.frame_rate,
        bit_depth: video.bit_depth,
        duration_seconds,
    }
}

/// The graphics chip to draw sheets on, where one will draw them from a file
/// of this depth and range.
///
/// An HDR film stays on the device only where the device's own tone mapper takes it. Intel's VPP
/// converts HDR10 alone, so anything else is drawn by the processor, which converts it.
fn sheet_accel(
    capabilities: &Capabilities,
    asked: Option<HardwareAccel>,
    source: &SheetSource,
) -> Option<HardwareAccel> {
    capabilities
        .encoder_for("h264", asked)
        .map(|found| found.accel)
        .filter(|found| {
            crate::chains::runs_here(
                &capabilities.chains,
                *found,
                crate::chains::ChainShape::Sheet,
                source.bit_depth,
            )
        })
        .filter(|found| {
            source.range == crate::media::VideoRange::Sdr
                || found
                    .tone_map_for(source.range, source.range_base)
                    .is_some()
        })
}

async fn start_trickplay(
    State(state): State<AppState>,
    Json(request): Json<TrickplayRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    if is_from_a_stopped_job(state.trickplay.renders(), request.correlation_id.as_deref()).await {
        return error(StatusCode::CONFLICT, JOB_STOPPED);
    }

    if let Some(index) =
        crate::trickplay::finished_index(&state.registry.config().artefact_root, &request).await
    {
        return (StatusCode::OK, Json(index)).into_response();
    }

    let probe = match probe_media(&state.ffprobe, &path).await {
        Ok(probe) => probe,
        Err(failure) => return error(StatusCode::BAD_REQUEST, &failure.to_string()),
    };

    let Some(video) = probe.video.as_ref() else {
        return error(StatusCode::BAD_REQUEST, "That file has no video stream.");
    };

    let config = state.registry.config();
    let capabilities = detect_capabilities(&config.ffmpeg, &config.device).await;
    let source = sheet_source(video, probe.duration_seconds);

    let accel = sheet_accel(&capabilities, request.hardware_accel, &source);

    if !request.wait {
        let id = request.id();

        if let Some(failure) = state.trickplay.take_failure(&id).await {
            return error(StatusCode::INTERNAL_SERVER_ERROR, &failure);
        }

        if !is_complete(&config.artefact_root, &id).await {
            let tile_height = tile_height_for(request.tile_width, video.width, video.height);
            let pending = pending_index(&request, tile_height);

            let claimed = match claim_for_a_live_job(
                state.trickplay.renders(),
                &id,
                request.correlation_id.as_deref(),
            )
            .await
            {
                Claimed::JobStopped => return error(StatusCode::CONFLICT, JOB_STOPPED),
                Claimed::UnderWay => return (StatusCode::ACCEPTED, Json(pending)).into_response(),
                Claimed::Taken(claimed) => claimed,
            };

            draw_in_the_background(
                &state,
                &request,
                &path,
                source,
                (accel, capabilities.clone()),
                claimed,
            );

            return (StatusCode::ACCEPTED, Json(pending)).into_response();
        }

        return match state
            .trickplay
            .generate(
                crate::trickplay::Tools {
                    ffmpeg: &config.ffmpeg,
                    device: &config.device,
                    capabilities: &capabilities,
                },
                &config.artefact_root,
                &request,
                source,
                accel,
            )
            .await
        {
            Ok(index) => (StatusCode::OK, Json(index)).into_response(),
            Err(failure) => error(StatusCode::INTERNAL_SERVER_ERROR, &failure.to_string()),
        };
    }

    match state
        .queue
        .run(
            TrickplayJob::new(name_of(&path)),
            request.correlation_id.as_deref(),
            state.trickplay.generate(
                crate::trickplay::Tools {
                    ffmpeg: &config.ffmpeg,
                    device: &config.device,
                    capabilities: &capabilities,
                },
                &config.artefact_root,
                &request,
                source,
                accel,
            ),
        )
        .await
    {
        Ok(index) => (StatusCode::OK, Json(index)).into_response(),
        Err(failure) => error(StatusCode::INTERNAL_SERVER_ERROR, &failure.to_string()),
    }
}

async fn trickplay_file(
    State(state): State<AppState>,
    AxumPath((id, name)): AxumPath<(String, String)>,
    headers: HeaderMap,
) -> Response {
    serve_file(
        &directory_for(&state.registry.config().artefact_root, &id),
        &name,
        requested_range(&headers),
    )
    .await
}

/// Fingerprints a window of a file's audio.
///
/// Answers with the hashes rather than a verdict: deciding what two episodes
/// share is arithmetic over those hashes, and arithmetic does not belong in
/// the service that owns `FFmpeg`.
async fn start_fingerprint(
    State(state): State<AppState>,
    Json(request): Json<FingerprintRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    match state
        .queue
        .run(
            FingerprintJob::new(name_of(&PathBuf::from(&request.input_path))),
            request.correlation_id.as_deref(),
            fingerprint(&state.registry.config().ffmpeg, &request),
        )
        .await
    {
        Ok(prints) => (StatusCode::OK, Json(prints)).into_response(),
        Err(failure) => error(StatusCode::BAD_REQUEST, &failure.to_string()),
    }
}

async fn start_credit_frames(
    State(state): State<AppState>,
    Json(request): Json<CreditFramesRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return outside_the_roots(&path);
    }

    match state
        .queue
        .run(
            CreditFramesJob::new(name_of(&path)),
            request.correlation_id.as_deref(),
            read_credit_frames(&state.registry.config().ffmpeg, &request),
        )
        .await
    {
        Ok(frames) => (StatusCode::OK, Json(frames)).into_response(),
        Err(failure) => error(StatusCode::BAD_REQUEST, &failure.to_string()),
    }
}

/// Who is letting go of a session.
///
/// Optional, and a request without it stops a hold without saying whose. That
/// is what an older caller sends, and it costs only the accuracy of what the
/// next joiner is told about who else is watching.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StopSessionQuery {
    device_id: Option<String>,
}

async fn stop_session(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
    Query(query): Query<StopSessionQuery>,
) -> Response {
    if let_go(&state, &id, query.device_id.as_deref()).await {
        return (StatusCode::NO_CONTENT, Body::empty()).into_response();
    }

    error(StatusCode::NOT_FOUND, "No such session.")
}

/// What a player reports about itself, on a fixed interval, so a paused tab
/// left open is not mistaken for one that was closed.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HeartbeatRequest {
    is_playing: bool,
}

async fn heartbeat_session(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<String>,
    Json(request): Json<HeartbeatRequest>,
) -> Response {
    if state.registry.heartbeat(&id, request.is_playing).await
        || (revive(&state, &id).await && state.registry.heartbeat(&id, request.is_playing).await)
    {
        return (StatusCode::NO_CONTENT, Body::empty()).into_response();
    }

    error(StatusCode::NOT_FOUND, "No such session.")
}

/// How many pieces of background work may run at once.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct QueueConcurrency {
    concurrency: usize,
}

/// The most an operator may ask the queue to run at once. More than this is not a faster machine, it
/// is a typo.
const MOST_AT_ONCE: usize = 64;

/// Changes how many pieces of background work run at once, from now on.
async fn set_queue_concurrency(
    State(state): State<AppState>,
    Json(request): Json<QueueConcurrency>,
) -> Response {
    if request.concurrency == 0 || request.concurrency > MOST_AT_ONCE {
        return error(
            StatusCode::BAD_REQUEST,
            "Concurrency must be between one and sixty-four.",
        );
    }

    state.queue.set_concurrency(request.concurrency);

    (StatusCode::OK, Json(state.queue.snapshot().await)).into_response()
}

/// Holds back background work that has not started.
async fn pause_queue(State(state): State<AppState>) -> Response {
    state.queue.pause();

    (StatusCode::OK, Json(state.queue.snapshot().await)).into_response()
}

/// Lets held-back background work start again.
async fn resume_queue(State(state): State<AppState>) -> Response {
    state.queue.resume();

    (StatusCode::OK, Json(state.queue.snapshot().await)).into_response()
}

/// Starts one waiting job now, past the ceiling and past a pause.
async fn run_queued_job_now(
    State(state): State<AppState>,
    AxumPath(id): AxumPath<u64>,
) -> Response {
    if state.queue.run_now(id).await {
        return (StatusCode::NO_CONTENT, Body::empty()).into_response();
    }

    error(StatusCode::NOT_FOUND, "No such job is waiting.")
}

/// Everything an operator watching the server reads.
///
/// One request rather than four, because these are read together and read
/// often: a page refreshing four endpoints a second is four times the work for
/// no more information.
async fn monitor(State(state): State<AppState>) -> Response {
    let report = Report {
        resources: state.monitor.measure().await,
        queue: state.queue.snapshot().await,
        sessions: state.registry.len().await,
        logs: state.monitor.journal().read(),
        cache: state.monitor.cache().await,
    };

    (StatusCode::OK, Json(report)).into_response()
}

/// The same report, over and over, over a socket.
///
/// A socket rather than an event stream: the project keeps one transport for
/// everything that pushes rather than two, and a socket costs nothing an
/// event stream does not already pay for on this connection — one direction
/// only, in practice, since nothing meaningful arrives from the other end.
async fn monitor_stream(State(state): State<AppState>, upgrade: WebSocketUpgrade) -> Response {
    upgrade.on_upgrade(|socket| watch_monitor(socket, state))
}

/// Sends a fresh [`Report`] down the socket on every tick, until the send
/// fails.
///
/// A failed send means the other end is gone — closed the tab, lost the
/// network — and there is nobody left to notice a loop that keeps measuring
/// for nobody.
async fn watch_monitor(mut socket: WebSocket, state: AppState) {
    let mut ticker = tokio::time::interval(MONITOR_INTERVAL);

    loop {
        ticker.tick().await;

        let report = Report {
            resources: state.monitor.measure().await,
            queue: state.queue.snapshot().await,
            sessions: state.registry.len().await,
            logs: state.monitor.journal().read(),
            cache: state.monitor.cache().await,
        };

        let Ok(payload) = serde_json::to_string(&report) else {
            continue;
        };

        if socket.send(Message::Text(payload.into())).await.is_err() {
            break;
        }
    }
}

/// What starting a live channel asks for.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartLiveRequest {
    address: String,
    #[serde(default)]
    user_agent: Option<String>,
    #[serde(default)]
    referrer: Option<String>,
    #[serde(default)]
    proxy: Option<String>,
}

/// The channel that was started or joined.
#[derive(Debug, Serialize)]
struct StartedLive {
    id: String,
}

async fn start_live(
    State(state): State<AppState>,
    Json(request): Json<StartLiveRequest>,
) -> Response {
    let asking = crate::live::Asking {
        user_agent: request.user_agent,
        referrer: request.referrer,
        proxy: request.proxy,
    };

    match state.registry.live().start(&request.address, &asking).await {
        Ok(id) => Json(StartedLive { id }).into_response(),
        Err(crate::live::LiveError::NotAStream) => {
            error(StatusCode::BAD_REQUEST, "That is not a network stream.")
        }
        Err(problem) => {
            tracing::warn!("live channel did not start: {problem}");

            error(StatusCode::BAD_GATEWAY, "The channel did not start.")
        }
    }
}

async fn live_file(
    State(state): State<AppState>,
    AxumPath((id, name)): AxumPath<(String, String)>,
) -> Response {
    let Some(path) = state.registry.live().file(&id, &name).await else {
        return error(StatusCode::NOT_FOUND, "No such channel.");
    };

    match tokio::fs::read(&path).await {
        Ok(bytes) => (
            [
                (header::CONTENT_TYPE, content_type_for(&name)),
                (header::CACHE_CONTROL, "no-store"),
            ],
            bytes,
        )
            .into_response(),
        Err(_) => error(StatusCode::NOT_FOUND, "Not written yet."),
    }
}

/// Builds the media service routes.
///
/// Returned as a router rather than a bound server so the whole surface can be
/// exercised in tests without a socket.
pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/monitor", get(monitor))
        .route("/queue/concurrency", post(set_queue_concurrency))
        .route("/queue/pause", post(pause_queue))
        .route("/queue/resume", post(resume_queue))
        .route("/queue/jobs/{id}/run-now", post(run_queued_job_now))
        .route("/monitor/stream", get(monitor_stream))
        .route("/cache/measure", post(measure_cache))
        .route("/capabilities", get(capabilities))
        .route("/hardware", get(hardware))
        .route("/hardware/test", post(test_hardware))
        .route("/probe", post(probe))
        .route("/reach", post(reach_folders))
        .route("/file", get(direct_file))
        .route("/audio", get(audio_rendition))
        .route("/sessions", post(start_session))
        .route("/sessions/{id}/{name}", get(session_file))
        .route("/sessions/{id}", axum::routing::delete(stop_session))
        .route(
            "/sessions/{id}/heartbeat",
            axum::routing::post(heartbeat_session),
        )
        .route("/fingerprint", post(start_fingerprint))
        .route("/credit-frames", post(start_credit_frames))
        .route("/frame", post(start_frame))
        .route("/previews", post(start_preview))
        .route("/previews/sweep", post(sweep_previews))
        .route("/previews/forget", post(forget_preview))
        .route("/previews/{id}/{name}", get(preview_file))
        .route("/subtitles", post(start_subtitle))
        .route("/subtitles/pictures", post(read_picture_subtitle))
        .route("/subtitles/generated", post(read_generated_subtitle))
        .route("/fonts", post(list_fonts))
        .route("/fonts/read", post(read_font))
        .route("/renditions", post(start_rendition))
        .route("/renditions/stop", post(stop_rendition))
        .route("/renditions/forget", post(forget_rendition))
        .route("/downloads", post(start_download))
        .route("/downloads/forget", post(forget_download))
        .route("/downloads/stop", post(stop_download))
        .route("/downloads/{id}/{name}", get(download_file))
        .route("/trickplay", post(start_trickplay))
        .route("/trickplay/sweep", post(sweep_trickplay))
        .route("/trickplay/forget", post(forget_trickplay))
        .route("/trickplay/{id}/{name}", get(trickplay_file))
        .route("/renders/stop", post(stop_renders))
        .route("/live", post(start_live))
        .route("/live/{id}/{name}", get(live_file))
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::{
        claim_for_a_live_job, content_type_for, is_safe_segment_name, locate, parse_range,
        reach_of, AppState, Claimed, FolderReach, SessionFileQuery, SweepRequest,
    };
    use crate::render_registry::RenderRegistry;
    use std::path::{Path, PathBuf};

    fn writing_to(roots: &[&str]) -> AppState {
        AppState {
            registry: crate::session::SessionRegistry::new(crate::session::SessionConfig {
                device: crate::transcode_plan::DEFAULT_DEVICE.to_owned(),
                ffmpeg: "ffmpeg".to_owned(),
                ffprobe: "ffprobe".to_owned(),
                cache_root: PathBuf::from("/tmp/transcodes"),
                artefact_root: PathBuf::from("/tmp/artefacts"),
                idle_timeout: std::time::Duration::from_secs(60),
                manifest_timeout: std::time::Duration::from_secs(120),
                keyframe_deadline: crate::boundaries::DEFAULT_KEYFRAME_DEADLINE,
                split_audio: false,
            }),
            ffprobe: "ffprobe".to_owned(),
            downloads: crate::progress_registry::ProgressRegistry::new(),
            renditions: crate::progress_registry::ProgressRegistry::new(),
            trickplay: crate::trickplay::TrickplayRegistry::new(),
            subtitles: crate::subtitle::SubtitleRegistry::new(),
            picture_subtitles: crate::picture_subtitles::PictureSubtitleRegistry::new(),
            generated_subtitles: crate::whisper_subtitles::GeneratedSubtitleRegistry::new(),
            previews: crate::preview::PreviewRegistry::new(),
            monitor: crate::monitor::Monitor::new(crate::monitor::Journal::new()),
            audio: crate::audio::AudioRegistry::new(),
            queue: crate::queue::WorkQueue::new(1),
            media_roots: Vec::new(),
            write_roots: roots.iter().map(PathBuf::from).collect(),
        }
    }

    /// A film kept as several files is read through a list in the cache, which is no media root:
    /// it may be read where every part may, and no further.
    #[test]
    fn reads_a_joined_film_only_where_every_part_may_be_read() {
        let _ = crate::joined_input::test_folder();

        let inside = std::env::temp_dir().join("valence-readable-inside");
        let outside = std::env::temp_dir().join("valence-readable-outside");

        for folder in [&inside, &outside] {
            std::fs::create_dir_all(folder).expect("makes the folder");
            std::fs::write(folder.join("cd1.mkv"), b"one").expect("writes a part");
            std::fs::write(folder.join("cd2.mkv"), b"two").expect("writes a part");
        }

        let part = |folder: &Path, name: &str| crate::joined_input::Part {
            path: folder.join(name).to_string_lossy().into_owned(),
            duration_seconds: 20.0,
        };
        let reading = AppState {
            media_roots: vec![inside.clone()],
            ..writing_to(&[])
        };
        let within =
            crate::joined_input::join(&[part(&inside, "cd1.mkv"), part(&inside, "cd2.mkv")])
                .expect("joins them");
        let reaching =
            crate::joined_input::join(&[part(&inside, "cd1.mkv"), part(&outside, "cd2.mkv")])
                .expect("joins them");

        assert!(reading.is_readable(Path::new(&within)));
        assert!(!reading.is_readable(Path::new(&reaching)));
    }

    /// A library folder inside the roots may be read, one outside may not, and with no roots set
    /// every folder may be read; only a folder inside a write root may be written into.
    #[test]
    fn says_which_library_folders_it_may_read_and_write() {
        let limited = AppState {
            media_roots: vec![PathBuf::from("/media")],
            ..writing_to(&["/media/Films"])
        };
        let open = writing_to(&[]);

        assert_eq!(
            reach_of(&limited, "/media/Films"),
            FolderReach {
                folder: "/media/Films".to_owned(),
                is_readable: true,
                is_writable: true,
            }
        );
        assert_eq!(
            reach_of(&limited, "/music"),
            FolderReach {
                folder: "/music".to_owned(),
                is_readable: false,
                is_writable: false,
            }
        );
        assert!(!reach_of(&limited, "/media/../music").is_readable);
        assert!(reach_of(&open, "/music").is_readable);
        assert!(!reach_of(&open, "/music").is_writable);
    }

    /// A film whose list cannot be written, a part gone missing since the server looked, is left
    /// out of a sweep; any other entry that cannot be read still stops it, since leaving that out
    /// would delete what it keeps.
    #[test]
    fn leaves_a_film_whose_parts_cannot_be_joined_out_of_a_sweep_and_nothing_else() {
        let _ = crate::joined_input::test_folder();

        let sweep = |keep: serde_json::Value| {
            serde_json::from_value::<SweepRequest>(serde_json::json!({ "keep": keep }))
                .expect("reads the request")
                .kept::<crate::preview::PreviewRequest>()
        };
        let missing_part = serde_json::json!({
            "inputPath": [
                { "path": "/nowhere/Film - cd1.mkv", "durationSeconds": 20.0 },
                { "path": "/nowhere/Film - cd2.mkv", "durationSeconds": 20.0 },
            ],
            "generation": 0,
        });
        let whole = serde_json::json!({ "inputPath": "/films/Film.mkv", "generation": 0 });

        assert_eq!(
            sweep(serde_json::json!([whole.clone(), missing_part])).map(|kept| kept.len()),
            Ok(1)
        );
        assert!(sweep(serde_json::json!([whole, { "inputPath": "/films/Other.mkv" }])).is_err());
        assert!(sweep(serde_json::json!([{
            "inputPath": [
                { "path": "/nowhere/Film - cd1.mkv", "durationSeconds": 20.0 },
                { "path": "/nowhere/Film - cd2.mkv", "durationSeconds": 20.0 },
            ],
        }]))
        .is_err());
    }

    /// A prefix test on a path holding `..` proves nothing about where the file is, so such a
    /// path is never read, whether it is asked for alone or as a part of a film.
    #[test]
    fn reads_no_path_that_climbs_out_of_its_root() {
        let _ = crate::joined_input::test_folder();

        let inside = std::env::temp_dir().join("valence-readable-climbing");

        std::fs::create_dir_all(&inside).expect("makes the folder");
        std::fs::write(inside.join("cd1.mkv"), b"one").expect("writes a part");

        let reading = AppState {
            media_roots: vec![inside.clone()],
            ..writing_to(&[])
        };
        let climbing = format!("{}/../{}", inside.display(), "elsewhere.mkv");
        let list = crate::joined_input::join(&[
            crate::joined_input::Part {
                path: inside.join("cd1.mkv").to_string_lossy().into_owned(),
                duration_seconds: 20.0,
            },
            crate::joined_input::Part {
                path: format!(
                    "{}/../{}",
                    inside.display(),
                    "valence-readable-climbing/cd1.mkv"
                ),
                duration_seconds: 20.0,
            },
        ])
        .expect("joins them");

        assert!(!reading.is_readable(Path::new(&climbing)));
        assert!(!reading.is_readable(Path::new(&list)));
    }

    /// A list is read only through its parts, so one that cannot be read as written is refused
    /// even where the cache it sits in is a media root.
    #[test]
    fn refuses_a_list_that_cannot_be_read_even_inside_a_root() {
        let folder = crate::joined_input::test_folder();
        let list = folder.join("unreadable-root.ffconcat");

        std::fs::create_dir_all(&folder).expect("makes the folder");
        std::fs::write(&list, "file '/x.mkv'\n").expect("writes the list");

        let reading = AppState {
            media_roots: vec![std::env::temp_dir()],
            ..writing_to(&[])
        };

        assert!(!reading.is_readable(&list));
    }

    /// Writing where an operator said Valence may write.
    #[test]
    fn writes_inside_a_root_it_was_given() {
        assert!(writing_to(&["/media"]).is_writable(Path::new("/media/Films/X/.valence/a.mkv")));
    }

    /// Reading a file somebody asked to watch and writing one over the top of it are not the same
    /// permission, so an unstated write list means nowhere rather than everywhere.
    #[test]
    fn writes_nowhere_when_nobody_said_where() {
        assert!(!writing_to(&[]).is_writable(Path::new("/media/Films/X/a.mkv")));
    }

    #[test]
    fn refuses_a_path_outside_every_root() {
        assert!(!writing_to(&["/media"]).is_writable(Path::new("/etc/passwd")));
    }

    /// A prefix test on a path holding `..` proves nothing about where the file lands, so such a
    /// path is refused outright rather than resolved.
    #[test]
    fn refuses_a_path_that_climbs_out_of_its_root() {
        assert!(!writing_to(&["/media"]).is_writable(Path::new("/media/../etc/passwd")));
    }

    /// A neighbouring directory whose name merely starts the same way is not inside the root.
    #[test]
    fn refuses_a_relative_path_that_could_mean_anywhere() {
        assert!(!writing_to(&["/media"]).is_writable(Path::new("media/Films/X/a.mkv")));
    }

    /// Every Windows path starts with a drive, which is a component of its own.
    #[cfg(windows)]
    #[test]
    fn writes_into_a_root_on_a_windows_drive() {
        assert!(
            writing_to(&[r"D:\Media"]).is_writable(Path::new(r"D:\Media\Films\X\.valence\a.mkv"))
        );
        assert!(!writing_to(&[r"D:\Media"]).is_writable(Path::new(r"D:\Media\..\Windows\a.mkv")));
        assert!(!writing_to(&[r"D:\Media"]).is_writable(Path::new(r"C:\Media\a.mkv")));
    }

    #[test]
    fn reads_a_range_from_the_start() {
        assert_eq!(
            parse_range("bytes=0-99", 1000),
            Some(super::ByteRange { start: 0, end: 99 })
        );
    }

    #[test]
    fn reads_an_open_ended_range() {
        assert_eq!(
            parse_range("bytes=500-", 1000),
            Some(super::ByteRange {
                start: 500,
                end: 999
            })
        );
    }

    #[test]
    fn reads_a_suffix_range() {
        assert_eq!(
            parse_range("bytes=-100", 1000),
            Some(super::ByteRange {
                start: 900,
                end: 999
            })
        );
    }

    #[test]
    fn clamps_a_range_that_runs_past_the_end() {
        assert_eq!(
            parse_range("bytes=900-5000", 1000),
            Some(super::ByteRange {
                start: 900,
                end: 999
            })
        );
    }

    #[test]
    fn rejects_a_range_starting_past_the_end() {
        assert_eq!(parse_range("bytes=2000-", 1000), None);
    }

    #[test]
    fn rejects_a_backwards_range() {
        assert_eq!(parse_range("bytes=500-100", 1000), None);
    }

    #[test]
    fn ignores_multi_range_requests_rather_than_answering_them_badly() {
        assert_eq!(parse_range("bytes=0-99,200-299", 1000), None);
    }

    #[test]
    fn rejects_nonsense() {
        assert_eq!(parse_range("pages=1-2", 1000), None);
        assert_eq!(parse_range("bytes=", 1000), None);
        assert_eq!(parse_range("bytes=-", 1000), None);
    }

    #[test]
    fn accepts_ordinary_segment_names() {
        assert!(is_safe_segment_name("segment00001.m4s"));
        assert!(is_safe_segment_name("index.m3u8"));
        assert!(is_safe_segment_name("init.mp4"));
    }

    #[test]
    fn rejects_parent_traversal() {
        assert!(!is_safe_segment_name("../secrets"));
        assert!(!is_safe_segment_name("../../etc/passwd"));
    }

    #[test]
    fn rejects_nested_paths() {
        assert!(!is_safe_segment_name("nested/segment.m4s"));
    }

    #[test]
    fn rejects_absolute_paths() {
        assert!(!is_safe_segment_name("/etc/passwd"));
    }

    #[test]
    fn rejects_empty_and_overlong_names() {
        assert!(!is_safe_segment_name(""));
        assert!(!is_safe_segment_name(&"a".repeat(200)));
    }

    #[test]
    fn serves_playlists_and_segments_with_useful_types() {
        assert_eq!(
            content_type_for("index.m3u8"),
            "application/vnd.apple.mpegurl"
        );
        assert_eq!(content_type_for("segment1.m4s"), "video/mp4");
        assert_eq!(content_type_for("init.mp4"), "video/mp4");
        assert_eq!(content_type_for("notes.txt"), "application/octet-stream");
    }

    #[test]
    fn serves_music_with_the_type_a_browser_will_play() {
        for (name, expected) in [
            ("01 Hunter.mp3", "audio/mpeg"),
            ("01 Hunter.flac", "audio/flac"),
            ("01 Hunter.FLAC", "audio/flac"),
            ("01 Hunter.m4a", "audio/mp4"),
            ("01 Hunter.alac", "audio/mp4"),
            ("01 Hunter.aac", "audio/aac"),
            ("01 Hunter.ogg", "audio/ogg"),
            ("01 Hunter.oga", "audio/ogg"),
            ("01 Hunter.opus", "audio/ogg"),
            ("01 Hunter.wav", "audio/wav"),
            ("01 Hunter.wma", "audio/x-ms-wma"),
            ("01 Hunter.aiff", "audio/aiff"),
            ("01 Hunter.aif", "audio/aiff"),
            ("01 Hunter.ape", "audio/x-ape"),
            ("01 Hunter.wv", "audio/x-wavpack"),
            ("01 Hunter.dsf", "application/octet-stream"),
        ] {
            assert_eq!(content_type_for(name), expected, "{name}");
        }
    }

    #[tokio::test]
    async fn claims_a_render_for_a_job_that_is_still_going() {
        let renders = RenderRegistry::new();

        let claimed = claim_for_a_live_job(&renders, "abc", Some("job-1")).await;

        assert!(matches!(claimed, Claimed::Taken(_)));
        assert!(
            matches!(
                claim_for_a_live_job(&renders, "abc", Some("job-1")).await,
                Claimed::UnderWay
            ),
            "a render already under way is not taken twice"
        );
    }

    /// The stop landed while the file was being probed, before the claim made
    /// a switch it could throw.
    #[tokio::test]
    async fn refuses_a_render_whose_job_was_stopped_before_it_was_claimed() {
        let renders = RenderRegistry::new();

        renders.stop_job("job-1").await;

        let refused = claim_for_a_live_job(&renders, "abc", Some("job-1")).await;

        assert!(matches!(refused, Claimed::JobStopped));
        assert!(
            !renders.is_claimed("abc").await,
            "the claim is let go, so nothing is left drawing it"
        );
    }

    #[tokio::test]
    async fn locate_names_the_files_of_a_segment_in_order() {
        use http_body_util::BodyExt as _;

        let names = vec![
            "segment_00004.m4s".to_owned(),
            "segment_00005.m4s".to_owned(),
        ];
        let directory = Path::new("/tmp/transcodes/abc");
        let response = locate(directory, &names);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let read: serde_json::Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(
            read["files"],
            serde_json::json!([
                directory.join("segment_00004.m4s").to_string_lossy(),
                directory.join("segment_00005.m4s").to_string_lossy()
            ])
        );
        assert_eq!(read["contentType"], "video/mp4");
    }

    #[test]
    fn locate_refuses_a_name_that_climbs_out_of_the_session() {
        let response = locate(Path::new("/tmp/transcodes/abc"), &["../secret".to_owned()]);

        assert_eq!(response.status(), axum::http::StatusCode::BAD_REQUEST);
    }

    #[test]
    fn a_session_file_address_asks_to_locate_with_true_and_not_otherwise() {
        use axum::extract::Query;

        let asked: axum::http::Uri = "/sessions/a/index.m3u8?locate=true".parse().unwrap();
        let plain: axum::http::Uri = "/sessions/a/index.m3u8".parse().unwrap();

        assert!(
            Query::<SessionFileQuery>::try_from_uri(&asked)
                .unwrap()
                .0
                .locate
        );
        assert!(
            !Query::<SessionFileQuery>::try_from_uri(&plain)
                .unwrap()
                .0
                .locate
        );

        let numbered: axum::http::Uri = "/sessions/a/index.m3u8?locate=1".parse().unwrap();

        assert!(Query::<SessionFileQuery>::try_from_uri(&numbered).is_err());
    }
}
