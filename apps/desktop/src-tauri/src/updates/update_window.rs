//! The small window that stands in for the main one while an update installs.

use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex, PoisonError};
use tauri::webview::PageLoadEvent;
use tauri::{AppHandle, PhysicalPosition, WebviewWindow};
use tokio::sync::oneshot;

/// The window's width, in logical pixels.
const WIDTH: f64 = 300.0;

/// The window's height, in logical pixels.
const HEIGHT: f64 = 340.0;

/// Tells one update window from the next.
static OPENED: AtomicU32 = AtomicU32::new(0);

/// Whether this process is about to quit for the installer, or has just been installed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Step {
    /// About to quit for the installer.
    Installing,
    /// Just installed.
    Finishing,
}

impl Step {
    /// The word the page reads it by.
    #[must_use]
    pub const fn said(self) -> &'static str {
        match self {
            Self::Installing => "installing",
            Self::Finishing => "finishing",
        }
    }
}

/// The page the window shows, for a step and a version.
#[must_use]
pub fn the_page(step: Step, version: &str) -> String {
    let mut page = String::from("/update.html?");

    page.push_str(
        &tauri::Url::parse("http://127.0.0.1/")
            .map(|mut url| {
                url.query_pairs_mut()
                    .append_pair("step", step.said())
                    .append_pair("version", version);
                url.query().unwrap_or_default().to_owned()
            })
            .unwrap_or_default(),
    );

    page
}

/// Where a window of a size sits in the true middle of a work area, in physical pixels, worked out
/// here rather than left to the system, since macOS centres a window a third of the way down.
#[must_use]
pub fn in_the_middle(
    work_area: (i32, i32, u32, u32),
    scale_factor: f64,
    size: (f64, f64),
) -> PhysicalPosition<i32> {
    let (x, y, width, height) = work_area;
    let across = (f64::from(width) - size.0 * scale_factor) / 2.0;
    let down = (f64::from(height) - size.1 * scale_factor) / 2.0;

    PhysicalPosition::new(
        x.saturating_add(rounded(across)),
        y.saturating_add(rounded(down)),
    )
}

/// A distance in whole pixels.
#[allow(
    clippy::cast_possible_truncation,
    reason = "a distance across a screen is far inside an i32, and is clamped to one besides"
)]
fn rounded(distance: f64) -> i32 {
    distance
        .round()
        .clamp(f64::from(i32::MIN), f64::from(i32::MAX)) as i32
}

/// Opens the small window that stands in for the main one while an update installs, and waits
/// until it is on screen.
///
/// Framed by nothing and fixed in size, since there is nothing in it to resize or close: it lasts as
/// long as the install does and goes when this process does. It sits in the true middle of the
/// screen the main window was on, or the main screen where there is no main window yet. It is held
/// back until its page has drawn, so it never arrives blank, and this settles only then.
pub async fn open_the_update_window(
    app: &AppHandle,
    step: Step,
    version: &str,
    over: Option<&WebviewWindow>,
) -> Option<WebviewWindow> {
    let monitor = match over {
        Some(window) => window.current_monitor().ok().flatten(),
        None => None,
    }
    .or_else(|| app.primary_monitor().ok().flatten());
    let (shown, showing) = oneshot::channel::<()>();
    let shown = Arc::new(Mutex::new(Some(shown)));
    let label = format!("update-{}", OPENED.fetch_add(1, Ordering::Relaxed));

    let window = crate::window::a_window_onto(app, &label, &the_page(step, version))
        .ok()?
        .inner_size(WIDTH, HEIGHT)
        .decorations(false)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .visible(false)
        .focused(true)
        .on_page_load(move |window, payload| {
            if payload.event() == PageLoadEvent::Finished && payload.url().path() == "/update.html"
            {
                let _ = window.show();

                if let Some(shown) = shown.lock().unwrap_or_else(PoisonError::into_inner).take() {
                    let _ = shown.send(());
                }
            }
        })
        .build()
        .ok()?;

    if let Some(monitor) = monitor {
        let area = monitor.work_area();

        let _ = window.set_position(in_the_middle(
            (
                area.position.x,
                area.position.y,
                area.size.width,
                area.size.height,
            ),
            monitor.scale_factor(),
            (WIDTH, HEIGHT),
        ));
    }

    showing.await.ok()?;

    Some(window)
}

#[cfg(test)]
mod tests {
    use super::{in_the_middle, the_page, Step};
    use tauri::PhysicalPosition;

    #[test]
    fn opens_the_page_for_the_step_it_is_at_with_the_version_it_is_installing() {
        assert_eq!(
            the_page(Step::Installing, "1.5.0"),
            "/update.html?step=installing&version=1.5.0"
        );
        assert_eq!(
            the_page(Step::Finishing, "1.5.0-dev.2"),
            "/update.html?step=finishing&version=1.5.0-dev.2"
        );
    }

    #[test]
    fn sits_in_the_true_middle_of_the_screen() {
        assert_eq!(
            in_the_middle((0, 0, 1920, 1040), 1.0, (300.0, 340.0)),
            PhysicalPosition::new(810, 350)
        );
    }

    #[test]
    fn opens_on_the_screen_the_main_window_was_on_at_its_scale() {
        assert_eq!(
            in_the_middle((1920, 25, 2560, 1415), 2.0, (300.0, 340.0)),
            PhysicalPosition::new(2900, 393)
        );
    }
}
