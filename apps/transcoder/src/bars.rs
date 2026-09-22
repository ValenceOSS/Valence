//! The black bars a film was stored with, so a preview can be cut without them.
//!
//! A widescreen film is often kept in a sixteen-by-nine frame, with black above
//! and below the picture rather than a frame the shape of the picture. On a
//! television that is invisible: the bars fall where the screen would have been
//! black anyway. On a card that is taller than it is wide, a clip is scaled to
//! cover it and cropped at the sides, and the bars stay in view as black bands
//! across the top and bottom of the artwork.
//!
//! So before a preview is made, the stretch of the film it is cut from is looked
//! at for bars, and where there are some they are cropped off before anything
//! else is done to the picture. Only keyframes are decoded, which is a small
//! fraction of the work, and the answer is the outer edge of every picture seen
//! rather than one frame's, so a dark scene does not crop into the film.

use tokio::process::Command;

use crate::steps_aside::steps_aside;

/// How long a stretch of the film is looked at, in seconds.
const LOOKED_AT_FOR: u32 = 90;

/// How dark counts as a bar, as a fraction of full brightness, which reads the
/// same whatever the film's bit depth.
const DARK_ENOUGH: &str = "0.094";

/// The smallest share of the frame a bar has to take before it is worth
/// cropping, so a line or two of noise at the edge is left alone.
const WORTH_A_FIFTIETH: u32 = 50;

/// The most a crop may take away. Anything more is a film that was dark for the
/// whole stretch looked at, not a film with bars.
const AT_MOST_HALF: u32 = 2;

/// The picture inside the frame, in pixels: its size and where it starts.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Bars {
    pub width: u32,
    pub height: u32,
    pub x: u32,
    pub y: u32,
}

impl Bars {
    /// The ffmpeg filter that keeps the picture and drops the bars.
    #[must_use]
    pub fn filter(self) -> String {
        format!("crop={}:{}:{}:{}", self.width, self.height, self.x, self.y)
    }
}

/// The ffmpeg arguments that look at a stretch of a film for bars and write
/// nothing.
///
/// `reset=0` makes each report the edge of every picture seen so far, so the
/// last one is the answer for the whole stretch.
#[must_use]
pub fn looking_arguments(input: &str, start_seconds: u32) -> Vec<String> {
    vec![
        "-hide_banner".to_owned(),
        "-nostdin".to_owned(),
        "-loglevel".to_owned(),
        "info".to_owned(),
        "-skip_frame".to_owned(),
        "nokey".to_owned(),
        "-ss".to_owned(),
        start_seconds.to_string(),
        "-i".to_owned(),
        input.to_owned(),
        "-t".to_owned(),
        LOOKED_AT_FOR.to_string(),
        "-map".to_owned(),
        "0:v:0".to_owned(),
        "-vf".to_owned(),
        format!("cropdetect=limit={DARK_ENOUGH}:round=2:reset=0"),
        "-an".to_owned(),
        "-f".to_owned(),
        "null".to_owned(),
        "-".to_owned(),
    ]
}

/// The last crop ffmpeg's `cropdetect` reported, from what it wrote.
#[must_use]
pub fn last_reported(said: &str) -> Option<Bars> {
    said.rmatch_indices("crop=").find_map(|(at, marker)| {
        let rest = &said[at + marker.len()..];
        let numbers: Vec<u32> = rest
            .split(|character: char| !character.is_ascii_digit() && character != ':')
            .next()?
            .split(':')
            .map(str::parse)
            .collect::<Result<_, _>>()
            .ok()?;

        match numbers.as_slice() {
            [width, height, x, y] => Some(Bars {
                width: *width,
                height: *height,
                x: *x,
                y: *y,
            }),
            _ => None,
        }
    })
}

/// Whether a crop is bars worth taking off a frame of this size.
///
/// Worth it where it takes at least a fiftieth off the height or the width, and
/// not where it would take more than half, which is a film that was simply dark.
#[must_use]
pub fn worth_cropping(bars: Bars, frame: (u32, u32)) -> Option<Bars> {
    let (width, height) = frame;
    let is_sane = bars.width > 0
        && bars.height > 0
        && bars.x + bars.width <= width
        && bars.y + bars.height <= height
        && bars.width >= width / AT_MOST_HALF
        && bars.height >= height / AT_MOST_HALF;
    let is_worth_it = height.saturating_sub(bars.height) >= height / WORTH_A_FIFTIETH
        || width.saturating_sub(bars.width) >= width / WORTH_A_FIFTIETH;

    (is_sane && is_worth_it).then_some(bars)
}

/// Looks at the stretch of a film a preview is cut from, and answers with the
/// picture inside its bars where it has some worth cropping.
///
/// Nothing is lost where the look fails: the preview is made as it always was.
pub async fn measure(
    ffmpeg: &str,
    input: &str,
    start_seconds: u32,
    frame: (u32, u32),
) -> Option<Bars> {
    let outcome = steps_aside(&mut Command::new(ffmpeg))
        .args(looking_arguments(input, start_seconds))
        .kill_on_drop(true)
        .output()
        .await
        .ok()?;

    last_reported(&String::from_utf8_lossy(&outcome.stderr))
        .and_then(|bars| worth_cropping(bars, frame))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A 2.39:1 film kept in a 1080p frame, as cropdetect reports it.
    const LETTERBOXED: &str = "\
[Parsed_cropdetect_0 @ 0x1] x1:0 x2:1919 y1:138 y2:941 w:1920 h:800 x:0 y:140 pts:0 t:0.000000 limit:0.094000 crop=1920:800:0:140
[Parsed_cropdetect_0 @ 0x1] x1:0 x2:1919 y1:138 y2:941 w:1920 h:804 x:0 y:138 pts:48 t:2.000000 limit:0.094000 crop=1920:804:0:138
";

    #[test]
    fn reads_the_last_crop_reported() {
        assert_eq!(
            last_reported(LETTERBOXED),
            Some(Bars {
                width: 1920,
                height: 804,
                x: 0,
                y: 138,
            })
        );
    }

    #[test]
    fn reads_nothing_where_nothing_was_reported() {
        assert_eq!(last_reported("Stream #0:0: Video: hevc"), None);
    }

    #[test]
    fn crops_bars_that_take_a_real_share_of_the_frame() {
        let bars = Bars {
            width: 1920,
            height: 804,
            x: 0,
            y: 138,
        };

        assert_eq!(worth_cropping(bars, (1920, 1080)), Some(bars));
    }

    #[test]
    fn leaves_a_frame_with_no_more_than_a_line_of_noise_alone() {
        let bars = Bars {
            width: 1920,
            height: 1076,
            x: 0,
            y: 2,
        };

        assert_eq!(worth_cropping(bars, (1920, 1080)), None);
    }

    #[test]
    fn leaves_a_film_that_was_only_dark_alone() {
        let bars = Bars {
            width: 1920,
            height: 300,
            x: 0,
            y: 390,
        };

        assert_eq!(worth_cropping(bars, (1920, 1080)), None);
    }

    #[test]
    fn crops_pillarbox_bars_at_the_sides_too() {
        let bars = Bars {
            width: 1440,
            height: 1080,
            x: 240,
            y: 0,
        };

        assert_eq!(worth_cropping(bars, (1920, 1080)), Some(bars));
    }

    #[test]
    fn writes_the_crop_as_a_filter() {
        let bars = Bars {
            width: 1920,
            height: 804,
            x: 0,
            y: 138,
        };

        assert_eq!(bars.filter(), "crop=1920:804:0:138");
    }

    #[test]
    fn looks_at_keyframes_only_and_writes_nothing() {
        let arguments = looking_arguments("/films/a.mkv", 600);

        assert!(arguments
            .windows(2)
            .any(|pair| pair == ["-skip_frame", "nokey"]));
        assert!(arguments.windows(2).any(|pair| pair == ["-f", "null"]));
        assert!(arguments
            .iter()
            .any(|argument| argument.starts_with("cropdetect=") && argument.contains("reset=0")));
    }
}
