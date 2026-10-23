//! A session picked up again after the service restarts, against real media.
//!
//! A restart forgets every session while the players watching them carry on
//! asking for segments by the same address. What started each session is kept
//! beside its segments, so the first of those asks starts it again, and only a
//! service started twice over one cache can show that it does.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::path::PathBuf;
use std::time::Duration;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;

use valence_transcoder::monitor::{Journal, Monitor};
use valence_transcoder::preview::PreviewRegistry;
use valence_transcoder::queue::WorkQueue;
use valence_transcoder::router::{create_router, AppState, START_REQUEST_NAME};
use valence_transcoder::session::{SessionConfig, SessionRegistry};
use valence_transcoder::transcode_plan::{
    AudioAction, HardwareAccel, SegmentContainer, SessionSpec, SubtitleAction, Track, VideoAction,
};

mod common;

use common::{ffmpeg, ffprobe, generate, require_ffmpeg};

/// A file long enough that a run over it is still going when the test looks.
///
/// The short fixture cannot show a shared transcode: ffmpeg finishes it before
/// a second viewer can arrive, so the second one finds a finished film rather
/// than a run to join, and the case never happens.
fn long_source() -> PathBuf {
    generate(
        "revival-source-long.mp4",
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
            "300",
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

fn cache_root(name: &str) -> PathBuf {
    common::scratch(format!("valence-test-revival-{name}"))
}

/// The service as it is after starting, holding nothing, over a cache another
/// run of it may have written.
fn registry(name: &str) -> SessionRegistry {
    SessionRegistry::new(SessionConfig {
        device: valence_transcoder::transcode_plan::DEFAULT_DEVICE.to_owned(),
        ffmpeg: ffmpeg(),
        ffprobe: ffprobe(),
        cache_root: cache_root(name),
        artefact_root: cache_root(name),
        idle_timeout: Duration::from_secs(60),
        manifest_timeout: Duration::from_secs(120),
        keyframe_deadline: valence_transcoder::boundaries::DEFAULT_KEYFRAME_DEADLINE,
        split_audio: false,
    })
}

fn app(registry: SessionRegistry) -> axum::Router {
    create_router(AppState {
        registry,
        ffprobe: ffprobe(),
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

fn spec(input: &std::path::Path) -> SessionSpec {
    SessionSpec {
        input_path: input.to_string_lossy().into_owned(),
        start_seconds: 0,
        segment_seconds: 2,
        hardware_accel: HardwareAccel::None,
        video: VideoAction::Encode {
            encoder: "libx264".to_owned(),
            max_bitrate_kbps: 1_000,
            max_width: 320,
            max_height: 180,
            tone_map: None,
            deinterlace: false,
            square_pixels: false,
        },
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

fn request(method: &str, uri: &str, body: Body) -> Request<Body> {
    Request::builder()
        .method(method)
        .uri(uri)
        .header("content-type", "application/json")
        .body(body)
        .expect("builds the request")
}

/// Starts a session on one run of the service, and stops that run as a restart would.
async fn started_then_restarted(name: &str) -> (String, PathBuf) {
    std::fs::remove_dir_all(cache_root(name)).ok();

    let before = registry(name);
    let first = app(before.clone());
    let (status, body) = call(
        &first,
        request(
            "POST",
            "/sessions",
            Body::from(serde_json::to_string(&spec(&long_source())).expect("serialises")),
        ),
    )
    .await;

    assert_eq!(status, StatusCode::OK, "the session did not start: {body}");

    before.stop_all().await;

    let id = body["id"].as_str().expect("a session has an id").to_owned();

    (id.clone(), cache_root(name).join(id))
}

#[tokio::test(flavor = "multi_thread")]
async fn serves_a_segment_of_a_session_started_before_a_restart() {
    require_ffmpeg();

    let (id, directory) = started_then_restarted("segment").await;

    assert!(directory.join(START_REQUEST_NAME).exists());

    let after = registry("segment");
    let app = app(after.clone());

    let manifest = app
        .clone()
        .oneshot(request(
            "GET",
            &format!("/sessions/{id}/index.m3u8"),
            Body::empty(),
        ))
        .await
        .expect("handles the request")
        .into_body()
        .collect()
        .await
        .expect("reads the body")
        .to_bytes();
    let far = String::from_utf8_lossy(&manifest)
        .lines()
        .filter(|line| !line.starts_with('#') && !line.is_empty())
        .nth(100)
        .expect("the film is long enough to have a hundred segments")
        .to_owned();

    assert!(!directory.join(&far).exists());

    let (status, _) = call(
        &app,
        request("GET", &format!("/sessions/{id}/{far}"), Body::empty()),
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert!(after.holds(&id).await);

    after.stop_all().await;
}

#[tokio::test(flavor = "multi_thread")]
async fn answers_the_heartbeat_of_a_session_started_before_a_restart() {
    require_ffmpeg();

    let (id, _) = started_then_restarted("heartbeat").await;

    let after = registry("heartbeat");
    let app = app(after.clone());

    let (status, _) = call(
        &app,
        request(
            "POST",
            &format!("/sessions/{id}/heartbeat"),
            Body::from(r#"{"isPlaying":true}"#),
        ),
    )
    .await;

    assert_eq!(status, StatusCode::NO_CONTENT);

    after.stop_all().await;
}

#[tokio::test(flavor = "multi_thread")]
async fn does_not_start_again_a_session_a_player_stopped() {
    require_ffmpeg();

    let (id, directory) = started_then_restarted("stopped").await;

    let after = registry("stopped");
    let app = app(after.clone());

    call(
        &app,
        request("GET", &format!("/sessions/{id}/index.m3u8"), Body::empty()),
    )
    .await;

    let (stopped, _) = call(
        &app,
        request("DELETE", &format!("/sessions/{id}"), Body::empty()),
    )
    .await;

    assert_eq!(stopped, StatusCode::NO_CONTENT);
    assert!(!directory.join(START_REQUEST_NAME).exists());

    let (status, _) = call(
        &app,
        request("GET", &format!("/sessions/{id}/index.m3u8"), Body::empty()),
    )
    .await;

    assert_eq!(status, StatusCode::NOT_FOUND);
    assert!(!after.holds(&id).await);
}

#[tokio::test(flavor = "multi_thread")]
async fn looks_for_nothing_outside_the_cache() {
    let app = app(registry("outside"));

    let (status, _) = call(
        &app,
        request(
            "POST",
            "/sessions/..%2F..%2Fetc/heartbeat",
            Body::from(r#"{"isPlaying":true}"#),
        ),
    )
    .await;

    assert_eq!(status, StatusCode::NOT_FOUND);
}
