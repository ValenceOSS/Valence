//! The icon in the system tray, on Windows and Linux, with the way to check for a release there.
//!
//! Neither has a menu bar to show, since the window draws its own bar, so the tray is where what
//! belongs to the application rather than to what it is showing is kept. It is there only in a
//! build that updates itself, and goes with the app.

use tauri::image::Image;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;

/// How wide and high the tray's picture is drawn: sixteen pixels, at twice the scale, so it stays
/// sharp on a high-resolution screen and is shrunk evenly on any other.
const SIZE: u32 = 32;

/// Shrinks a square-ish RGBA picture to a size, averaging each block of pixels it covers, weighed
/// by how opaque each is, so the edges of the artwork do not darken.
#[must_use]
pub fn shrink(rgba: &[u8], width: u32, height: u32, to: u32) -> Vec<u8> {
    let at = |x: u32, y: u32| -> usize {
        usize::try_from(u64::from(y) * u64::from(width) + u64::from(x)).unwrap_or(usize::MAX) * 4
    };
    let mut shrunk = Vec::with_capacity(usize::try_from(to * to * 4).unwrap_or_default());

    for row in 0..to {
        for column in 0..to {
            let (left, right) = (
                column * width / to,
                ((column + 1) * width / to).max(column * width / to + 1),
            );
            let (top, bottom) = (
                row * height / to,
                ((row + 1) * height / to).max(row * height / to + 1),
            );
            let mut sums = [0_u64; 4];
            let mut count = 0_u64;

            for y in top..bottom.min(height) {
                for x in left..right.min(width) {
                    let Some(pixel) = rgba.get(at(x, y)..at(x, y) + 4) else {
                        continue;
                    };
                    let alpha = u64::from(pixel[3]);

                    sums[0] += u64::from(pixel[0]) * alpha;
                    sums[1] += u64::from(pixel[1]) * alpha;
                    sums[2] += u64::from(pixel[2]) * alpha;
                    sums[3] += alpha;
                    count += 1;
                }
            }

            let channel = |sum: u64, of: u64| {
                u8::try_from(sum.checked_div(of).unwrap_or(0)).unwrap_or(u8::MAX)
            };

            shrunk.extend_from_slice(&[
                channel(sums[0], sums[3]),
                channel(sums[1], sums[3]),
                channel(sums[2], sums[3]),
                channel(sums[3], count),
            ]);
        }
    }

    shrunk
}

/// Puts Valence in the tray on Windows and Linux, where this build updates itself.
///
/// # Errors
///
/// When the tray's icon or menu cannot be made.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    if cfg!(target_os = "macos") || !crate::updates::can_update(handle) {
        return Ok(());
    }

    let whole = Image::from_bytes(include_bytes!("../../build/icon.png"))?;
    let picture = Image::new_owned(
        shrink(whole.rgba(), whole.width(), whole.height(), SIZE),
        SIZE,
        SIZE,
    );
    let menu = MenuBuilder::new(handle)
        .item(
            &MenuItemBuilder::with_id(
                crate::menu::CHECK_FOR_UPDATES,
                crate::say::say("common.checkForUpdates", &[]),
            )
            .build(handle)?,
        )
        .separator()
        .quit()
        .build()?;

    TrayIconBuilder::with_id("valence")
        .icon(picture)
        .tooltip(crate::say::say("common.valence", &[]))
        .menu(&menu)
        .build(handle)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::shrink;

    #[test]
    fn shrinks_a_picture_evenly() {
        let mut picture = Vec::new();

        for at in 0..16 {
            picture.extend_from_slice(if at % 2 == 0 {
                &[255, 0, 0, 255]
            } else {
                &[0, 0, 255, 255]
            });
        }

        assert_eq!(shrink(&picture, 4, 4, 1), vec![127, 0, 127, 255]);
        assert_eq!(shrink(&picture, 4, 4, 4), picture);
    }

    #[test]
    fn does_not_darken_the_edges_of_the_artwork() {
        let picture = [255, 255, 255, 255, 0, 0, 0, 0];

        assert_eq!(shrink(&picture, 2, 1, 1), vec![255, 255, 255, 127]);
    }
}
