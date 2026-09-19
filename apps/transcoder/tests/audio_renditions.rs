//! Music at lower bitrates, against real audio, through the real HTTP surface.
//!
//! The unit tests prove the naming, the arguments and the sweep. Only running
//! ffmpeg proves the rendition is AAC in MP4 with nothing else in it, that it
//! is served with ranges like any other file, and that several listeners
//! pressing play at once share one encode.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::path::{Path, PathBuf};
use std::time::Duration;

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;

use valence_transcoder::audio::AudioRegistry;
use valence_transcoder::monitor::{Journal, Monitor};
use valence_transcoder::preview::PreviewRegistry;
use valence_transcoder::probe::probe_media;
use valence_transcoder::queue::WorkQueue;
use valence_transcoder::router::{create_router, AppState};
use valence_transcoder::session::{SessionConfig, SessionRegistry};
use valence_transcoder::trickplay::TrickplayRegistry;

mod common;

use common::{ffmpeg, ffprobe, generate, require_ffmpeg};

/// A short lossless track, the kind a library of albums is made of.
///
/// Each test takes its own, because the tests in a file run in parallel and a
/// fixture built twice at once is renamed into place twice — which rewrites the
/// file under a test that is reading it, and gives it a new rendition name.
fn track(name: &str) -> PathBuf {
    generate(
        &format!("audio-rendition-{name}.flac"),
        &[
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440:duration=4:sample_rate=44100",
            "-ac",
            "2",
            "-c:a",
            "flac",
        ],
    )
}

/// A track with a picture riding along as a video stream, as cover art does.
fn track_with_a_picture() -> PathBuf {
    generate(
        "audio-rendition-pictured.mkv",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc=size=64x64:rate=1:duration=4",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=660:duration=4",
            "-c:v",
            "mjpeg",
            "-c:a",
            "flac",
            "-shortest",
        ],
    )
}

/// A file with pictures and no sound at all.
fn silent_film() -> PathBuf {
    generate(
        "audio-rendition-silent.mkv",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc=size=64x64:rate=1:duration=2",
            "-c:v",
            "mjpeg",
        ],
    )
}

fn root(name: &str) -> PathBuf {
    let path = std::env::temp_dir().join(format!("valence-test-audio-{name}"));

    std::fs::remove_dir_all(&path).ok();

    path
}

fn app_with(root: &Path, ffmpeg: String, media_roots: Vec<PathBuf>) -> axum::Router {
    create_router(AppState {
        registry: SessionRegistry::new(SessionConfig {
            device: valence_transcoder::transcode_plan::DEFAULT_DEVICE.to_owned(),
            ffmpeg,
            ffprobe: ffprobe(),
            cache_root: root.join("transcodes"),
            artefact_root: root.join("artefacts"),
            idle_timeout: Duration::from_secs(60),
            manifest_timeout: Duration::from_secs(120),
            max_concurrent: 2,
        }),
        ffprobe: ffprobe(),
        downloads: valence_transcoder::progress_registry::ProgressRegistry::new(),
        trickplay: TrickplayRegistry::default(),
        previews: PreviewRegistry::default(),
        monitor: Monitor::new(Journal::new()),
        audio: AudioRegistry::new(),
        queue: WorkQueue::new(1),
        renditions: valence_transcoder::progress_registry::ProgressRegistry::new(),
        media_roots,
        write_roots: Vec::new(),
    })
}

fn app(root: &Path) -> axum::Router {
    app_with(root, ffmpeg(), Vec::new())
}

/// Escapes a path for a query string.
fn escaped(path: &Path) -> String {
    path.to_string_lossy()
        .bytes()
        .map(|byte| {
            if byte.is_ascii_alphanumeric() || b"/._-".contains(&byte) {
                char::from(byte).to_string()
            } else {
                format!("%{byte:02X}")
            }
        })
        .collect()
}

struct Answer {
    status: StatusCode,
    content_type: Option<String>,
    content_range: Option<String>,
    body: Vec<u8>,
}

async fn ask(app: &axum::Router, path: &Path, kbps: &str, range: Option<&str>) -> Answer {
    let mut builder = Request::builder().uri(format!("/audio?path={}&kbps={kbps}", escaped(path)));

    if let Some(value) = range {
        builder = builder.header(header::RANGE, value);
    }

    let response = app
        .clone()
        .oneshot(builder.body(Body::empty()).expect("builds the request"))
        .await
        .expect("handles the request");

    let read = |name: header::HeaderName| {
        response
            .headers()
            .get(name)
            .and_then(|value| value.to_str().ok())
            .map(str::to_owned)
    };

    let content_type = read(header::CONTENT_TYPE);
    let content_range = read(header::CONTENT_RANGE);
    let status = response.status();

    let body = response
        .into_body()
        .collect()
        .await
        .expect("reads the body")
        .to_bytes()
        .to_vec();

    Answer {
        status,
        content_type,
        content_range,
        body,
    }
}

fn renditions(root: &Path) -> Vec<PathBuf> {
    let Ok(entries) = std::fs::read_dir(root.join("artefacts").join("audio")) else {
        return Vec::new();
    };

    let mut found: Vec<PathBuf> = entries.flatten().map(|entry| entry.path()).collect();

    found.sort();
    found
}

/// An ffmpeg that records every rendition it is asked to encode.
fn counting_ffmpeg(directory: &Path) -> (String, PathBuf) {
    use std::os::unix::fs::PermissionsExt;

    std::fs::create_dir_all(directory).expect("creates the directory");

    let tally = directory.join("runs");
    let script = directory.join("ffmpeg-counting");

    std::fs::write(
        &script,
        format!(
            "#!/bin/sh\ncase \" $* \" in *\" -c:a aac \"*.part*) echo run >> {tally} ;; esac\nexec {real} \"$@\"\n",
            tally = tally.display(),
            real = ffmpeg(),
        ),
    )
    .expect("writes the wrapper");

    std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755))
        .expect("makes the wrapper executable");

    (script.to_string_lossy().into_owned(), tally)
}

#[tokio::test]
async fn refuses_a_bitrate_it_does_not_offer() {
    let root = root("bitrate");
    let app = app(&root);

    for kbps in ["128", "0", "loud", "320k"] {
        let answer = ask(&app, Path::new("/music/track.flac"), kbps, None).await;

        assert_eq!(answer.status, StatusCode::BAD_REQUEST, "{kbps}");
        assert!(
            String::from_utf8_lossy(&answer.body).contains("\"error\""),
            "answers in the service's own words"
        );
    }
}

#[tokio::test]
async fn has_nothing_for_a_file_that_is_not_there() {
    let root = root("missing");
    let answer = ask(&app(&root), Path::new("/nowhere/at/all.flac"), "160", None).await;

    assert_eq!(answer.status, StatusCode::NOT_FOUND);
    assert!(String::from_utf8_lossy(&answer.body).contains("\"error\""));
}

#[tokio::test]
async fn has_nothing_for_a_file_with_no_sound() {
    require_ffmpeg();

    let root = root("silent");
    let answer = ask(&app(&root), &silent_film(), "160", None).await;

    assert_eq!(
        answer.status,
        StatusCode::NOT_FOUND,
        "{}",
        String::from_utf8_lossy(&answer.body)
    );
    assert!(renditions(&root).is_empty(), "{:?}", renditions(&root));
}

#[tokio::test]
async fn refuses_a_file_outside_the_media_roots() {
    let root = root("roots");
    let confined = app_with(&root, ffmpeg(), vec![PathBuf::from("/music")]);

    let answer = ask(&confined, Path::new("/etc/hosts"), "96", None).await;

    assert_eq!(answer.status, StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn encodes_the_track_as_aac_in_mp4_and_nothing_else() {
    require_ffmpeg();

    let root = root("encode");
    let answer = ask(&app(&root), &track_with_a_picture(), "96", None).await;

    assert_eq!(
        answer.status,
        StatusCode::OK,
        "{}",
        String::from_utf8_lossy(&answer.body)
    );
    assert_eq!(answer.content_type.as_deref(), Some("audio/mp4"));
    assert_eq!(answer.body.get(4..8), Some(&b"ftyp"[..]), "an MP4 file");

    let made = renditions(&root);

    assert_eq!(made.len(), 1, "{made:?}");
    assert_eq!(
        made[0].extension().and_then(|found| found.to_str()),
        Some("m4a")
    );
    assert_eq!(
        std::fs::read(&made[0]).expect("reads the rendition"),
        answer.body
    );

    let probe = probe_media(&ffprobe(), &made[0])
        .await
        .expect("probes the rendition");

    assert!(probe.video.is_none(), "the picture must not ride along");
    assert_eq!(probe.audio_streams.len(), 1);
    assert_eq!(probe.audio_streams[0].codec, "aac");
    assert_eq!(probe.audio_streams[0].channels, 2);
}

#[tokio::test]
async fn serves_a_stretch_of_the_rendition_when_asked_for_one() {
    require_ffmpeg();

    let root = root("range");
    let app = app(&root);
    let source = track("range");
    let whole = ask(&app, &source, "160", None).await;

    assert_eq!(whole.status, StatusCode::OK);

    let part = ask(&app, &source, "160", Some("bytes=0-99")).await;

    assert_eq!(part.status, StatusCode::PARTIAL_CONTENT);
    assert_eq!(part.body, whole.body[..100]);
    assert_eq!(part.content_type.as_deref(), Some("audio/mp4"));
    assert_eq!(
        part.content_range,
        Some(format!("bytes 0-99/{}", whole.body.len()))
    );
}

#[tokio::test]
async fn keeps_one_rendition_per_bitrate() {
    require_ffmpeg();

    let root = root("bitrates");
    let app = app(&root);

    for kbps in ["96", "320", "96"] {
        assert_eq!(
            ask(&app, &track("bitrates"), kbps, None).await.status,
            StatusCode::OK
        );
    }

    assert_eq!(renditions(&root).len(), 2, "{:?}", renditions(&root));
}

#[tokio::test]
async fn listeners_pressing_play_together_share_one_encode() {
    require_ffmpeg();

    let root = root("together");
    let (counting, tally) = counting_ffmpeg(&root.join("bin"));
    let app = app_with(&root, counting, Vec::new());
    let source = track("together");

    let (first, second, third) = tokio::join!(
        ask(&app, &source, "320", None),
        ask(&app, &source, "320", None),
        ask(&app, &source, "320", None),
    );

    for answer in [&first, &second, &third] {
        assert_eq!(
            answer.status,
            StatusCode::OK,
            "{}",
            String::from_utf8_lossy(&answer.body)
        );
        assert_eq!(answer.body, first.body);
    }

    let runs = std::fs::read_to_string(&tally)
        .map(|text| text.lines().count())
        .unwrap_or_default();

    assert_eq!(runs, 1, "ffmpeg encoded one rendition more than once");
    assert_eq!(
        renditions(&root).len(),
        1,
        "no partial file is left beside the rendition"
    );
}
