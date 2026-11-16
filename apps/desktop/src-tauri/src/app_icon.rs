//! Which icon the app shows, and keeping it right as the theme changes.
//!
//! On Windows the taskbar shows the round icon chosen on this computer, light or dark or following
//! the system. Other systems take their icon from the app itself, so nothing changes there — except
//! the macOS dock while the app is being worked on, which shows the dev icon.

use tauri::AppHandle;

/// Which of the round Windows icons to show.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppIcon {
    /// The light one.
    Light,
    /// The dark one.
    Dark,
}

/// Which of the round Windows icons to show Valence with, from what was chosen on this computer
/// and whether the system is in dark mode: dark where chosen, or where nothing but light was chosen
/// and the system is dark.
#[must_use]
#[cfg_attr(
    not(windows),
    allow(dead_code, reason = "only Windows takes its icon from the window")
)]
pub fn app_icon_file(chosen: Option<&str>, is_system_dark: bool) -> AppIcon {
    if chosen == Some("dark") || (chosen != Some("light") && is_system_dark) {
        AppIcon::Dark
    } else {
        AppIcon::Light
    }
}

/// The icon itself, drawn into the app as it was built.
#[cfg(windows)]
fn the_picture(icon: AppIcon) -> &'static [u8] {
    match icon {
        AppIcon::Light => include_bytes!("../../build/icon-win.png"),
        AppIcon::Dark => include_bytes!("../../build/icon-win-dark.png"),
    }
}

/// Shows the chosen icon on one window's taskbar button.
#[cfg(windows)]
fn show_on(window: &tauri::Window, chosen: Option<&str>) {
    let is_system_dark = window
        .theme()
        .is_ok_and(|theme| theme == tauri::Theme::Dark);
    let icon = app_icon_file(chosen, is_system_dark);

    if let Ok(picture) = tauri::image::Image::from_bytes(the_picture(icon)) {
        let _ = window.set_icon(picture);
    }
}

/// Shows Valence on the Windows taskbar with the round icon chosen on this computer, on every
/// window it has open. Does nothing elsewhere.
pub fn show(app: &AppHandle) {
    #[cfg(windows)]
    {
        use tauri::Manager;

        let chosen = crate::preferences::read(app, crate::preferences::APP_ICON);

        for window in app.webview_windows().values() {
            show_on(&window.as_ref().window(), chosen.as_deref());
        }
    }

    #[cfg(not(windows))]
    let _ = app;
}

/// Puts the dev icon in the macOS dock while the app is being worked on, after Tauri has put the
/// app's own icon there.
///
/// A packaged Valence takes its icon from its own bundle and never needs this.
#[cfg(all(target_os = "macos", debug_assertions))]
#[allow(
    unsafe_code,
    reason = "AppKit's dock icon is only reachable through Objective-C"
)]
fn the_dock_icon() {
    use objc2::{AllocAnyThread, MainThreadMarker};
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;

    let Some(main_thread) = MainThreadMarker::new() else {
        return;
    };
    let data = NSData::with_bytes(include_bytes!("../../build/icon-dev.png"));

    if let Some(picture) = NSImage::initWithData(NSImage::alloc(), &data) {
        let app = NSApplication::sharedApplication(main_thread);

        // SAFETY: on the main thread, as the marker proves, with an image that lives as long as
        // the app holds it.
        unsafe { app.setApplicationIconImage(Some(&picture)) };
    }
}

/// Gets this part of the app ready, before the window opens: every window shows the chosen icon
/// as it opens and again whenever the system's theme changes, and the dock shows the dev icon.
///
/// # Errors
///
/// When Tauri will not take the part that watches the windows.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let watcher = tauri::plugin::Builder::<tauri::Wry>::new("valence-app-icon");

    #[cfg(windows)]
    let watcher = watcher.on_window_ready(|window| {
        use tauri::Manager;

        let app = window.app_handle().clone();
        let chosen = crate::preferences::read(&app, crate::preferences::APP_ICON);
        let themed = window.clone();

        show_on(&window, chosen.as_deref());

        window.on_window_event(move |event| {
            if matches!(event, tauri::WindowEvent::ThemeChanged(_)) {
                let chosen = crate::preferences::read(&app, crate::preferences::APP_ICON);

                show_on(&themed, chosen.as_deref());
            }
        });
    });

    #[cfg(all(target_os = "macos", debug_assertions))]
    let watcher = watcher.on_event(|_, event| {
        if matches!(event, tauri::RunEvent::Ready) {
            the_dock_icon();
        }
    });

    app.handle().plugin(watcher.build())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{app_icon_file, AppIcon};

    #[test]
    fn follows_the_system_until_a_light_or_dark_icon_is_chosen() {
        assert_eq!(app_icon_file(None, false), AppIcon::Light);
        assert_eq!(app_icon_file(None, true), AppIcon::Dark);
        assert_eq!(app_icon_file(Some("system"), true), AppIcon::Dark);
        assert_eq!(app_icon_file(Some("dark"), false), AppIcon::Dark);
        assert_eq!(app_icon_file(Some("light"), true), AppIcon::Light);
    }
}
