//! How long a viewer waits for a film whose keyframes are slow to read.
//!
//! Reading a copied source's keyframes is the slowest step in starting it, and
//! on a large remux or a network share it can take far longer than anybody will
//! sit through. A session gives up on it after a deadline, starts the film as an
//! encode, and leaves the read to finish in the background so the next start
//! can copy. Only a session started for real against an ffprobe that is really
//! slow can show both halves of that.
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
const KEYFRAMES_TAKE: Duration = Duration::from_secs(6);

/// How long a session waits for them before starting as an encode.
const DEADLINE: Duration = Duration::from_secs(1);

/// How long a start may take on top of the deadline: probing the source,
/// writing the playlist and spawning ffmpeg, on a busy CI runner.
const STARTING_TAKES: Duration = Duration::from_secs(3);

/// How long the background read is given to finish before the test gives up.
const INDEX_PATIENCE: Duration = Duration::from_secs(30);

/// A source with a keyframe every second, so a copy of it can be cut anywhere.
fn copyable_source() -> PathBuf {
    generate(
        "slow-keyframes-source.mp4",
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
async fn app(name: &str) -> axum::Router {
    valence_transcoder::capability::detect_capabilities(
        &ffmpeg(),
        valence_transcoder::transcode_plan::DEFAULT_DEVICE,
    )
    .await;

    let root = common::scratch(format!("valence-test-slow-keyframes-{name}"));

    std::fs::remove_dir_all(&root).ok();

    let slow = slow_ffprobe(&root.join("bin"));
    let registry = SessionRegistry::new(SessionConfig {
        device: valence_transcoder::transcode_plan::DEFAULT_DEVICE.to_owned(),
        ffmpeg: ffmpeg(),
        ffprobe: slow.clone(),
        cache_root: root.join("cache"),
        artefact_root: root.join("artefacts"),
        idle_timeout: Duration::from_secs(60),
        manifest_timeout: Duration::from_secs(120),
        keyframe_deadline: DEADLINE,
        max_concurrent: 2,
        split_audio: false,
    });

    create_router(AppState {
        registry,
        ffprobe: slow,
        downloads: valence_transcoder::progress_registry::ProgressRegistry::new(),
        trickplay: valence_transcoder::trickplay::TrickplayRegistry::default(),
        subtitles: valence_transcoder::subtitle::SubtitleRegistry::default(),
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

#[tokio::test]
async fn starts_a_film_without_waiting_for_its_keyframes() {
    require_ffmpeg();

    let source = copyable_source();
    let app = app("first").await;
    let (body, waited) = start(&app, &copy_spec(&source)).await;

    assert!(
        waited < DEADLINE + STARTING_TAKES,
        "the viewer waited {waited:?} for a film whose keyframes take {KEYFRAMES_TAKE:?} to \
         read, when the deadline is {DEADLINE:?}"
    );
    assert!(
        encodes_video(&body),
        "without its keyframes in time, a copy cannot be cut safely and the film is encoded"
    );

    stop(&app, &body).await;
}

#[tokio::test]
async fn copies_the_film_once_its_keyframes_have_been_read_in_the_background() {
    require_ffmpeg();

    let source = copyable_source();
    let spec = copy_spec(&source);
    let app = app("later").await;
    let (first, _) = start(&app, &spec).await;

    assert!(
        encodes_video(&first),
        "the first start does not wait for the keyframes"
    );

    stop(&app, &first).await;

    let gave_up_at = Instant::now() + INDEX_PATIENCE;

    loop {
        tokio::time::sleep(Duration::from_millis(500)).await;

        let (body, waited) = start(&app, &spec).await;
        let copies = !encodes_video(&body);

        stop(&app, &body).await;

        if copies {
            assert!(
                waited < DEADLINE + STARTING_TAKES,
                "a start answered from the kept keyframes waited {waited:?}"
            );
            break;
        }

        assert!(
            Instant::now() < gave_up_at,
            "the film was still encoded {INDEX_PATIENCE:?} after its keyframes began being read, \
             so the stopgap was never replaced"
        );
    }
}
