//! The unread count on the app's icon, and asking to notify.
//!
//! The dock's own badge on macOS and the launcher's on Linux; on Windows, which has no badge to
//! give a count to, the picture the page drew laid over the corner of the taskbar button, with
//! words for a screen reader to say.

use serde_json::Value;
use tauri::{AppHandle, Manager, WebviewWindow};

/// What the page's drawn count must start with.
const A_PNG: &str = "data:image/png;base64,";

/// The longest drawn count taken.
const LONGEST_PICTURE: usize = 200_000;

/// The count the page sent: a whole number of nought or more, or nought where it is anything else.
#[must_use]
pub fn the_count(said: &Value) -> u64 {
    said.as_u64()
        .or_else(|| {
            said.as_f64()
                .filter(|count| {
                    count.fract() == 0.0 && *count >= 0.0 && *count < 9_007_199_254_740_992.0
                })
                .map(|count| {
                    #[allow(
                        clippy::cast_possible_truncation,
                        clippy::cast_sign_loss,
                        reason = "a whole number from nought to 2^53 is exactly a u64"
                    )]
                    let whole = count as u64;

                    whole
                })
        })
        .unwrap_or(0)
}

/// The picture the page drew: a PNG data address no longer than one needs to be, or nothing.
#[must_use]
pub fn the_picture(said: &Value) -> Option<&str> {
    said.as_str().filter(|picture| {
        picture.starts_with(A_PNG) && picture.encode_utf16().count() <= LONGEST_PICTURE
    })
}

/// The picture's PNG bytes, from its data address.
#[cfg_attr(
    not(windows),
    allow(dead_code, reason = "only Windows draws the page's picture")
)]
fn the_png(picture: &str) -> Option<Vec<u8>> {
    use base64::Engine;

    base64::engine::general_purpose::STANDARD
        .decode(picture.strip_prefix(A_PNG)?)
        .ok()
}

/// Lays a picture over the window's taskbar button, or takes it away, with words to say for it.
#[cfg(windows)]
#[allow(
    unsafe_code,
    reason = "the taskbar is only reachable through COM, and every call into it is unsafe"
)]
fn lay_over(window: &WebviewWindow, png: Option<Vec<u8>>, description: String) {
    use windows::core::HSTRING;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Com::{CoCreateInstance, CLSCTX_SERVER};
    use windows::Win32::UI::Shell::{ITaskbarList3, TaskbarList};
    use windows::Win32::UI::WindowsAndMessaging::{CreateIcon, DestroyIcon};

    let Ok(handle) = window.hwnd() else {
        return;
    };
    let handle = handle.0 as usize;
    let picture = png.and_then(|png| tauri::image::Image::from_bytes(&png).ok());
    let drawn = picture.map(|picture| {
        let mut bgra = picture.rgba().to_vec();
        let mut mask = Vec::with_capacity(bgra.len() / 4);

        for pixel in bgra.chunks_exact_mut(4) {
            mask.push(pixel[3].wrapping_sub(u8::MAX));
            pixel.swap(0, 2);
        }

        (bgra, mask, picture.width(), picture.height())
    });

    let _ = window.run_on_main_thread(move || {
        let window = HWND(handle as *mut core::ffi::c_void);
        let icon = drawn.and_then(|(bgra, mask, width, height)| {
            // SAFETY: the mask and the colours are one entry and four bytes a pixel for every pixel of a picture of this size, alive for the call.
            unsafe {
                CreateIcon(
                    None,
                    i32::try_from(width).ok()?,
                    i32::try_from(height).ok()?,
                    1,
                    32,
                    mask.as_ptr(),
                    bgra.as_ptr(),
                )
            }
            .ok()
        });
        // SAFETY: called on the window's own thread, where COM is already set up for it.
        let taskbar: Option<ITaskbarList3> =
            unsafe { CoCreateInstance(&TaskbarList, None, CLSCTX_SERVER) }.ok();

        if let Some(taskbar) = taskbar {
            let words = HSTRING::from(description);

            // SAFETY: the window is the app's own, the icon is ours or none, and the words live for the call; the taskbar keeps a copy of the icon.
            let _ = unsafe { taskbar.SetOverlayIcon(window, icon.unwrap_or_default(), &words) };
        }

        if let Some(icon) = icon {
            // SAFETY: the icon was made above and is destroyed once, after the taskbar copied it.
            let _ = unsafe { DestroyIcon(icon) };
        }
    });
}

/// Shows how many notifications are unread on Valence's icon.
fn show_the_unread_count(window: &WebviewWindow, count: u64, picture: Option<&str>) {
    #[cfg(windows)]
    {
        let png = picture.filter(|_| count > 0).and_then(the_png);
        let description = if count == 0 {
            String::new()
        } else {
            crate::say::say(
                "desktop.main.showTheUnreadCount.countUnread",
                &[("count", &count.to_string())],
            )
        };

        lay_over(window, png, description);
    }

    #[cfg(not(windows))]
    {
        let _ = picture;
        let _ = window.set_badge_count(i64::try_from(count).ok().filter(|count| *count > 0));
    }
}

/// Shows the unread count on the app's icon, as the page counted and drew it.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn set_unread_badge(window: WebviewWindow, count: Value, picture: Value) {
    show_the_unread_count(&window, the_count(&count), the_picture(&picture));
}

/// Has macOS ask whether Valence may send notifications the first time it opens, rather than the
/// first time something arrives, which can be days later and easy to miss. Other systems need no
/// asking, and are left alone.
fn ask_to_notify(app: &AppHandle) {
    if !cfg!(target_os = "macos") {
        return;
    }

    if let Some(notifications) =
        app.try_state::<tauri_plugin_notification::Notification<tauri::Wry>>()
    {
        let _ = notifications.request_permission();
    }
}

/// Gets this part of the app ready, before the window opens: notifications, which the page sends
/// through Tauri's plugin, and asking to send them.
///
/// # Errors
///
/// When Tauri will not take the notification plugin.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if app
        .try_state::<tauri_plugin_notification::Notification<tauri::Wry>>()
        .is_none()
    {
        app.handle().plugin(tauri_plugin_notification::init())?;
    }

    ask_to_notify(app.handle());

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{the_count, the_picture, the_png};
    use serde_json::json;

    #[test]
    fn reads_a_count_of_nought_or_more_and_nought_for_anything_else() {
        assert_eq!(the_count(&json!(3)), 3);
        assert_eq!(the_count(&json!(3.0)), 3);
        assert_eq!(the_count(&json!(0)), 0);
        assert_eq!(the_count(&json!(-1)), 0);
        assert_eq!(the_count(&json!(1.5)), 0);
        assert_eq!(the_count(&json!("3")), 0);
        assert_eq!(the_count(&json!(null)), 0);
    }

    #[test]
    fn takes_only_a_png_the_page_drew() {
        assert_eq!(
            the_picture(&json!("data:image/png;base64,AAAA")),
            Some("data:image/png;base64,AAAA")
        );
        assert_eq!(the_picture(&json!("data:image/jpeg;base64,AAAA")), None);
        assert_eq!(the_picture(&json!("https://example.com/a.png")), None);
        assert_eq!(the_picture(&json!(null)), None);
        assert_eq!(the_picture(&json!(7)), None);
    }

    #[test]
    fn refuses_a_picture_far_larger_than_a_count() {
        let largest = format!("data:image/png;base64,{}", "A".repeat(200_000 - 22));
        let larger = format!("{largest}A");

        assert!(the_picture(&json!(largest)).is_some());
        assert_eq!(the_picture(&json!(larger)), None);
    }

    #[test]
    fn reads_the_png_out_of_its_address() {
        assert_eq!(
            the_png("data:image/png;base64,iVBORw=="),
            Some(vec![0x89, 0x50, 0x4e, 0x47])
        );
        assert_eq!(the_png("data:image/png;base64,???"), None);
    }
}
