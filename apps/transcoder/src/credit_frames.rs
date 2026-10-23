//! What each keyframe near the end of a film looks like, for finding where
//! its credits begin.
//!
//! Credits roll as lettering on black, and a keyframe says enough to tell that
//! from a scene: how much of it is black, how dark its darkest tenth is, how
//! bright its brightest pixels are, and how much colour it holds. Reading only
//! keyframes makes this one quick decode of the last few minutes rather than a
//! decode of every frame; deciding what the numbers mean is the server's.

use std::process::Stdio;

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::io::AsyncReadExt;
use tokio::process::Command;

/// How bright a pixel may be and still count as black, on the 0 to 255 scale
/// `blackframe` reads. Intro Skipper settled on the same figure.
pub const BLACK_PIXEL_THRESHOLD: u32 = 28;

/// Which frames to read.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditFramesRequest {
    #[serde(deserialize_with = "crate::path_map::deserialize_input")]
    pub input_path: String,
    /// Where in the file to start reading.
    #[serde(default)]
    pub start_seconds: f64,
    /// How much to read, or to the end of the file where absent.
    #[serde(default)]
    pub duration_seconds: Option<f64>,
    /// Whether to read every frame rather than only keyframes, for finding
    /// the exact frame a cut to black falls on between two keyframes.
    #[serde(default)]
    pub every_frame: bool,
    /// Which of the server's jobs asked for this, where one did.
    #[serde(default)]
    pub correlation_id: Option<String>,
}

/// How one keyframe looks.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyframeLook {
    /// Where the keyframe sits in the file.
    pub seconds: f64,
    /// How much of the picture is black, from 0 to 100.
    pub black_percent: f32,
    /// The darkest pixel's brightness.
    pub y_min: f32,
    /// The brightness a tenth of the picture is darker than.
    pub y_low: f32,
    /// The brightness a tenth of the picture is brighter than.
    pub y_high: f32,
    /// The brightest pixel's brightness.
    pub y_max: f32,
    /// How much colour the picture holds on average.
    pub saturation: f32,
}

/// Every keyframe read, in order.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditFrames {
    pub frames: Vec<KeyframeLook>,
}

/// A credit frame read on the queue.
#[derive(Debug)]
pub struct CreditFramesJob {
    subject: String,
}

impl CreditFramesJob {
    /// A job reading the keyframes of the given subject, named as a person
    /// would recognise it.
    #[must_use]
    pub fn new(subject: impl Into<String>) -> Self {
        Self {
            subject: subject.into(),
        }
    }
}

impl crate::queue::Job for CreditFramesJob {
    fn kind(&self) -> &'static str {
        "creditFrames"
    }

    fn subject(&self) -> String {
        self.subject.clone()
    }
}

/// Why the keyframes could not be read.
#[derive(Debug, Error)]
pub enum CreditFramesError {
    #[error("could not start ffmpeg: {0}")]
    Spawn(std::io::Error),
    #[error("could not read what ffmpeg said: {0}")]
    Read(std::io::Error),
    #[error("ffmpeg could not read the file, and stopped with {0}")]
    Unreadable(std::process::ExitStatus),
}

/// The ffmpeg arguments that print how each frame asked for looks.
///
/// Unless every frame is asked for, only keyframes are decoded, and `select`
/// keeps to them where a decoder ignores `skip_frame`. `blackframe` with no
/// minimum marks every frame with its share of black pixels, `signalstats`
/// adds the brightness and colour figures, and `metadata` prints both to
/// stdout.
#[must_use]
pub fn scan_arguments(request: &CreditFramesRequest) -> Vec<String> {
    let mut arguments: Vec<String> = ["-hide_banner", "-loglevel", "error", "-nostdin"]
        .map(str::to_owned)
        .to_vec();

    if !request.every_frame {
        arguments.extend(["-skip_frame".to_owned(), "nokey".to_owned()]);
    }

    arguments.extend([
        "-ss".to_owned(),
        format!("{:.3}", request.start_seconds),
        "-copyts".to_owned(),
    ]);

    if let Some(duration) = request.duration_seconds {
        arguments.extend(["-t".to_owned(), format!("{duration:.3}")]);
    }

    let keep = if request.every_frame {
        ""
    } else {
        "select='eq(key\\,1)',"
    };

    arguments.extend([
        "-i".to_owned(),
        request.input_path.clone(),
        "-an".to_owned(),
        "-dn".to_owned(),
        "-sn".to_owned(),
        "-vf".to_owned(),
        format!(
            "{keep}format=yuv420p,blackframe=amount=0:threshold={BLACK_PIXEL_THRESHOLD},signalstats,metadata=mode=print:file=-"
        ),
        "-fps_mode".to_owned(),
        "passthrough".to_owned(),
        "-f".to_owned(),
        "null".to_owned(),
        "-".to_owned(),
    ]);

    crate::joined_input::opened(arguments)
}

/// Reads what `metadata=print` wrote into one look per keyframe.
///
/// Each frame opens with a `frame:N pts:N pts_time:T` line and is followed by
/// `key=value` lines. A frame missing any figure is left out rather than
/// guessed at.
#[must_use]
pub fn read_looks(printed: &str) -> Vec<KeyframeLook> {
    let mut looks = Vec::new();
    let mut seconds: Option<f64> = None;
    let mut figures: [Option<f32>; 6] = [None; 6];

    let close = |seconds: Option<f64>,
                 figures: &[Option<f32>; 6],
                 looks: &mut Vec<KeyframeLook>| {
        if let (
            Some(seconds),
            [Some(black_percent), Some(y_min), Some(y_low), Some(y_high), Some(y_max), Some(saturation)],
        ) = (seconds, figures)
        {
            looks.push(KeyframeLook {
                seconds,
                black_percent: *black_percent,
                y_min: *y_min,
                y_low: *y_low,
                y_high: *y_high,
                y_max: *y_max,
                saturation: *saturation,
            });
        }
    };

    for line in printed.lines() {
        let line = line.trim();

        if line.starts_with("frame:") {
            close(seconds, &figures, &mut looks);
            figures = [None; 6];
            seconds = line
                .split_whitespace()
                .find_map(|part| part.strip_prefix("pts_time:"))
                .and_then(|value| value.parse().ok());

            continue;
        }

        let Some((key, value)) = line.split_once('=') else {
            continue;
        };
        let slot = match key {
            "lavfi.blackframe.pblack" => 0,
            "lavfi.signalstats.YMIN" => 1,
            "lavfi.signalstats.YLOW" => 2,
            "lavfi.signalstats.YHIGH" => 3,
            "lavfi.signalstats.YMAX" => 4,
            "lavfi.signalstats.SATAVG" => 5,
            _ => continue,
        };

        figures[slot] = value.parse().ok();
    }

    close(seconds, &figures, &mut looks);

    looks
}

/// Reads how each keyframe from the start of the request to the end of the
/// file looks.
///
/// # Errors
///
/// When ffmpeg cannot be started, what it prints cannot be read, or it fails
/// without reading a single frame — an unreadable file is an error rather than
/// a file with nothing in it, so the server tries it again another time.
pub async fn read_credit_frames(
    ffmpeg: &str,
    request: &CreditFramesRequest,
) -> Result<CreditFrames, CreditFramesError> {
    let mut child = Command::new(ffmpeg)
        .args(scan_arguments(request))
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(CreditFramesError::Spawn)?;

    let mut printed = String::new();

    if let Some(mut stdout) = child.stdout.take() {
        stdout
            .read_to_string(&mut printed)
            .await
            .map_err(CreditFramesError::Read)?;
    }

    let status = child.wait().await.map_err(CreditFramesError::Read)?;
    let frames = read_looks(&printed);

    if frames.is_empty() && !status.success() {
        return Err(CreditFramesError::Unreadable(status));
    }

    Ok(CreditFrames { frames })
}

#[cfg(test)]
mod tests {
    use super::{read_looks, scan_arguments, CreditFramesRequest};

    const PRINTED: &str = "frame:0    pts:1200   pts_time:1200.5
lavfi.blackframe.pblack=99
lavfi.signalstats.YMIN=16
lavfi.signalstats.YLOW=16
lavfi.signalstats.YHIGH=16
lavfi.signalstats.YAVG=18.2
lavfi.signalstats.YMAX=235
lavfi.signalstats.SATAVG=0.1
frame:1    pts:1202   pts_time:1202.5
lavfi.blackframe.pblack=3
lavfi.signalstats.YMIN=20
lavfi.signalstats.YLOW=60
lavfi.signalstats.YHIGH=180
lavfi.signalstats.YMAX=250
lavfi.signalstats.SATAVG=40.5
frame:2    pts:1204   pts_time:1204.5
lavfi.signalstats.YMIN=20
";

    #[test]
    fn reads_one_look_per_keyframe() {
        let looks = read_looks(PRINTED);

        assert_eq!(looks.len(), 2);
        assert!((looks[0].seconds - 1200.5).abs() < f64::EPSILON);
        assert!((looks[0].black_percent - 99.0).abs() < f32::EPSILON);
        assert!((looks[0].y_max - 235.0).abs() < f32::EPSILON);
        assert!((looks[1].saturation - 40.5).abs() < f32::EPSILON);
    }

    #[test]
    fn leaves_out_a_keyframe_missing_a_figure() {
        assert!(read_looks(PRINTED).iter().all(|look| look.seconds < 1204.0));
    }

    #[test]
    fn decodes_only_keyframes_from_where_it_was_asked_to_start() {
        let arguments = scan_arguments(&CreditFramesRequest {
            input_path: "/media/film.mkv".to_owned(),
            start_seconds: 1200.0,
            duration_seconds: None,
            every_frame: false,
            correlation_id: None,
        });
        let joined = arguments.join(" ");

        assert!(joined.contains("-skip_frame nokey -ss 1200.000 -copyts -i /media/film.mkv"));
        assert!(
            joined.contains("select='eq(key\\,1)',format=yuv420p,blackframe=amount=0:threshold=28")
        );
        assert!(joined.contains("signalstats"));
    }

    #[tokio::test]
    async fn calls_a_file_ffmpeg_could_not_read_an_error_rather_than_empty() {
        use super::{read_credit_frames, CreditFramesError};

        let failed = read_credit_frames(
            "false",
            &CreditFramesRequest {
                input_path: "/media/missing.mkv".to_owned(),
                start_seconds: 0.0,
                duration_seconds: None,
                every_frame: false,
                correlation_id: None,
            },
        )
        .await;

        assert!(matches!(failed, Err(CreditFramesError::Unreadable(_))));
    }

    #[test]
    fn decodes_every_frame_of_a_short_stretch_when_asked() {
        let arguments = scan_arguments(&CreditFramesRequest {
            input_path: "/media/film.mkv".to_owned(),
            start_seconds: 2106.25,
            duration_seconds: Some(10.5),
            every_frame: true,
            correlation_id: None,
        });
        let joined = arguments.join(" ");

        assert!(!joined.contains("skip_frame"));
        assert!(!joined.contains("select="));
        assert!(joined.contains("-ss 2106.250 -copyts -t 10.500 -i /media/film.mkv"));
    }
}
