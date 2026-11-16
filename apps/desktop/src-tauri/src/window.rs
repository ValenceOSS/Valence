//! The window Valence is drawn in.
//!
//! The frame is hidden so the window reads as an application rather than a browser: on macOS the
//! traffic lights sit inset over the bar the page draws, and elsewhere the page draws minimise,
//! maximise and close itself. The window is shown once its page has loaded, so it never arrives
//! blank. The developer tools open only in a debug build, or one started asking for them.

pub mod navigation;

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use std::time::Duration;

use serde::Serialize;
use tauri::webview::{NewWindowResponse, PageLoadEvent};
use tauri::{
    AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_opener::OpenerExt;

use crate::say::say;
use navigation::{going, opens_outside, stays_in_the_application, Going};

/// The main window's label.
pub const MAIN: &str = "main";

/// The event a page hears when its window's frame changes.
pub const FRAME_CHANGED: &str = "valence:frame-changed";

const WIDTH: f64 = 1280.0;

const HEIGHT: f64 = 800.0;

const MINIMUM_WIDTH: f64 = 880.0;

const MINIMUM_HEIGHT: f64 = 560.0;

const SHOWN_AT_THE_LATEST: Duration = Duration::from_secs(10);

const WEBVIEW_DATA: &str = "webview";

/// Whether a window is maximised or full screen, for the controls the page draws for them.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowFrame {
    /// Whether the window is maximised.
    pub is_maximised: bool,
    /// Whether the window is full screen.
    pub is_full_screen: bool,
}

/// What the windows share: each one's frame as last told, and whether the system's window
/// controls are showing.
pub struct Windows {
    are_controls_shown: AtomicBool,
    frames: Mutex<HashMap<String, WindowFrame>>,
}

impl Default for Windows {
    fn default() -> Self {
        Self {
            are_controls_shown: AtomicBool::new(true),
            frames: Mutex::new(HashMap::new()),
        }
    }
}

/// Locks `mutex`, carrying on with what it holds even where a thread panicked holding it.
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

/// The frame of `window` now.
#[must_use]
pub fn frame_of(window: &WebviewWindow) -> WindowFrame {
    WindowFrame {
        is_maximised: window.is_maximized().unwrap_or(false),
        is_full_screen: window.is_fullscreen().unwrap_or(false),
    }
}

/// What the main window's frame is now, for the page that draws its controls.
#[must_use]
pub fn frame_now(app: &AppHandle) -> WindowFrame {
    app.get_webview_window(MAIN)
        .map(|window| frame_of(&window))
        .unwrap_or_default()
}

/// Opens `url` in the system's own app for it.
fn open_outside(app: &AppHandle, url: &str) {
    if let Err(error) = app.opener().open_url(url, None::<&str>) {
        eprintln!("Valence could not open {url}: {error}");
    }
}

/// Decides whether the window may go to `url`, opening it elsewhere where it may not, and letting
/// the screen sleep when the window loads another of its own pages.
fn decide(app: &AppHandle, url: &tauri::Url) -> bool {
    let origin = crate::serve::origin(app);

    match going(
        url,
        &origin,
        crate::preferences::server_address(app).as_deref(),
    ) {
        Going::Stays => {
            if stays_in_the_application(url, &origin) {
                crate::screen::let_go(app);
            }

            true
        }
        Going::Outside(page) => {
            open_outside(app, &page);
            false
        }
        Going::Nowhere => false,
    }
}

/// Keeps the webview's own data beside the app's other files, where the platform allows.
fn with_our_data(
    builder: WebviewWindowBuilder<'_, tauri::Wry, AppHandle>,
) -> WebviewWindowBuilder<'_, tauri::Wry, AppHandle> {
    if cfg!(target_os = "macos") {
        builder
    } else {
        builder.data_directory(crate::paths::user_data().join(WEBVIEW_DATA))
    }
}

/// A window onto `path` of the application, with the navigation rules every window keeps.
pub fn a_window_onto<'a>(
    app: &'a AppHandle,
    label: &str,
    path: &str,
) -> tauri::Result<WebviewWindowBuilder<'a, tauri::Wry, AppHandle>> {
    let url = crate::serve::entry(app, path).ok_or_else(|| {
        tauri::Error::Io(std::io::Error::other("the loopback server is not running"))
    })?;
    let navigating = app.clone();
    let opening = app.clone();
    let builder = WebviewWindowBuilder::new(app, label, WebviewUrl::External(url))
        .title(say("common.valence", &[]))
        .visible(false)
        .background_color(tauri::window::Color(0, 0, 0, 255))
        .devtools(crate::debugging::may_be_inspected())
        .disable_drag_drop_handler()
        .on_navigation(move |url| decide(&navigating, url))
        .on_new_window(move |url, _features| {
            if opens_outside(url.as_str()) {
                open_outside(&opening, url.as_str());
            }

            NewWindowResponse::Deny
        });

    Ok(with_our_data(builder))
}

/// Shows the main window, once only.
fn reveal(window: &WebviewWindow, revealed: &AtomicBool) {
    if !revealed.swap(true, Ordering::SeqCst) {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Tells the page its window's frame where it changed, and puts macOS's traffic lights back as
/// the page asked for them once the window leaves full screen.
fn tell_the_frame(app: &AppHandle, window: &WebviewWindow) {
    let Some(windows) = app.try_state::<Windows>() else {
        return;
    };
    let now = frame_of(window);
    let before = lock(&windows.frames).insert(window.label().to_owned(), now);

    if before == Some(now) {
        return;
    }

    if before.is_some_and(|before| before.is_full_screen) && !now.is_full_screen {
        show_the_traffic_lights(window, windows.are_controls_shown.load(Ordering::SeqCst));
    }

    if let Err(error) = app.emit_to(window.label(), FRAME_CHANGED, now) {
        eprintln!("Valence could not tell the page its frame: {error}");
    }
}

/// Opens the main window, showing the application, hidden until its page has loaded.
///
/// # Errors
///
/// When the window cannot be made.
pub fn open_the_main_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let revealed = Arc::new(AtomicBool::new(false));
    let loaded = Arc::clone(&revealed);
    let builder = a_window_onto(app, MAIN, "/")?
        .inner_size(WIDTH, HEIGHT)
        .min_inner_size(MINIMUM_WIDTH, MINIMUM_HEIGHT)
        .on_page_load(move |window, payload| {
            if payload.event() == PageLoadEvent::Finished {
                reveal(&window, &loaded);
            }
        });

    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        .traffic_light_position(tauri::LogicalPosition::new(20.0, 14.0));

    #[cfg(not(target_os = "macos"))]
    let builder = builder.decorations(false);

    let window = builder.build()?;

    crate::playback::tune(&window);

    if let Some(windows) = app.try_state::<Windows>() {
        windows.are_controls_shown.store(true, Ordering::SeqCst);
        lock(&windows.frames).insert(MAIN.to_owned(), frame_of(&window));
    }

    let watching = app.clone();
    let watched = window.clone();

    window.on_window_event(move |event| match event {
        WindowEvent::Resized(_) => tell_the_frame(&watching, &watched),
        WindowEvent::Destroyed => {
            crate::screen::let_go(&watching);

            if let Some(windows) = watching.try_state::<Windows>() {
                lock(&windows.frames).remove(MAIN);
            }
        }
        _ => {}
    });

    let shown_anyway = window.clone();

    crate::runtime::spawn(async move {
        tokio::time::sleep(SHOWN_AT_THE_LATEST).await;
        reveal(&shown_anyway, &revealed);
    });

    Ok(window)
}

/// Shows macOS's traffic lights, or hides them; elsewhere the page draws its own controls.
#[cfg(target_os = "macos")]
fn show_the_traffic_lights(window: &WebviewWindow, is_shown: bool) {
    use objc2_app_kit::{NSWindow, NSWindowButton};

    let showing = window.clone();
    let _ = window.run_on_main_thread(move || {
        let Ok(pointer) = showing.ns_window() else {
            return;
        };

        if pointer.is_null() {
            return;
        }

        #[allow(
            unsafe_code,
            reason = "AppKit's window is reached only through its pointer"
        )]
        // SAFETY: Tauri hands over its own live NSWindow, used here on the main thread only.
        let ns_window: &NSWindow = unsafe { &*pointer.cast::<NSWindow>() };

        for button in [
            NSWindowButton::CloseButton,
            NSWindowButton::MiniaturizeButton,
            NSWindowButton::ZoomButton,
        ] {
            if let Some(button) = ns_window.standardWindowButton(button) {
                button.setHidden(!is_shown);
            }
        }
    });
}

/// Shows macOS's traffic lights, or hides them; elsewhere the page draws its own controls.
#[cfg(not(target_os = "macos"))]
fn show_the_traffic_lights(window: &WebviewWindow, is_shown: bool) {
    let _ = (window, is_shown);
}

/// Shows the application again from its first page, in the main window, opening one if there is
/// none.
pub fn show_the_application(app: &AppHandle) {
    let Some(window) = app.get_webview_window(MAIN) else {
        if let Err(error) = open_the_main_window(app) {
            eprintln!("Valence could not open its window: {error}");
        }

        return;
    };

    if let Some(url) = crate::serve::entry(app, "/") {
        if let Err(error) = window.navigate(url) {
            eprintln!("Valence could not show the application: {error}");
        }
    }
}

/// Brings the main window forward for somebody who opened Valence again, opening one where every
/// one was closed.
#[cfg_attr(
    all(debug_assertions, not(target_os = "macos")),
    allow(
        dead_code,
        reason = "a debug build shares its files with the installed app, so runs beside it"
    )
)]
pub fn bring_forward(app: &AppHandle) {
    let Some(window) = app.get_webview_window(MAIN) else {
        if let Err(error) = open_the_main_window(app) {
            eprintln!("Valence could not open its window: {error}");
        }

        return;
    };

    if window.is_minimized().unwrap_or(false) {
        let _ = window.unminimize();
    }

    let _ = window.show();
    let _ = window.set_focus();
}

/// Shows the application again from its first page.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn go_to_the_server(app: AppHandle) {
    show_the_application(&app);
}

/// Forgets the chosen server and asks which one again.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn change_server(app: AppHandle) {
    crate::preferences::forget_server_address(&app);
    crate::discovery::look_again(&app);
    show_the_application(&app);
}

/// Minimises the window.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn frame_minimise(window: WebviewWindow) {
    let _ = window.minimize();
}

/// Maximises the window, or restores it when it is maximised.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn frame_maximise(window: WebviewWindow) {
    if window.is_maximized().unwrap_or(false) {
        let _ = window.unmaximize();
    } else {
        let _ = window.maximize();
    }
}

/// Closes the window.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn frame_close(window: WebviewWindow) {
    let _ = window.close();
}

/// Shows or hides the system's window controls, as the player asks.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn show_the_window_controls(app: AppHandle, window: WebviewWindow, is_shown: bool) {
    if let Some(windows) = app.try_state::<Windows>() {
        windows.are_controls_shown.store(is_shown, Ordering::SeqCst);
    }

    show_the_traffic_lights(&window, is_shown);
}

/// Gets ready to keep track of the windows, before anything else asks to hear about them.
pub fn prepare(app: &tauri::App) {
    app.manage(Windows::default());
}

/// Opens the main window.
///
/// # Errors
///
/// When the window cannot be made.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    open_the_main_window(app.handle())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn says_its_frame_as_the_page_reads_it() {
        let said = serde_json::to_value(WindowFrame {
            is_maximised: true,
            is_full_screen: false,
        })
        .expect("JSON");

        assert_eq!(
            said,
            serde_json::json!({ "isMaximised": true, "isFullScreen": false })
        );
    }

    #[test]
    fn shows_the_system_controls_until_told_otherwise() {
        assert!(Windows::default().are_controls_shown.load(Ordering::SeqCst));
    }
}
