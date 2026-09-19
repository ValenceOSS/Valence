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
use crate::download::{self, DownloadFile, DownloadJob, DownloadRequest};
use crate::fingerprint::{fingerprint, FingerprintJob, FingerprintRequest};
use crate::frame::{take_frame, FrameRequest};
use crate::monitor::{Monitor, Report};
use crate::preview::{
    directory_for as preview_directory, is_complete as preview_ready, PreviewClip, PreviewJob,
    PreviewRegistry, PreviewRequest,
};
use crate::probe::probe_media;
use crate::progress_registry::ProgressRegistry;
use crate::queue::WorkQueue;
use crate::rendition::{self, RenditionJob, RenditionRequest};
use crate::session::{await_run, segment_number, Reuse, SessionRegistry};
use crate::subtitle::{extract_subtitle, SubtitleRequest};
use crate::transcode_plan::HardwareAccel;
use crate::transcode_plan::{DeviceFilters, SegmentStart, TranscodePlan};
use crate::transcode_plan::{SessionSpec, MANIFEST_NAME};
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
    #[must_use]
    pub fn is_readable(&self, path: &Path) -> bool {
        if self.media_roots.is_empty() {
            return true;
        }

        self.media_roots.iter().any(|root| path.starts_with(root))
    }

    /// Whether a path lies inside a configured write root.
    ///
    /// Fails shut where `is_readable` fails open, and the difference is the point. An empty read
    /// list means an installation that never restricted reading; an empty write list means one that
    /// never asked for anything to be written, and writing into a library on the strength of a
    /// request arriving is exactly what must not happen.
    ///
    /// A parent component anywhere in the path is refused outright rather than resolved, because a
    /// prefix test on a path holding `..` proves nothing about where the file lands.
    #[must_use]
    pub fn is_writable(&self, path: &Path) -> bool {
        if path
            .components()
            .any(|component| !matches!(component, Component::Normal(_) | Component::RootDir))
        {
            return false;
        }

        self.write_roots.iter().any(|root| path.starts_with(root))
    }
}

#[derive(Debug, Deserialize)]
pub struct ProbeRequest {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct FileQuery {
    pub path: String,
}

/// Which track to play, and at which of the offered bitrates.
///
/// The bitrate arrives as text so that a number nobody offers is answered the
/// same way as a word: with the service's own error rather than the extractor's.
#[derive(Debug, Deserialize)]
pub struct AudioQuery {
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
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
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
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
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

/// A request to start a session, and who is asking.
///
/// The device is carried beside the spec rather than inside it because it must
/// not change the session's address: two devices asking for the same transcode
/// should share one directory and one encode. What the device decides is not
/// which transcode is made, but which one is worth keeping afterwards.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartSessionRequest {
    #[serde(flatten)]
    spec: SessionSpec,
    #[serde(default)]
    device_id: Option<String>,
}

async fn start_session(
    State(state): State<AppState>,
    Json(request): Json<StartSessionRequest>,
) -> Response {
    let StartSessionRequest { spec, device_id } = request;

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

        return error(StatusCode::NOT_FOUND, "No such input file.");
    }

    let started = match state.registry.start(spec, device_id.as_deref()).await {
        Ok(started) => started,
        Err(failure) => {
            tracing::error!(target: "session", %failure, "refused");

            return error(StatusCode::INTERNAL_SERVER_ERROR, &failure.to_string());
        }
    };

    let id = started.id;

    let Some(directory) = state.registry.touch(&id).await else {
        return error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "The session disappeared.",
        );
    };

    let manifest_timeout = state.registry.config().manifest_timeout;

    if !await_run(&directory, manifest_timeout).await {
        tracing::error!(
            target: "session",
            session_id = %id,
            "produced no manifest within {}s; see the ffmpeg output above",
            manifest_timeout.as_secs()
        );

        state.registry.stop(&id, device_id.as_deref()).await;

        return error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ffmpeg produced no manifest.",
        );
    }

    (
        StatusCode::OK,
        Json(SessionResponse {
            manifest: format!("/sessions/{id}/{MANIFEST_NAME}"),
            id,
            encodes_video: started.encodes_video,
            reuse: started.reuse,
        }),
    )
        .into_response()
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
    headers: HeaderMap,
) -> Response {
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

        return match names.as_slice() {
            [only] => serve_file(&directory, only, requested_range(&headers)).await,
            several => serve_group(&directory, several).await,
        };
    }

    serve_file(&directory, &name, requested_range(&headers)).await
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
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
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
    let bit_depth = video.bit_depth;
    let size = Some((video.width, video.height));
    let capabilities = detect_capabilities(&config.ffmpeg, &config.device).await;
    let duration = probe.duration_seconds;

    if !request.wait {
        if state.previews.claim(&id).await {
            cut_in_the_background(
                &state,
                &request,
                &path,
                crate::preview::Source {
                    range,
                    bit_depth,
                    size,
                },
                &capabilities,
                duration,
                id.clone(),
            );
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
                    bit_depth,
                    size,
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
#[derive(Debug, Deserialize)]
struct SweepRequest<T> {
    keep: Vec<T>,
}

/// Removes preview clips nothing addresses any more.
async fn sweep_previews(
    State(state): State<AppState>,
    Json(request): Json<SweepRequest<PreviewRequest>>,
) -> Response {
    let keep: HashSet<String> = request.keep.iter().map(PreviewRequest::id).collect();
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
    Json(request): Json<SweepRequest<TrickplayRequest>>,
) -> Response {
    let keep: HashSet<String> = request.keep.iter().map(TrickplayRequest::id).collect();
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
    let forgotten = cache_sweep::forget(&root, &request.id()).await;

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
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
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
            }),
        )
            .into_response();
    }

    if let Some((progress, rate)) = state.downloads.progress(&id).await {
        return (
            StatusCode::ACCEPTED,
            Json(download::pending(id, progress, rate)),
        )
            .into_response();
    }

    if !state.downloads.claim(&id).await {
        return (StatusCode::ACCEPTED, Json(download::pending(id, 0, None))).into_response();
    }

    prepare_in_the_background(&state, &request, &path, id.clone());

    (StatusCode::ACCEPTED, Json(download::pending(id, 0, None))).into_response()
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
    let forgotten = cache_sweep::forget(&root, &request.id).await;

    (StatusCode::OK, Json(ForgetReport { forgotten })).into_response()
}

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
    let forgotten = cache_sweep::forget(&root, &request.id()).await;

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
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
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

/// Reads one subtitle track out of a container.
///
/// Answers with the whole track rather than a path, because a subtitle file is
/// a few tens of kilobytes and the player wants all of it before the first cue
/// is due.
async fn start_subtitle(
    State(state): State<AppState>,
    Json(request): Json<SubtitleRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
    }

    match extract_subtitle(&state.registry.config().ffmpeg, &path, request.stream_index).await {
        Ok(track) => (StatusCode::OK, Json(track)).into_response(),
        Err(failure) => error(StatusCode::BAD_REQUEST, &failure.to_string()),
    }
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
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
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
    claimed: String,
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

    let id = claimed.clone();

    tokio::spawn(async move {
        let outcome = queue
            .run(
                PreviewJob::new(subject),
                correlation_id.as_deref(),
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

        if let Err(failure) = outcome {
            previews.remember_failure(&id, failure.to_string()).await;
        }

        previews.give_up(&claimed).await;
    });
}

fn draw_in_the_background(
    state: &AppState,
    request: &TrickplayRequest,
    path: &Path,
    source: SheetSource,
    on_device: (Option<HardwareAccel>, Capabilities),
    claimed: String,
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

    let id = claimed.clone();

    tokio::spawn(async move {
        let outcome = queue
            .run(
                TrickplayJob::new(subject),
                correlation_id.as_deref(),
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

        if let Err(failure) = outcome {
            trickplay.remember_failure(&id, failure.to_string()).await;
        }

        trickplay.give_up(&claimed).await;
    });
}

async fn start_trickplay(
    State(state): State<AppState>,
    Json(request): Json<TrickplayRequest>,
) -> Response {
    let path = PathBuf::from(&request.input_path);

    if !state.is_readable(&path) {
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
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
    let accel = capabilities
        .encoder_for("h264", request.hardware_accel)
        .map(|found| found.accel)
        .filter(|found| {
            crate::chains::runs_here(
                &capabilities.chains,
                *found,
                crate::chains::ChainShape::Sheet,
                video.bit_depth,
            )
        });

    let source = SheetSource {
        width: video.width,
        height: video.height,
        range: video.range,
        frames_per_second: video.frame_rate,
        bit_depth: video.bit_depth,
        duration_seconds: probe.duration_seconds,
    };

    if !request.wait {
        let id = request.id();

        if let Some(failure) = state.trickplay.take_failure(&id).await {
            return error(StatusCode::INTERNAL_SERVER_ERROR, &failure);
        }

        if !is_complete(&config.artefact_root, &id).await {
            let tile_height = tile_height_for(request.tile_width, video.width, video.height);
            let pending = pending_index(&request, tile_height);

            if !state.trickplay.claim(&id).await {
                return (StatusCode::ACCEPTED, Json(pending)).into_response();
            }

            draw_in_the_background(
                &state,
                &request,
                &path,
                source,
                (accel, capabilities.clone()),
                id,
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
        return error(
            StatusCode::FORBIDDEN,
            "That file is outside the media roots.",
        );
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
    if state.registry.stop(&id, query.device_id.as_deref()).await {
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
    if state.registry.heartbeat(&id, request.is_playing).await {
        return (StatusCode::NO_CONTENT, Body::empty()).into_response();
    }

    error(StatusCode::NOT_FOUND, "No such session.")
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

/// Builds the media service routes.
///
/// Returned as a router rather than a bound server so the whole surface can be
/// exercised in tests without a socket.
pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/monitor", get(monitor))
        .route("/monitor/stream", get(monitor_stream))
        .route("/cache/measure", post(measure_cache))
        .route("/capabilities", get(capabilities))
        .route("/probe", post(probe))
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
        .route("/frame", post(start_frame))
        .route("/previews", post(start_preview))
        .route("/previews/sweep", post(sweep_previews))
        .route("/previews/forget", post(forget_preview))
        .route("/previews/{id}/{name}", get(preview_file))
        .route("/subtitles", post(start_subtitle))
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
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::{content_type_for, is_safe_segment_name, parse_range, AppState};
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
                max_concurrent: 2,
            }),
            ffprobe: "ffprobe".to_owned(),
            downloads: crate::progress_registry::ProgressRegistry::new(),
            renditions: crate::progress_registry::ProgressRegistry::new(),
            trickplay: crate::trickplay::TrickplayRegistry::new(),
            previews: crate::preview::PreviewRegistry::new(),
            monitor: crate::monitor::Monitor::new(crate::monitor::Journal::new()),
            audio: crate::audio::AudioRegistry::new(),
            queue: crate::queue::WorkQueue::new(1),
            media_roots: Vec::new(),
            write_roots: roots.iter().map(PathBuf::from).collect(),
        }
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
}
