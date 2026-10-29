//! Where the picture sits inside a film's frame, for a player fitting it to a screen.
//!
//! A widescreen film on a UHD Blu-ray is kept in a sixteen-by-nine frame with
//! black bars above and below it. A phone wider than sixteen by nine fitted that
//! frame and drew bars down both sides as well as the ones in the picture, so a
//! film was a small box with black on every side however the player was laid
//! out. Told where the picture is, the player fits that instead and lets the
//! bars fall off the screen.
//!
//! Found with the same look for bars a preview is cut with, once per file, and
//! kept beside the other artefacts read for as long as the film is in the
//! library. Written into the session for the player to ask for, as fractions
//! of the frame, so it holds for every size the film is sent at.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::bars::Bars;

/// What a session calls the file a player reads where the picture is from.
pub const PICTURE_AREA_NAME: &str = "picture.json";

const DIRECTORY: &str = "pictures";

/// How far into a film it is looked at for bars, as a share of its length, which is past any
/// studio logo or dark opening.
const LOOKED_AT_FROM: f64 = 0.3;

/// The picture inside a frame, each edge a fraction of the frame's width or height.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PictureArea {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl PictureArea {
    /// A picture that fills its frame.
    pub const WHOLE: Self = Self {
        x: 0.0,
        y: 0.0,
        width: 1.0,
        height: 1.0,
    };

    /// The picture inside a frame of this size, where it has bars, or the whole frame.
    #[must_use]
    pub fn of(bars: Option<Bars>, frame: (u32, u32)) -> Self {
        let (Some(bars), (width, height)) = (bars, frame) else {
            return Self::WHOLE;
        };

        if width == 0 || height == 0 {
            return Self::WHOLE;
        }

        let across = f64::from(width);
        let down = f64::from(height);

        Self {
            x: f64::from(bars.x) / across,
            y: f64::from(bars.y) / down,
            width: f64::from(bars.width) / across,
            height: f64::from(bars.height) / down,
        }
    }
}

/// Where a file's picture area would be kept.
fn at(artefact_root: &Path, address: &str) -> PathBuf {
    artefact_root
        .join(DIRECTORY)
        .join(format!("{address}.json"))
}

/// The picture area already found for a file, where it has been.
async fn kept(artefact_root: &Path, address: &str) -> Option<PictureArea> {
    let held = tokio::fs::read_to_string(at(artefact_root, address))
        .await
        .ok()?;

    serde_json::from_str(&held).ok()
}

/// Keeps a file's picture area, through a neighbouring name so it is never read half written.
async fn keep(artefact_root: &Path, address: &str, area: PictureArea) {
    let Ok(payload) = serde_json::to_vec(&area) else {
        return;
    };
    let kept = at(artefact_root, address);
    let partial = kept.with_extension("partial");

    if tokio::fs::create_dir_all(artefact_root.join(DIRECTORY))
        .await
        .is_ok()
        && tokio::fs::write(&partial, payload).await.is_ok()
    {
        let _ = tokio::fs::rename(&partial, &kept).await;
    }
}

/// Looks at a film for bars, far enough in to be past its opening.
async fn measured(
    ffmpeg: &str,
    input: &str,
    frame: (u32, u32),
    duration_seconds: f64,
) -> PictureArea {
    let from = if duration_seconds.is_finite() && duration_seconds > 0.0 {
        (duration_seconds * LOOKED_AT_FROM).floor()
    } else {
        0.0
    };
    #[allow(
        clippy::cast_possible_truncation,
        clippy::cast_sign_loss,
        reason = "a whole number of seconds into a film, never negative"
    )]
    let from = from as u32;

    PictureArea::of(
        crate::bars::measure(ffmpeg, input, from, frame).await,
        frame,
    )
}

/// Finds where a film's picture sits in its frame, once per file, and writes it into a session.
///
/// Run beside the session rather than before it, so nobody waits for it: the player draws the
/// whole frame until it is there.
pub async fn write_for(
    ffmpeg: &str,
    artefact_root: &Path,
    input: &str,
    frame: (u32, u32),
    duration_seconds: f64,
    directory: &Path,
) {
    let address = crate::source_address::of(Path::new(input)).await;
    let found = match address.as_deref() {
        Some(address) => kept(artefact_root, address).await,
        None => None,
    };
    let area = if let Some(area) = found {
        area
    } else {
        let area = measured(ffmpeg, input, frame, duration_seconds).await;

        if let Some(address) = address.as_deref() {
            keep(artefact_root, address, area).await;
        }

        area
    };

    if let Ok(payload) = serde_json::to_vec(&area) {
        let partial = directory.join(format!("{PICTURE_AREA_NAME}.partial"));

        if tokio::fs::write(&partial, payload).await.is_ok() {
            let _ = tokio::fs::rename(&partial, directory.join(PICTURE_AREA_NAME)).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{PictureArea, PICTURE_AREA_NAME};
    use crate::bars::Bars;

    #[test]
    fn finds_a_wide_film_inside_a_sixteen_by_nine_frame() {
        let area = PictureArea::of(
            Some(Bars {
                width: 3840,
                height: 1608,
                x: 0,
                y: 276,
            }),
            (3840, 2160),
        );

        assert!((area.y - 0.127_777).abs() < 1e-5);
        assert!((area.height - 0.744_444).abs() < 1e-5);
        assert!((area.width - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn takes_the_whole_frame_where_there_are_no_bars() {
        assert_eq!(PictureArea::of(None, (1920, 1080)), PictureArea::WHOLE);
    }

    #[test]
    fn takes_the_whole_frame_of_no_size() {
        let bars = Bars {
            width: 10,
            height: 10,
            x: 0,
            y: 0,
        };

        assert_eq!(PictureArea::of(Some(bars), (0, 0)), PictureArea::WHOLE);
    }

    #[test]
    fn is_written_as_fractions_a_player_reads() {
        let written = serde_json::to_string(&PictureArea::WHOLE).expect("serialises");

        assert_eq!(written, r#"{"x":0.0,"y":0.0,"width":1.0,"height":1.0}"#);
        assert_eq!(PICTURE_AREA_NAME, "picture.json");
    }
}
