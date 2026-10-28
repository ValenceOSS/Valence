//! Reading a film's keyframes before anybody plays it.
//!
//! A session that cannot read a film's keyframes in time encodes it rather than
//! copying it. Read ahead, they are kept where the session looks, so its first
//! play copies at once and is cut exactly where a session that read them itself
//! would cut it. The read never shares the disk with somebody watching: it is
//! refused while anybody is, and stopped if somebody starts.
//!
//! The slow ffprobe is a shell script that waits before reading packets and
//! passes everything else straight through, so this runs where a shell does and
//! not on Windows.

#![cfg(unix)]
#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;

use valence_transcoder::monitor::{Journal, Monitor};
use valence_transcoder::preview::PreviewRegistry;
use valence_transcoder::queue::WorkQueue;
use valence_transcoder::router::{create_router, AppState};
use valence_transcoder::session::{SessionConfig, SessionRegistry};
use valence_transcoder::transcode_plan::{
    AudioAction, HardwareAccel, SegmentContainer, SessionSpec, SubtitleAction, Track, VideoAction,
};

mod common;

use common::{ffmpeg, ffprobe, generate, require_ffmpeg};

/// How long the slow ffprobe takes to read a source's keyframes.
const KEYFRAMES_TAKE: Duration = Duration::from_secs(4);

/// How long a session waits for them before starting as an encode.
const DEADLINE: Duration = Duration::from_secs(1);

/// How long a start may take on top of the deadline: probing the source,
/// writing the playlist and spawning ffmpeg, on a busy CI runner.
const STARTING_TAKES: Duration = Duration::from_secs(3);

/// A source with a keyframe every second, so a copy of it can be cut anywhere.
fn copyable_source() -> PathBuf {
    generate(
        "keyframes-ahead-source.mkv",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=25",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440",
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-t",
            "12",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-pix_fmt",
            "yuv420p",
            "-g",
            "25",
            "-c:a",
            "aac",
            "-ac",
            "2",
        ],
    )
}

/// An ffprobe that takes [`KEYFRAMES_TAKE`] to read packets and answers
/// everything else at once, the way a large file on slow storage behaves.
fn slow_ffprobe(directory: &Path) -> String {
    std::fs::create_dir_all(directory).expect("makes the directory for the slow ffprobe");

    let path = directory.join("slow-ffprobe");
    let script = format!(
        "#!/bin/sh\ncase \"$*\" in\n  *packet=pts_time*) sleep {} ;;\nesac\nexec '{}' \"$@\"\n",
        KEYFRAMES_TAKE.as_secs(),
        ffprobe().replace('\'', r"'\''"),
    );

    std::fs::write(&path, script).expect("writes the slow ffprobe");
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755))
        .expect("makes the slow ffprobe runnable");

    path.to_string_lossy().into_owned()
}

/// A transcoder set up the way `serve` sets one up, over the slow ffprobe.
///
/// Serving waits for the encoders to be detected before it takes a request,
/// because detecting them cold takes seconds and the first film to fall back to
/// an encode would otherwise wait for it. Left out, that wait lands inside the
/// start being timed, and the test measures the cold detection instead.
async fn app(name: &str, slow: bool) -> axum::Router {
    valence_transcoder::capability::detect_capabilities(
        &ffmpeg(),
        valence_transcoder::transcode_plan::DEFAULT_DEVICE,
    )
    .await;

    let root = common::scratch(format!("valence-test-keyframes-ahead-{name}"));

    std::fs::remove_dir_all(&root).ok();

    let slow = if slow {
        slow_ffprobe(&root.join("bin"))
    } else {
        ffprobe()
    };
    let registry = SessionRegistry::new(SessionConfig {
        device: valence_transcoder::transcode_plan::DEFAULT_DEVICE.to_owned(),
        ffmpeg: ffmpeg(),
        ffprobe: slow.clone(),
        cache_root: root.join("cache"),
        artefact_root: root.join("artefacts"),
        idle_timeout: Duration::from_secs(60),
        manifest_timeout: Duration::from_secs(120),
        keyframe_deadline: DEADLINE,
        split_audio: false,
    });

    create_router(AppState {
        registry,
        ffprobe: slow,
        downloads: valence_transcoder::progress_registry::ProgressRegistry::new(),
        trickplay: valence_transcoder::trickplay::TrickplayRegistry::default(),
        subtitles: valence_transcoder::subtitle::SubtitleRegistry::default(),
        picture_subtitles: valence_transcoder::picture_subtitles::PictureSubtitleRegistry::default(
        ),
        generated_subtitles: valence_transcoder::whisper_subtitles::GeneratedSubtitleRegistry::new(
        ),
        previews: PreviewRegistry::default(),
        monitor: Monitor::new(Journal::new()),
        audio: valence_transcoder::audio::AudioRegistry::new(),
        queue: WorkQueue::new(1),
        renditions: valence_transcoder::progress_registry::ProgressRegistry::new(),
        write_roots: Vec::new(),
        media_roots: Vec::new(),
    })
}

/// A request to deliver the source's own video as it is.
fn copy_spec(input: &Path) -> SessionSpec {
    SessionSpec {
        input_path: input.to_string_lossy().into_owned(),
        start_seconds: 0,
        segment_seconds: 2,
        hardware_accel: HardwareAccel::None,
        video: VideoAction::Copy,
        audio: AudioAction::Copy,
        audio_stream_index: None,
        subtitles: SubtitleAction::None,
        source_size: None,
        container: SegmentContainer::Fmp4,
        source_video_codec: None,
        track: Track::Both,
        source_range: None,
        source_range_base: None,
    }
}

async fn call(app: &axum::Router, request: Request<Body>) -> (StatusCode, serde_json::Value) {
    let response = app
        .clone()
        .oneshot(request)
        .await
        .expect("handles the request");
    let status = response.status();
    let bytes = response
        .into_body()
        .collect()
        .await
        .expect("reads the body")
        .to_bytes();

    (
        status,
        serde_json::from_slice(&bytes).unwrap_or(serde_json::Value::Null),
    )
}

/// Starts a session, and says how long the viewer waited for it.
async fn start(app: &axum::Router, spec: &SessionSpec) -> (serde_json::Value, Duration) {
    let began = Instant::now();
    let (status, body) = call(
        app,
        Request::builder()
            .method("POST")
            .uri("/sessions")
            .header("content-type", "application/json")
            .body(Body::from(
                serde_json::to_string(spec).expect("serialises the spec"),
            ))
            .expect("builds the request"),
    )
    .await;

    assert_eq!(status, StatusCode::OK, "the session did not start: {body}");

    (body, began.elapsed())
}

async fn stop(app: &axum::Router, body: &serde_json::Value) {
    let id = body["id"].as_str().expect("a session has an id");
    let (status, _) = call(
        app,
        Request::builder()
            .method("DELETE")
            .uri(format!("/sessions/{id}"))
            .body(Body::empty())
            .expect("builds the request"),
    )
    .await;

    assert_eq!(status, StatusCode::NO_CONTENT);
}

fn encodes_video(body: &serde_json::Value) -> bool {
    body["encodesVideo"]
        .as_bool()
        .expect("a session says whether it encodes")
}

async fn read_ahead(app: &axum::Router, input: &Path) -> (StatusCode, serde_json::Value, Duration) {
    let began = Instant::now();
    let (status, body) = call(
        app,
        Request::builder()
            .method("POST")
            .uri("/keyframes")
            .header("content-type", "application/json")
            .body(Body::from(
                serde_json::json!({ "inputPath": input.to_string_lossy() }).to_string(),
            ))
            .expect("builds the request"),
    )
    .await;

    (status, body, began.elapsed())
}

async fn text_of(app: &axum::Router, uri: &str) -> String {
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(uri)
                .body(Body::empty())
                .expect("builds the request"),
        )
        .await
        .expect("handles the request");
    let bytes = response
        .into_body()
        .collect()
        .await
        .expect("reads the body")
        .to_bytes();

    String::from_utf8_lossy(&bytes).into_owned()
}

/// The segment lengths a session's media playlist promises, in order.
async fn promised_lengths(app: &axum::Router, body: &serde_json::Value) -> Vec<String> {
    let id = body["id"].as_str().expect("a session has an id");
    let mut playlist = text_of(
        app,
        body["manifest"].as_str().expect("a session has a manifest"),
    )
    .await;

    if let Some(media) = playlist
        .lines()
        .find(|line| {
            !line.starts_with('#')
                && Path::new(line)
                    .extension()
                    .is_some_and(|extension| extension.eq_ignore_ascii_case("m3u8"))
        })
        .map(str::to_owned)
    {
        let name = media.rsplit('/').next().unwrap_or(&media).to_owned();

        playlist = text_of(app, &format!("/sessions/{id}/{name}")).await;
    }

    playlist
        .lines()
        .filter(|line| line.starts_with("#EXTINF"))
        .map(str::to_owned)
        .collect()
}

fn state_of(body: &serde_json::Value) -> &str {
    body["state"].as_str().unwrap_or_default()
}

#[tokio::test]
async fn reads_a_films_keyframes_ahead_so_its_first_play_copies_at_once() {
    require_ffmpeg();

    let source = copyable_source();
    let ahead = app("first-play", true).await;
    let (status, body, _) = read_ahead(&ahead, &source).await;

    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(state_of(&body), "read");

    let (started, waited) = start(&ahead, &copy_spec(&source)).await;

    assert!(
        !encodes_video(&started),
        "a film whose keyframes were read ahead is copied on its first play"
    );
    assert!(
        waited < DEADLINE + STARTING_TAKES,
        "the first play waited {waited:?} with its keyframes already read"
    );

    let promised = promised_lengths(&ahead, &started).await;

    stop(&ahead, &started).await;

    let itself = app("reads-itself", false).await;
    let (own, _) = start(&itself, &copy_spec(&source)).await;

    assert!(
        !encodes_video(&own),
        "with a quick ffprobe the session reads them itself and copies"
    );

    let own_promised = promised_lengths(&itself, &own).await;

    stop(&itself, &own).await;

    assert!(!promised.is_empty(), "the playlist promises segments");
    assert_eq!(
        promised, own_promised,
        "read ahead, the film is cut exactly where a session reading the keyframes itself cuts it"
    );
}

#[tokio::test]
async fn answers_from_what_it_kept_without_reading_again() {
    require_ffmpeg();

    let source = copyable_source();
    let app = app("kept", true).await;
    let (_, first, _) = read_ahead(&app, &source).await;
    let (status, second, took) = read_ahead(&app, &source).await;

    assert_eq!(state_of(&first), "read");
    assert_eq!(status, StatusCode::OK);
    assert_eq!(state_of(&second), "kept");
    assert!(
        took < KEYFRAMES_TAKE,
        "the second ask read the packets again: {took:?}"
    );
}

#[tokio::test]
async fn reads_nothing_while_somebody_is_watching() {
    require_ffmpeg();

    let source = copyable_source();
    let app = app("watching", true).await;
    let (watching, _) = start(&app, &copy_spec(&source)).await;
    let (status, body, took) = read_ahead(&app, &source).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(state_of(&body), "later");
    assert!(
        took < KEYFRAMES_TAKE,
        "it waited {took:?} rather than answering at once"
    );

    stop(&app, &watching).await;
}

#[tokio::test]
async fn stops_reading_when_somebody_starts_watching() {
    require_ffmpeg();

    let source = copyable_source();
    let other = generate(
        "keyframes-ahead-other.mkv",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=25",
            "-t",
            "6",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-pix_fmt",
            "yuv420p",
            "-g",
            "25",
        ],
    );
    let app = app("interrupted", true).await;
    let reading = tokio::spawn({
        let app = app.clone();
        let source = source.clone();

        async move { read_ahead(&app, &source).await }
    });

    tokio::time::sleep(Duration::from_millis(500)).await;

    let (watching, _) = start(&app, &copy_spec(&other)).await;
    let (status, body, took) = reading.await.expect("the read finishes");

    stop(&app, &watching).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(state_of(&body), "later", "{body}");
    assert!(
        took < KEYFRAMES_TAKE,
        "the read carried on for {took:?} after somebody started watching"
    );

    let (_, again, _) = read_ahead(&app, &source).await;

    assert_eq!(
        state_of(&again),
        "read",
        "nothing half read was kept as if it were whole"
    );
}

#[tokio::test]
async fn leaves_alone_a_file_with_no_picture() {
    require_ffmpeg();

    let sound = generate(
        "keyframes-ahead-sound.mka",
        &[
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440",
            "-t",
            "3",
            "-c:a",
            "flac",
        ],
    );
    let app = app("sound", true).await;
    let (status, body, _) = read_ahead(&app, &sound).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(state_of(&body), "skipped");
}
