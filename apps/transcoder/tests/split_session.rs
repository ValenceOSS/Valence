//! A session sent as its picture and its sound apart, end to end.
//!
//! Runs `FFmpeg` for real and reads what a player would: the playlist tying the
//! halves together, each half's playlist, and the segments they name. See
//! VAL-307.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;

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

/// Eight seconds of picture and sound, with the priming AAC puts before nought.
fn source() -> PathBuf {
    generate(
        "split-source.mp4",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=640x360:rate=25",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440",
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-t",
            "8",
            "-c:v",
            "libx264",
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
    std::env::temp_dir().join(format!("valence-test-split-{name}"))
}

fn registry(name: &str, split_audio: bool) -> SessionRegistry {
    std::fs::remove_dir_all(cache_root(name)).ok();

    SessionRegistry::new(SessionConfig {
        device: valence_transcoder::transcode_plan::DEFAULT_DEVICE.to_owned(),
        ffmpeg: ffmpeg(),
        ffprobe: ffprobe(),
        cache_root: cache_root(name),
        artefact_root: cache_root(name),
        idle_timeout: Duration::from_secs(60),
        manifest_timeout: Duration::from_secs(120),
        max_concurrent: 2,
        split_audio,
    })
}

fn app(registry: SessionRegistry) -> axum::Router {
    create_router(AppState {
        registry,
        ffprobe: ffprobe(),
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

fn spec() -> SessionSpec {
    SessionSpec {
        input_path: source().to_string_lossy().into_owned(),
        start_seconds: 0,
        segment_seconds: 2,
        hardware_accel: HardwareAccel::None,
        video: VideoAction::Copy,
        audio: AudioAction::Copy,
        audio_stream_index: None,
        subtitles: SubtitleAction::None,
        source_size: None,
        container: SegmentContainer::Fmp4,
        source_video_codec: Some("h264".into()),
        track: Track::Both,
        source_range: None,
        source_range_base: None,
    }
}

async fn call(app: &axum::Router, request: Request<Body>) -> (StatusCode, Vec<u8>) {
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

    (status, bytes.to_vec())
}

async fn start(app: &axum::Router) -> String {
    let (status, bytes) = call(
        app,
        Request::builder()
            .method("POST")
            .uri("/sessions")
            .header("content-type", "application/json")
            .body(Body::from(
                serde_json::to_string(&spec()).expect("serialises"),
            ))
            .expect("builds the request"),
    )
    .await;

    let body: serde_json::Value = serde_json::from_slice(&bytes).unwrap_or_default();

    assert_eq!(status, StatusCode::OK, "the session did not start: {body}");

    body["id"].as_str().expect("has an id").to_owned()
}

async fn fetch(app: &axum::Router, id: &str, name: &str) -> Vec<u8> {
    let (status, bytes) = call(
        app,
        Request::builder()
            .uri(format!("/sessions/{id}/{name}"))
            .body(Body::empty())
            .expect("builds the request"),
    )
    .await;

    assert_eq!(status, StatusCode::OK, "{name} was not served");

    bytes
}

async fn text(app: &axum::Router, id: &str, name: &str) -> String {
    String::from_utf8(fetch(app, id, name).await).expect("a playlist is text")
}

/// The kinds of stream in a segment, read by joining it to its initialisation.
async fn streams_in(app: &axum::Router, id: &str, init: &str, segment: &str) -> Vec<String> {
    let mut bytes = fetch(app, id, init).await;
    bytes.extend(fetch(app, id, segment).await);

    let path = std::env::temp_dir().join(format!("valence-split-{id}-{segment}.mp4"));
    std::fs::write(&path, bytes).expect("writes the joined segment");

    let output = Command::new(ffprobe())
        .args([
            "-v",
            "error",
            "-show_entries",
            "stream=codec_type",
            "-of",
            "csv=p=0",
        ])
        .arg(&path)
        .output()
        .expect("runs ffprobe");

    String::from_utf8_lossy(&output.stdout)
        .lines()
        .map(str::to_owned)
        .collect()
}

/// Where the first fragment of a segment says it begins, as stored.
fn first_decode_time(segment: &[u8]) -> u64 {
    let at = segment
        .windows(4)
        .position(|window| window == b"tfdt")
        .expect("a fragment says where it begins");
    let rest = &segment[at + 4..];

    if rest[0] == 1 {
        u64::from_be_bytes(rest[4..12].try_into().unwrap())
    } else {
        u64::from(u32::from_be_bytes(rest[4..8].try_into().unwrap()))
    }
}

#[tokio::test(flavor = "multi_thread")]
async fn ties_the_picture_to_its_sound() {
    require_ffmpeg();

    let app = app(registry("ties", true));
    let id = start(&app).await;

    let multivariant = text(&app, &id, "index.m3u8").await;

    assert!(
        multivariant.contains("#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID=\"audio\""),
        "{multivariant}"
    );
    assert!(
        multivariant.contains("CODECS=\"avc1.") && multivariant.contains(",mp4a.40.2\""),
        "{multivariant}"
    );
    assert!(
        multivariant.contains("URI=\"audio.m3u8\""),
        "{multivariant}"
    );
    assert!(multivariant.ends_with("video.m3u8\n"), "{multivariant}");

    let video = text(&app, &id, "video.m3u8").await;

    assert!(video.contains("#EXT-X-MAP:URI=\"init.mp4\""), "{video}");
    assert!(video.contains("segment00000.m4s"), "{video}");

    let audio = text(&app, &id, "audio.m3u8").await;

    assert!(
        audio.contains("#EXT-X-MAP:URI=\"init-audio.mp4\""),
        "{audio}"
    );
    assert!(
        audio.contains("#EXTINF:4.000000,\naudio00000.m4s"),
        "{audio}"
    );
    assert!(!audio.contains("segment"), "{audio}");

    let target = |playlist: &str| {
        playlist
            .lines()
            .find(|line| line.starts_with("#EXT-X-TARGETDURATION:"))
            .map(str::to_owned)
    };

    assert_eq!(
        target(&audio),
        target(&video),
        "both media playlists declare the same target"
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn carries_each_stream_in_its_own_half() {
    require_ffmpeg();

    let app = app(registry("halves", true));
    let id = start(&app).await;

    assert_eq!(
        streams_in(&app, &id, "init.mp4", "segment00000.m4s").await,
        ["video"]
    );
    assert_eq!(
        streams_in(&app, &id, "init-audio.mp4", "audio00000.m4s").await,
        ["audio"]
    );
}

/// AAC's priming sits before nought, and written as it is it becomes a start
/// time eighteen quintillion ticks in, which a browser refuses outright.
#[tokio::test(flavor = "multi_thread")]
async fn never_starts_the_sound_before_the_film() {
    require_ffmpeg();

    let app = app(registry("priming", true));
    let id = start(&app).await;

    let segment = fetch(&app, &id, "audio00000.m4s").await;

    assert!(
        first_decode_time(&segment) < u64::from(u32::MAX),
        "the sound begins at {}, which is a negative time stored unsigned",
        first_decode_time(&segment)
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn stops_both_halves_together() {
    require_ffmpeg();

    let registry = registry("stops", true);
    let app = app(registry.clone());
    let id = start(&app).await;

    assert_eq!(registry.len().await, 2, "the picture and the sound");

    let (status, _) = call(
        &app,
        Request::builder()
            .method("DELETE")
            .uri(format!("/sessions/{id}"))
            .body(Body::empty())
            .expect("builds the request"),
    )
    .await;

    assert_eq!(status, StatusCode::NO_CONTENT);
    assert_eq!(registry.len().await, 0, "neither half outlives the viewer");
}

/// An operator who turned splitting off gets one session carrying both.
#[tokio::test(flavor = "multi_thread")]
async fn keeps_the_session_whole_when_splitting_is_off() {
    require_ffmpeg();

    let registry = registry("whole", false);
    let app = app(registry.clone());
    let id = start(&app).await;

    let playlist = text(&app, &id, "index.m3u8").await;

    assert!(!playlist.contains("#EXT-X-MEDIA:"), "{playlist}");
    assert!(playlist.contains("segment00000.m4s"), "{playlist}");
    assert_eq!(registry.len().await, 1);
}
