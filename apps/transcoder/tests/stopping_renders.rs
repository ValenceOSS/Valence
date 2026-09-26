//! Stopping renders that are under way, through the real HTTP surface.
//!
//! The server stops a job by stopping its own loop, and until this existed
//! that was all: every clip it had already asked for went on encoding here for
//! as long as each took, while the jobs page said it had stopped. These drive
//! an ffmpeg that is deliberately slow, so there is a render to stop.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::path::{Path, PathBuf};
use std::time::Duration;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;

use valence_transcoder::monitor::{Journal, Monitor};
use valence_transcoder::preview::PreviewRegistry;
use valence_transcoder::queue::{JobState, WorkQueue, STOPPED_ON_REQUEST};
use valence_transcoder::router::{create_router, AppState};
use valence_transcoder::session::{SessionConfig, SessionRegistry};
use valence_transcoder::trickplay::TrickplayRegistry;

mod common;

use common::{ffmpeg, ffprobe, generate, require_ffmpeg};

/// A file long enough for a clip to be cut out of the middle of it.
fn source_file() -> PathBuf {
    generate(
        "stopping-source.mp4",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x180:rate=24:duration=60",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-pix_fmt",
            "yuv420p",
        ],
    )
}

/// An ffmpeg that takes a minute over every clip, and writes a little of it
/// first, so there is both a render to stop and something half-made to clear.
fn slow_ffmpeg(directory: &Path) -> String {
    use std::os::unix::fs::PermissionsExt;

    std::fs::create_dir_all(directory).expect("creates the directory");

    let script = directory.join("ffmpeg-slow");

    std::fs::write(
        &script,
        format!(
            "#!/bin/sh\nfor last; do :; done\ncase \" $* \" in *\" -c:v \"*preview.mp4*) printf partial > \"$last\"; exec sleep 60 ;; esac\nexec {real} \"$@\"\n",
            real = ffmpeg(),
        ),
    )
    .expect("writes the wrapper");

    std::fs::set_permissions(&script, std::fs::Permissions::from_mode(0o755))
        .expect("makes the wrapper executable");

    script.to_string_lossy().into_owned()
}

fn app(root: &Path, queue: &WorkQueue, source: &Path) -> axum::Router {
    create_router(AppState {
        registry: SessionRegistry::new(SessionConfig {
            device: valence_transcoder::transcode_plan::DEFAULT_DEVICE.to_owned(),
            ffmpeg: slow_ffmpeg(&root.join("bin")),
            ffprobe: ffprobe(),
            cache_root: root.to_path_buf(),
            artefact_root: root.to_path_buf(),
            idle_timeout: Duration::from_secs(60),
            manifest_timeout: Duration::from_secs(120),
            max_concurrent: 2,
        }),
        downloads: valence_transcoder::progress_registry::ProgressRegistry::new(),
        trickplay: TrickplayRegistry::default(),
        previews: PreviewRegistry::default(),
        monitor: Monitor::new(Journal::new()),
        audio: valence_transcoder::audio::AudioRegistry::new(),
        queue: queue.clone(),
        ffprobe: ffprobe(),
        renditions: valence_transcoder::progress_registry::ProgressRegistry::new(),
        write_roots: Vec::new(),
        media_roots: vec![source.parent().expect("a parent").to_path_buf()],
    })
}

async fn post(
    app: &axum::Router,
    path: &str,
    body: serde_json::Value,
) -> (StatusCode, serde_json::Value) {
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(path)
                .header("content-type", "application/json")
                .body(Body::from(body.to_string()))
                .expect("builds the request"),
        )
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

fn clip(source: &Path, job: Option<&str>) -> serde_json::Value {
    serde_json::json!({
        "inputPath": source.to_string_lossy(),
        "generation": 0,
        "wait": false,
        "correlationId": job,
    })
}

/// Waits for the one job in the queue to reach a state, for up to a while.
async fn until_state(queue: &WorkQueue, state: JobState) -> bool {
    for _ in 0..200 {
        if queue.snapshot().await.jobs.first().map(|job| job.state) == Some(state) {
            return true;
        }

        tokio::time::sleep(Duration::from_millis(50)).await;
    }

    false
}

fn clip_directory(root: &Path, id: &str) -> PathBuf {
    root.join("previews").join(id)
}

#[tokio::test]
async fn stopping_a_job_stops_its_renders_at_once_and_keeps_nothing_half_made() {
    require_ffmpeg();

    let root = std::env::temp_dir().join("valence-test-stopping-job");
    let _ = std::fs::remove_dir_all(&root);
    let source = source_file();
    let queue = WorkQueue::new(1);
    let app = app(&root, &queue, &source);

    let (status, started) = post(&app, "/previews", clip(&source, Some("job-1"))).await;

    assert_eq!(status, StatusCode::ACCEPTED, "{started}");
    assert!(
        until_state(&queue, JobState::Running).await,
        "the render began"
    );

    let id = started["id"].as_str().expect("an address").to_owned();

    let (status, stopped) = post(
        &app,
        "/renders/stop",
        serde_json::json!({ "correlationId": "job-1" }),
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(stopped["stopped"], 1);
    assert!(
        until_state(&queue, JobState::Stopped).await,
        "the render stops rather than running out its minute"
    );

    let job = queue
        .snapshot()
        .await
        .jobs
        .first()
        .cloned()
        .expect("recorded");

    assert!(job.failure.is_none(), "a stop is not a failure");
    assert_eq!(job.stopped_because.as_deref(), Some(STOPPED_ON_REQUEST));

    for _ in 0..100 {
        if !clip_directory(&root, &id).exists() {
            break;
        }

        tokio::time::sleep(Duration::from_millis(20)).await;
    }

    assert!(
        !clip_directory(&root, &id).exists(),
        "the half-made clip is thrown away"
    );
}

#[tokio::test]
async fn turns_away_what_a_stopped_job_asks_for_afterwards_and_nobody_else() {
    require_ffmpeg();

    let root = std::env::temp_dir().join("valence-test-stopped-stragglers");
    let _ = std::fs::remove_dir_all(&root);
    let source = source_file();
    let queue = WorkQueue::new(1);
    let app = app(&root, &queue, &source);

    post(
        &app,
        "/renders/stop",
        serde_json::json!({ "correlationId": "job-1" }),
    )
    .await;

    let (status, _) = post(&app, "/previews", clip(&source, Some("job-1"))).await;

    assert_eq!(
        status,
        StatusCode::CONFLICT,
        "an ask already on its way when the job was stopped must not start a render"
    );

    let (status, _) = post(&app, "/previews", clip(&source, Some("job-2"))).await;

    assert_eq!(status, StatusCode::ACCEPTED, "another job is not refused");
}

#[tokio::test]
async fn clearing_a_clip_that_is_being_made_stops_it_first() {
    require_ffmpeg();

    let root = std::env::temp_dir().join("valence-test-stopping-forget");
    let _ = std::fs::remove_dir_all(&root);
    let source = source_file();
    let queue = WorkQueue::new(1);
    let app = app(&root, &queue, &source);

    let (_, started) = post(&app, "/previews", clip(&source, None)).await;

    assert!(
        until_state(&queue, JobState::Running).await,
        "the render began"
    );

    let (status, _) = post(&app, "/previews/forget", clip(&source, None)).await;

    assert_eq!(status, StatusCode::OK);
    assert!(
        until_state(&queue, JobState::Stopped).await,
        "clearing it stops the render rather than failing it"
    );
    assert!(
        queue
            .snapshot()
            .await
            .jobs
            .first()
            .expect("recorded")
            .failure
            .is_none(),
        "clearing a clip is not an ffmpeg failure"
    );

    let id = started["id"].as_str().expect("an address");

    assert!(!clip_directory(&root, id).exists());
}
