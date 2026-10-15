//! Trying the hardware a server has been told to use, on a short real transcode.

use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tokio::process::Command;

use crate::capability::{device_filters_for, summarise_failure};
use crate::transcode_plan::{
    frame_route, AudioAction, HardwareAccel, SegmentContainer, SegmentStart, SessionSpec,
    SubtitleAction, Track, TranscodePlan, VideoAction,
};

/// How long the sample runs, in seconds.
///
/// Long enough for a speed to mean something once the encoder has opened, and
/// short enough that pressing the button is not a wait.
pub const SAMPLE_SECONDS: u32 = 5;

/// How large the sample is drawn.
///
/// The size a library is mostly made of, so the speed reported is the speed a
/// film would be transcoded at rather than a thumbnail's.
const SAMPLE_SIZE: (u32, u32) = (1920, 1080);

/// How large the test transcode makes it, which is what a phone is usually sent.
const OUTPUT_SIZE: (u32, u32) = (1280, 720);

/// How long any one run may take before it is given up on.
///
/// A driver that hangs rather than failing is one of the things this exists to
/// find, and a test that hangs with it would find nothing.
const RUN_LIMIT: Duration = Duration::from_secs(60);

/// What was asked to be tried.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareTestRequest {
    pub accel: HardwareAccel,
    pub encoder: String,
}

/// What became of the attempt, in the terms an operator wants.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareTestReport {
    pub accel: HardwareAccel,
    pub encoder: String,
    /// Whether the frames were decoded on the device, or null where the
    /// backend decodes in software by design.
    pub decodes_on_device: Option<bool>,
    /// Whether the encoder asked for ran.
    pub encodes_on_device: bool,
    /// How many times faster than real time the hardware transcode ran.
    pub speed: Option<f64>,
    /// How many times faster than real time the same transcode ran in software.
    pub software_speed: Option<f64>,
    /// Why the hardware was not used, where it was not.
    pub reason: Option<String>,
}

/// How one run of ffmpeg went.
enum Run {
    Took(Duration),
    Failed(String),
}

/// The plan for transcoding the sample the way a session would.
///
/// Built from a session's own specification rather than from arguments written
/// for the purpose, because a test that runs something other than what a
/// viewer gets proves nothing about what a viewer gets.
#[must_use]
pub fn sample_plan(
    sample: &Path,
    output: &Path,
    accel: HardwareAccel,
    encoder: &str,
    device: &str,
) -> TranscodePlan {
    TranscodePlan {
        spec: SessionSpec {
            input_path: sample.to_string_lossy().into_owned(),
            start_seconds: 0,
            segment_seconds: 4,
            hardware_accel: accel,
            video: VideoAction::Encode {
                encoder: encoder.to_owned(),
                max_bitrate_kbps: 8_000,
                max_width: OUTPUT_SIZE.0,
                max_height: OUTPUT_SIZE.1,
                tone_map: None,
                deinterlace: false,
                square_pixels: false,
            },
            audio: AudioAction::Copy,
            audio_stream_index: None,
            subtitles: SubtitleAction::None,
            source_size: Some(SAMPLE_SIZE),
            container: SegmentContainer::default(),
            source_video_codec: Some("h264".to_owned()),
            track: Track::Video,
            source_range: None,
            source_range_base: None,
        },
        output_directory: output.to_string_lossy().into_owned(),
        device: device.to_owned(),
        device_filters: crate::transcode_plan::DeviceFilters::default(),
        start_at: SegmentStart::default(),
        cut_seconds: 4.0,
    }
}

/// The arguments that draw the sample, an H.264 file like most of a library.
#[must_use]
pub fn sample_arguments(sample: &Path) -> Vec<String> {
    let (width, height) = SAMPLE_SIZE;

    vec![
        "-hide_banner".to_owned(),
        "-nostdin".to_owned(),
        "-loglevel".to_owned(),
        "error".to_owned(),
        "-f".to_owned(),
        "lavfi".to_owned(),
        "-i".to_owned(),
        format!("testsrc2=size={width}x{height}:rate=30"),
        "-t".to_owned(),
        SAMPLE_SECONDS.to_string(),
        "-c:v".to_owned(),
        "libx264".to_owned(),
        "-preset".to_owned(),
        "ultrafast".to_owned(),
        "-pix_fmt".to_owned(),
        "yuv420p".to_owned(),
        "-g".to_owned(),
        "30".to_owned(),
        "-y".to_owned(),
        sample.to_string_lossy().into_owned(),
    ]
}

/// Runs ffmpeg once, timing it, and reads why it failed where it did.
async fn run(ffmpeg: &str, arguments: &[String]) -> Run {
    let started = Instant::now();
    let running = Command::new(ffmpeg)
        .args(arguments)
        .stdin(std::process::Stdio::null())
        .kill_on_drop(true)
        .output();

    match tokio::time::timeout(RUN_LIMIT, running).await {
        Err(_) => Run::Failed(format!(
            "ffmpeg was still running after {} seconds",
            RUN_LIMIT.as_secs()
        )),
        Ok(Err(failure)) => Run::Failed(failure.to_string()),
        Ok(Ok(output)) if output.status.success() => Run::Took(started.elapsed()),
        Ok(Ok(output)) => Run::Failed(summarise_failure(
            &String::from_utf8_lossy(&output.stderr),
            "ffmpeg stopped without saying why",
        )),
    }
}

/// How many times faster than real time a run of the sample took.
#[must_use]
pub fn speed_of(took: Duration) -> f64 {
    let seconds = took.as_secs_f64().max(0.001);

    (f64::from(SAMPLE_SECONDS) / seconds * 10.0).round() / 10.0
}

/// A directory of its own for one test, so two pressed at once do not collide.
fn scratch(root: &Path) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |since| since.as_nanos());

    root.join(format!("hardware-test-{nanos}"))
}

/// Tries a backend and its encoder on a short real transcode, and the same
/// transcode in software beside it.
///
/// A hardware run that succeeds proves the decoder as well as the encoder
/// where the plan decodes on the device: the frames are handed to the device's
/// own scaler, which refuses frames that were decoded anywhere else.
pub async fn test_hardware(
    ffmpeg: &str,
    device: &str,
    cache_root: &Path,
    request: HardwareTestRequest,
) -> HardwareTestReport {
    let directory = scratch(cache_root);
    let sample = directory.join("sample.mp4");
    let mut report = HardwareTestReport {
        accel: request.accel,
        encoder: request.encoder.clone(),
        decodes_on_device: None,
        encodes_on_device: false,
        speed: None,
        software_speed: None,
        reason: None,
    };

    if let Err(failure) = tokio::fs::create_dir_all(&directory).await {
        report.reason = Some(failure.to_string());

        return report;
    }

    if let Run::Failed(said) = run(ffmpeg, &sample_arguments(&sample)).await {
        report.reason = Some(format!("the sample could not be made: {said}"));
        let _ = tokio::fs::remove_dir_all(&directory).await;

        return report;
    }

    let mut plan = sample_plan(
        &sample,
        &directory.join("hardware"),
        request.accel,
        &request.encoder,
        device,
    );
    plan.device_filters = device_filters_for(ffmpeg, device, request.accel).await;

    let decodes_on_device = frame_route(&plan.spec, plan.device_filters).decodes_on_the_device();

    if request.accel != HardwareAccel::None {
        let _ = tokio::fs::create_dir_all(&plan.output_directory).await;

        match run(ffmpeg, &plan.to_ffmpeg_args()).await {
            Run::Took(took) => {
                report.encodes_on_device = true;
                report.decodes_on_device = decodes_on_device.then_some(true);
                report.speed = Some(speed_of(took));
            }
            Run::Failed(said) => {
                report.decodes_on_device = decodes_on_device.then_some(false);
                report.reason = Some(said);
            }
        }
    }

    let software = sample_plan(
        &sample,
        &directory.join("software"),
        HardwareAccel::None,
        crate::transcode_plan::software_equivalent(&request.encoder),
        device,
    );
    let _ = tokio::fs::create_dir_all(&software.output_directory).await;

    if let Run::Took(took) = run(ffmpeg, &software.to_ffmpeg_args()).await {
        report.software_speed = Some(speed_of(took));
    }

    let _ = tokio::fs::remove_dir_all(&directory).await;

    report
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plans_the_sample_the_way_a_session_would() {
        let plan = sample_plan(
            Path::new("/tmp/sample.mp4"),
            Path::new("/tmp/out"),
            HardwareAccel::Nvenc,
            "h264_nvenc",
            "/dev/dri/renderD128",
        );
        let arguments = plan.to_ffmpeg_args();

        assert!(arguments
            .windows(2)
            .any(|pair| pair == ["-c:v", "h264_nvenc"]));
        assert!(arguments
            .iter()
            .any(|argument| argument == "/tmp/sample.mp4"));
    }

    #[test]
    fn draws_an_h264_sample_as_long_as_it_says() {
        let arguments = sample_arguments(Path::new("/tmp/sample.mp4"));

        assert!(arguments.windows(2).any(|pair| pair == ["-c:v", "libx264"]));
        assert!(arguments
            .windows(2)
            .any(|pair| pair == ["-t", SAMPLE_SECONDS.to_string().as_str()]));
    }

    #[test]
    fn says_how_much_faster_than_real_time_a_run_was() {
        assert!((speed_of(Duration::from_millis(500)) - 10.0).abs() < f64::EPSILON);
        assert!((speed_of(Duration::from_secs(10)) - 0.5).abs() < f64::EPSILON);
    }
}
