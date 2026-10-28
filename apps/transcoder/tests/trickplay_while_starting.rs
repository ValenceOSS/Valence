//! Thumbnails held off while somebody's film is starting.
//!
//! A player asks for a film's scrubbing thumbnails as it opens, at the same
//! moment it asks for the film, and a render started then reads the whole file
//! while the first segment is still being made from it. The player's ask is
//! answered "not yet" for the first moments of a play and asked again later;
//! a library job's ask, which nobody is waiting on, is never held off.
//!
//! The counting ffmpeg is a shell script, so this runs where a shell does and
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
use valence_transcoder::trickplay::TrickplayRegistry;

mod common;

use common::{ffmpeg, ffprobe, generate, require_ffmpeg};

fn source_file() -> PathBuf {
    generate(
        "trickplay-while-starting.mp4",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=25",
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
        ],
    )
}

/// An ffmpeg that notes every thumbnail render it is asked for and runs the real one.
fn counting_ffmpeg(directory: &Path) -> (String, PathBuf) {
    std::fs::create_dir_all(directory).expect("creates the directory");

    let tally = directory.join("runs");
    let script = directory.join("ffmpeg-counting");

    std::fs::write(
        &script,
        format!(
            "#!/bin/sh\ncase \" $* \" in *sheet-%03d.jpg*) echo run >> {tally} ;; esac\nexec {real} \"$@\"\n",
            tally = tally.display(),
            real = ffmpeg(),
        ),
    )
    .expect("writes the wrapper");
    std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755))
        .expect("makes the wrapper executable");

    (script.to_string_lossy().into_owned(), tally)
}

fn renders_started(tally: &Path) -> usize {
    std::fs::read_to_string(tally)
        .map(|text| text.lines().count())
        .unwrap_or_default()
}

fn app(name: &str) -> (axum::Router, PathBuf) {
    let root = common::scratch(format!("valence-test-trickplay-starting-{name}"));
    let _ = std::fs::remove_dir_all(&root);
    let (counting, tally) = counting_ffmpeg(&root.join("bin"));

    let router = create_router(AppState {
        registry: SessionRegistry::new(SessionConfig {
            device: valence_transcoder::transcode_plan::DEFAULT_DEVICE.to_owned(),
            ffmpeg: counting,
            ffprobe: ffprobe(),
            cache_root: root.join("cache"),
            artefact_root: root.join("artefacts"),
            idle_timeout: Duration::from_secs(60),
            manifest_timeout: Duration::from_secs(120),
            keyframe_deadline: valence_transcoder::boundaries::DEFAULT_KEYFRAME_DEADLINE,
            split_audio: false,
        }),
        ffprobe: ffprobe(),
        downloads: valence_transcoder::progress_registry::ProgressRegistry::new(),
        trickplay: TrickplayRegistry::default(),
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
    });

    (router, tally)
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

fn post(uri: &str, body: &serde_json::Value) -> Request<Body> {
    Request::builder()
        .method("POST")
        .uri(uri)
        .header("content-type", "application/json")
        .body(Body::from(body.to_string()))
        .expect("builds the request")
}

async fn press_play(app: &axum::Router, input: &Path) {
    let spec = SessionSpec {
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
    };
    let (status, body) = call(
        app,
        post("/sessions", &serde_json::to_value(&spec).unwrap()),
    )
    .await;

    assert_eq!(status, StatusCode::OK, "the session did not start: {body}");
}

fn thumbnails(input: &Path, correlation_id: Option<&str>) -> serde_json::Value {
    let mut body = serde_json::json!({
        "inputPath": input.to_string_lossy(),
        "generation": 0,
        "intervalSeconds": 4,
        "tileWidth": 160,
        "columns": 2,
        "rows": 2,
        "wait": false,
    });

    if let Some(id) = correlation_id {
        body["correlationId"] = serde_json::json!(id);
    }

    body
}

async fn renders_within(tally: &Path, patience: Duration) -> usize {
    let gave_up_at = Instant::now() + patience;

    while renders_started(tally) == 0 && Instant::now() < gave_up_at {
        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    renders_started(tally)
}

#[tokio::test]
async fn answers_a_player_not_yet_while_its_film_is_starting() {
    require_ffmpeg();

    let source = source_file();
    let (app, tally) = app("player");

    press_play(&app, &source).await;

    let (status, _) = call(&app, post("/trickplay", &thumbnails(&source, None))).await;

    assert_eq!(status, StatusCode::ACCEPTED);
    assert_eq!(
        renders_within(&tally, Duration::from_secs(3)).await,
        0,
        "a render started while the film was starting"
    );
}

#[tokio::test]
async fn never_holds_off_a_library_job() {
    require_ffmpeg();

    let source = source_file();
    let (app, tally) = app("job");

    press_play(&app, &source).await;

    let (status, _) = call(
        &app,
        post("/trickplay", &thumbnails(&source, Some("job-1"))),
    )
    .await;

    assert_eq!(status, StatusCode::ACCEPTED);
    assert_eq!(renders_within(&tally, Duration::from_secs(20)).await, 1);
}

#[tokio::test]
async fn renders_for_a_player_when_nothing_is_starting() {
    require_ffmpeg();

    let source = source_file();
    let (app, tally) = app("idle");
    let (status, _) = call(&app, post("/trickplay", &thumbnails(&source, None))).await;

    assert_eq!(status, StatusCode::ACCEPTED);
    assert_eq!(renders_within(&tally, Duration::from_secs(20)).await, 1);
}
