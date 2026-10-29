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
    common::scratch(format!("valence-test-split-{name}"))
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
        keyframe_deadline: valence_transcoder::boundaries::DEFAULT_KEYFRAME_DEADLINE,
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

    let path = common::scratch(format!("valence-split-{id}-{segment}.mp4"));
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
    assert!(
        multivariant.contains(",FRAME-RATE=25.000,"),
        "the picture's frame rate is declared: {multivariant}"
    );
    assert!(
        !multivariant.contains("VIDEO-RANGE"),
        "a picture that names no colour is left to the playlist's default: {multivariant}"
    );

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

    for playlist in [&video, &audio] {
        let declared: f64 = target(playlist)
            .and_then(|line| line["#EXT-X-TARGETDURATION:".len()..].parse().ok())
            .expect("declares a target");

        assert!(
            playlist
                .lines()
                .filter_map(|line| line.strip_prefix("#EXTINF:"))
                .filter_map(|length| length.trim_end_matches(',').parse::<f64>().ok())
                .all(|length| length.round() <= declared),
            "no segment runs past the target its playlist declares, which an iPhone refuses: \
             {playlist}"
        );
    }
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

/// A picture offered beside the film, as an SDR one is beside an HDR copy.
fn offered() -> SessionSpec {
    SessionSpec {
        video: VideoAction::Encode {
            encoder: "libx264".into(),
            max_bitrate_kbps: 1_000,
            max_width: 320,
            max_height: 320,
            tone_map: None,
            deinterlace: false,
            square_pixels: false,
        },
        audio: AudioAction::Encode {
            encoder: "aac".into(),
            channels: 2,
            max_bitrate_kbps: 128,
        },
        ..spec()
    }
}

/// Starts the film with a picture offered beside it, and says where that will be.
async fn start_offering(app: &axum::Router) -> (String, String) {
    let mut body = serde_json::to_value(spec()).expect("serialises");
    body["deferredVariants"] = serde_json::json!([offered()]);

    let (status, bytes) = call(
        app,
        Request::builder()
            .method("POST")
            .uri("/sessions")
            .header("content-type", "application/json")
            .body(Body::from(body.to_string()))
            .expect("builds the request"),
    )
    .await;

    assert_eq!(status, StatusCode::OK, "the session did not start");

    let started: serde_json::Value = serde_json::from_slice(&bytes).expect("answers in JSON");
    let id = started["id"].as_str().expect("has an id").to_owned();
    let playlist = text(app, &id, "index.m3u8").await;
    let offered = playlist
        .lines()
        .find_map(|line| line.strip_prefix("../")?.strip_suffix("/index.m3u8"))
        .expect("offers a picture of its own")
        .to_owned();

    (id, offered)
}

/// The SDR picture beside an HDR copy costs nothing until a player that cannot
/// show HDR asks for it.
#[tokio::test(flavor = "multi_thread")]
async fn offers_a_picture_without_starting_it() {
    require_ffmpeg();

    let registry = registry("offers", true);
    let app = app(registry.clone());
    let (id, _) = start_offering(&app).await;
    let playlist = text(&app, &id, "index.m3u8").await;

    assert!(
        playlist.contains(",RESOLUTION=320x180,FRAME-RATE=25.000,VIDEO-RANGE=SDR,"),
        "describes what it will be: {playlist}"
    );
    assert!(
        playlist.contains("CODECS=\"avc1.64001E,"),
        "names its codec before it has run: {playlist}"
    );
    assert_eq!(
        registry.len().await,
        2,
        "only the picture and the sound run"
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn starts_an_offered_picture_once_a_player_asks() {
    require_ffmpeg();

    let registry = registry("asks", true);
    let app = app(registry.clone());
    let (_, offered) = start_offering(&app).await;
    let playlist = text(&app, &offered, "index.m3u8").await;

    assert!(
        playlist.contains("#EXTINF:"),
        "serves its playlist: {playlist}"
    );
    assert_eq!(registry.len().await, 3, "the offered picture runs now");
    assert_eq!(
        streams_in(&app, &offered, "init.mp4", "segment00000.m4s").await,
        ["video"]
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn stops_an_offered_picture_with_the_film() {
    require_ffmpeg();

    let registry = registry("stops-offered", true);
    let app = app(registry.clone());
    let (id, offered) = start_offering(&app).await;

    text(&app, &offered, "index.m3u8").await;

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
    assert_eq!(
        registry.len().await,
        0,
        "the offered picture goes with the film"
    );

    let (status, _) = call(
        &app,
        Request::builder()
            .uri(format!("/sessions/{offered}/index.m3u8"))
            .body(Body::empty())
            .expect("builds the request"),
    )
    .await;

    assert_eq!(status, StatusCode::NOT_FOUND, "and is not started again");
}

/// A player is told where the picture sits in the frame, once it has been looked for.
#[tokio::test(flavor = "multi_thread")]
async fn says_where_the_picture_sits_in_its_frame() {
    require_ffmpeg();

    let registry = registry("picture", true);
    let app = app(registry);
    let id = start(&app).await;
    let mut said = None;

    for _ in 0..100 {
        let (status, bytes) = call(
            &app,
            Request::builder()
                .uri(format!("/sessions/{id}/picture.json"))
                .body(Body::empty())
                .expect("builds the request"),
        )
        .await;

        if status == StatusCode::OK {
            said = Some(bytes);
            break;
        }

        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    let area: serde_json::Value =
        serde_json::from_slice(&said.expect("is said in time")).expect("is JSON");

    assert_eq!(
        area,
        serde_json::json!({ "x": 0.0, "y": 0.0, "width": 1.0, "height": 1.0 }),
        "a test card fills its frame"
    );
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
