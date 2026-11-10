//! Reading what kind of picture a film's keyframes open on, from real files.
//!
//! The unit tests prove the elementary stream is read correctly. Only `FFmpeg`
//! proves that a copied packet comes out as that stream, with its parameter
//! sets in front, and that a seek past the end still lands on a keyframe other
//! than the opening one.

#![cfg(unix)]
#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::path::{Path, PathBuf};
use std::time::Duration;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;

use valence_transcoder::idr_keyframes::opens_only_on_idr;
use valence_transcoder::keyframes::{Cut, Keyframes};
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

/// How long each segment of a session is asked to run.
const SEGMENT_SECONDS: u32 = 4;

fn hevc(name: &str, open_gop: bool) -> PathBuf {
    let params = format!(
        "keyint=48:min-keyint=48:scenecut=0:open-gop={}:log-level=error",
        u8::from(open_gop)
    );

    generate(
        name,
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=24",
            "-t",
            "12",
            "-c:v",
            "libx265",
            "-x265-params",
            &params,
        ],
    )
}

fn h264() -> PathBuf {
    generate(
        "idr-keyframes-h264.mkv",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=24",
            "-t",
            "12",
            "-c:v",
            "libx264",
            "-g",
            "48",
        ],
    )
}

fn artefacts(name: &str) -> PathBuf {
    let root = common::scratch(format!("valence-idr-keyframes-{name}"));

    let _ = std::fs::remove_dir_all(&root);
    std::fs::create_dir_all(&root).expect("the scratch directory is made");

    root
}

#[tokio::test]
async fn an_open_gop_hevc_film_opens_on_something_else() {
    require_ffmpeg();
    let film = hevc("idr-keyframes-open.mkv", true);

    assert_eq!(
        opens_only_on_idr(&ffmpeg(), &artefacts("open"), &film, "hevc").await,
        Some(false)
    );
}

#[tokio::test]
async fn a_closed_gop_hevc_film_opens_only_on_idr() {
    require_ffmpeg();
    let film = hevc("idr-keyframes-closed.mkv", false);

    assert_eq!(
        opens_only_on_idr(&ffmpeg(), &artefacts("closed"), &film, "hevc").await,
        Some(true)
    );
}

#[tokio::test]
async fn an_h264_film_is_not_read_at_all() {
    require_ffmpeg();

    assert_eq!(
        opens_only_on_idr(&ffmpeg(), &artefacts("h264"), &h264(), "h264").await,
        None
    );
}

#[tokio::test]
async fn the_answer_is_kept_and_read_back() {
    require_ffmpeg();
    let film = hevc("idr-keyframes-kept.mkv", true);
    let root = artefacts("kept");

    assert_eq!(
        opens_only_on_idr(&ffmpeg(), &root, &film, "hevc").await,
        Some(false)
    );
    assert_eq!(
        opens_only_on_idr("/nonexistent/ffmpeg", &root, &film, "hevc").await,
        Some(false)
    );
}

/// An open-GOP HEVC film with sound, the shape of the one Firefox froze on.
fn open_gop_film_with_sound() -> PathBuf {
    generate(
        "idr-keyframes-session.mkv",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=24",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440",
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-t",
            "30",
            "-c:v",
            "libx265",
            "-x265-params",
            "keyint=60:min-keyint=60:scenecut=0:open-gop=1:log-level=error",
            "-c:a",
            "aac",
            "-ac",
            "2",
        ],
    )
}

/// The same film graded in HDR10: ten bits, BT.2020 and the PQ curve.
fn open_gop_hdr_film_with_sound() -> PathBuf {
    generate(
        "idr-keyframes-session-hdr.mkv",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=24",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440",
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-t",
            "30",
            "-c:v",
            "libx265",
            "-pix_fmt",
            "yuv420p10le",
            "-x265-params",
            "keyint=60:min-keyint=60:scenecut=0:open-gop=1:log-level=error:\
             colorprim=bt2020:transfer=smpte2084:colormatrix=bt2020nc",
            "-c:a",
            "aac",
            "-ac",
            "2",
        ],
    )
}

/// An ffmpeg that refuses to copy a picture out, the way a source behaves
/// whose keyframes cannot be read in time, and runs everything else.
fn ffmpeg_refusing_reads(directory: &Path) -> String {
    use std::os::unix::fs::PermissionsExt;

    std::fs::create_dir_all(directory).expect("makes the directory for the refusing ffmpeg");

    let path = directory.join("refusing-ffmpeg");
    let script = format!(
        "#!/bin/sh\ncase \"$*\" in\n  *pipe:1*) exit 1 ;;\nesac\nexec '{}' \"$@\"\n",
        ffmpeg().replace('\'', r"'\''"),
    );

    std::fs::write(&path, script).expect("writes the refusing ffmpeg");
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755))
        .expect("makes the refusing ffmpeg runnable");

    path.to_string_lossy().into_owned()
}

/// A transcoder set up the way `serve` sets one up.
async fn app(name: &str) -> axum::Router {
    app_with(name, ffmpeg()).await
}

/// The same, driving the given ffmpeg.
async fn app_with(name: &str, ffmpeg_path: String) -> axum::Router {
    valence_transcoder::capability::detect_capabilities(
        &ffmpeg(),
        valence_transcoder::transcode_plan::DEFAULT_DEVICE,
    )
    .await;

    let root = common::scratch(format!("valence-test-idr-keyframes-{name}"));

    std::fs::remove_dir_all(&root).ok();

    let registry = SessionRegistry::new(SessionConfig {
        device: valence_transcoder::transcode_plan::DEFAULT_DEVICE.to_owned(),
        ffmpeg: ffmpeg_path,
        ffprobe: ffprobe(),
        cache_root: root.join("cache"),
        artefact_root: root.join("artefacts"),
        idle_timeout: Duration::from_secs(60),
        manifest_timeout: Duration::from_secs(120),
        keyframe_deadline: Duration::from_secs(60),
        split_audio: false,
    });

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

/// A request to copy the film's picture, from a client that does or does not
/// need IDR keyframes.
fn copy_spec(input: &Path, needs_idr_keyframes: bool) -> SessionSpec {
    SessionSpec {
        input_path: input.to_string_lossy().into_owned(),
        start_seconds: 0,
        segment_seconds: SEGMENT_SECONDS,
        hardware_accel: HardwareAccel::None,
        video: VideoAction::Copy,
        audio: AudioAction::Copy,
        audio_stream_index: None,
        subtitles: SubtitleAction::None,
        source_size: Some((320, 180)),
        container: SegmentContainer::Fmp4,
        source_video_codec: Some("hevc".to_owned()),
        source_pixel_format: None,
        track: Track::Both,
        source_range: None,
        source_range_base: None,
        needs_idr_keyframes,
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

async fn start(app: &axum::Router, spec: &SessionSpec) -> serde_json::Value {
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

    assert_eq!(status, StatusCode::OK, "the session did not start");

    serde_json::from_slice(&body).expect("a session answers in JSON")
}

/// How long the playlist says each of a session's segments runs.
async fn declared_lengths(app: &axum::Router, started: &serde_json::Value) -> Vec<f64> {
    let id = started["id"].as_str().expect("a session has an id");
    let (status, body) = call(
        app,
        Request::builder()
            .uri(format!("/sessions/{id}/index.m3u8"))
            .body(Body::empty())
            .expect("builds the request"),
    )
    .await;

    assert_eq!(status, StatusCode::OK);

    String::from_utf8_lossy(&body)
        .lines()
        .filter_map(|line| line.strip_prefix("#EXTINF:"))
        .map(|length| {
            length
                .trim_end_matches(',')
                .parse::<f64>()
                .expect("a length is a number")
        })
        .collect()
}

#[tokio::test]
async fn a_client_needing_idr_keyframes_is_sent_an_encode_cut_in_equal_lengths() {
    require_ffmpeg();
    let film = open_gop_film_with_sound();
    let app = app("session").await;

    let started = start(&app, &copy_spec(&film, true)).await;

    assert_eq!(started["encodesVideo"], serde_json::json!(true));
    assert_eq!(started["encodedForKeyframes"], serde_json::json!(true));

    let lengths = declared_lengths(&app, &started).await;
    let (last, every_other) = lengths.split_last().expect("the playlist lists segments");

    assert!(
        every_other
            .iter()
            .all(|length| (length - f64::from(SEGMENT_SECONDS)).abs() < 0.01),
        "an encode is cut every {SEGMENT_SECONDS}s and its playlist has to say so, or the player \
         stalls where the two part: {lengths:?}"
    );
    assert!(*last <= f64::from(SEGMENT_SECONDS) + 0.01);
}

#[tokio::test]
async fn every_other_client_still_gets_the_copy() {
    require_ffmpeg();
    let film = open_gop_film_with_sound();
    let app = app("copy").await;

    let started = start(&app, &copy_spec(&film, false)).await;

    assert_eq!(started["encodesVideo"], serde_json::json!(false));
    assert_eq!(started["encodedForKeyframes"], serde_json::json!(false));
}

/// The transfer curve the first segment of a session declares.
async fn first_segment_transfer(app: &axum::Router, started: &serde_json::Value) -> String {
    let id = started["id"].as_str().expect("a session has an id");
    let fetch = |name: String| async move {
        let (status, body) = call(
            app,
            Request::builder()
                .uri(format!("/sessions/{id}/{name}"))
                .body(Body::empty())
                .expect("builds the request"),
        )
        .await;

        assert_eq!(status, StatusCode::OK, "{name} was not served");

        body
    };

    let playlist = String::from_utf8(fetch("index.m3u8".to_owned()).await).expect("text");
    let first = playlist
        .lines()
        .find(|line| line.starts_with("segment"))
        .expect("the playlist lists a segment")
        .to_owned();
    let mut joined = fetch("init.mp4".to_owned()).await;

    joined.extend(fetch(first).await);

    let at = common::scratch(format!("valence-idr-keyframes-segment-{id}.mp4"));

    std::fs::write(&at, joined).expect("writes the segment out");

    let output = std::process::Command::new(ffprobe())
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=color_transfer",
            "-of",
            "csv=p=0",
        ])
        .arg(&at)
        .output()
        .expect("runs ffprobe");

    String::from_utf8_lossy(&output.stdout).trim().to_owned()
}

#[tokio::test]
async fn an_hdr_film_encoded_for_its_keyframes_arrives_tone_mapped() {
    require_ffmpeg();
    let film = open_gop_hdr_film_with_sound();
    let app = app("hdr").await;
    let able = valence_transcoder::capability::detect_capabilities(
        &ffmpeg(),
        valence_transcoder::transcode_plan::DEFAULT_DEVICE,
    )
    .await;

    let started = start(&app, &copy_spec(&film, true)).await;

    assert_eq!(started["encodesVideo"], serde_json::json!(true));

    if able.tone_mapping == valence_transcoder::transcode_plan::ToneMapping::Unavailable {
        assert_eq!(started["toneMaps"], serde_json::json!(false));
        return;
    }

    assert_eq!(started["toneMaps"], serde_json::json!(true));
    assert_eq!(
        first_segment_transfer(&app, &started).await,
        "bt709",
        "eight-bit H.264 under the PQ curve bands; it has to arrive as SDR"
    );
}

#[tokio::test]
async fn a_film_whose_keyframes_cannot_be_read_is_encoded_without_claiming_why() {
    require_ffmpeg();
    let film = open_gop_film_with_sound();
    let root = common::scratch("valence-test-idr-keyframes-unread-bin");
    let app = app_with("unread", ffmpeg_refusing_reads(&root)).await;

    let started = start(&app, &copy_spec(&film, true)).await;

    assert_eq!(
        started["encodesVideo"],
        serde_json::json!(true),
        "a copy that may freeze for good is not worth the encode it saves"
    );
    assert_eq!(
        started["encodedForKeyframes"],
        serde_json::json!(false),
        "nothing was proven about the keyframes, so nothing is claimed"
    );
    assert_eq!(
        opens_only_on_idr(
            "/nonexistent/ffmpeg",
            &common::scratch("valence-test-idr-keyframes-unread").join("artefacts"),
            &film,
            "hevc"
        )
        .await,
        None,
        "an answer that was never read is not kept"
    );
}

#[tokio::test]
async fn a_film_with_nothing_to_sample_says_nothing_and_keeps_nothing() {
    require_ffmpeg();
    let film = hevc("idr-keyframes-one-keyframe.mkv", false);
    let root = artefacts("one-keyframe");
    let only_the_opening = Keyframes {
        cuts: vec![Cut {
            at_seconds: 0.0,
            starts_at_seconds: 0.0,
        }],
        starts_at_seconds: 0.0,
        duration_seconds: 12.0,
    };

    assert!(valence_transcoder::keyframe_index::write(&root, &film, &only_the_opening).await);
    assert_eq!(
        opens_only_on_idr(&ffmpeg(), &root, &film, "hevc").await,
        None,
        "no keyframe was read, so nothing is known"
    );
    assert!(
        !root.join("idr").exists(),
        "and nothing is kept, so a later session asks again"
    );
}
