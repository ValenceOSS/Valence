//! Valence's desktop app: a window onto a Valence server, hosted by Tauri.

#![cfg_attr(
    test,
    allow(
        clippy::expect_used,
        clippy::unwrap_used,
        reason = "a test that cannot set itself up has nothing left to check"
    )
)]

mod about;
mod app_icon;
mod badge;
mod discord;
mod discovery;
mod held;
mod listening;
mod menu;
mod passkeys;
mod paths;
mod preferences;
mod reach;
mod runtime;
mod say;
mod screen;
mod serve;
mod this_launch;
mod tray;
mod updates;
mod upstream;
mod window;

use tauri::{AppHandle, RunEvent};

/// Answers what happens to the app as it runs: on macOS it keeps running with no window open, as
/// Mac apps do, and opens one again when its Dock icon is clicked; elsewhere it quits when its
/// window closes.
fn as_it_runs(app: &AppHandle, event: RunEvent) {
    match event {
        RunEvent::ExitRequested { api, code, .. } => {
            if cfg!(target_os = "macos") && code.is_none() {
                api.prevent_exit();
            }
        }
        #[cfg(target_os = "macos")]
        RunEvent::Reopen {
            has_visible_windows,
            ..
        } => {
            if !has_visible_windows {
                window::bring_forward(app);
            }
        }
        _ => {
            let _ = app;
        }
    }
}

/// Builds and runs the app until it quits.
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(not(debug_assertions))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(
        |app, _arguments, _folder| {
            window::bring_forward(app);
        },
    ));

    let built = builder
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            window::prepare(app);
            preferences::setup(app);
            this_launch::setup(app);
            about::setup(app);
            upstream::setup(app)?;
            reach::setup(app)?;
            serve::setup(app)?;
            held::setup(app)?;
            listening::setup(app)?;
            discovery::setup(app)?;
            passkeys::setup(app)?;
            updates::setup(app)?;
            discord::setup(app)?;
            badge::setup(app)?;
            menu::setup(app)?;
            tray::setup(app)?;
            app_icon::setup(app)?;
            screen::setup(app);
            window::setup(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            preferences::preferences_write,
            preferences::preferences_forget,
            this_launch::this_launch_write,
            this_launch::this_launch_forget,
            serve::boot::what_is_now,
            window::go_to_the_server,
            window::change_server,
            window::frame_minimise,
            window::frame_maximise,
            window::frame_close,
            window::show_the_window_controls,
            screen::keep_the_screen_on,
            held::held_all,
            held::held_keep,
            held::held_drop,
            held::held_pause,
            listening::listening_fetch,
            listening::listening_stop,
            listening::listening_drop,
            listening::listening_has,
            discovery::servers_reach,
            updates::update_download,
            badge::set_unread_badge,
            passkeys::passkeys_ask,
            passkeys::passkeys_make,
            passkeys::passkeys_sign_in_on_a_page,
            passkeys::passkeys_add_one_in_the_browser,
            discord::now_watching,
        ])
        .build(tauri::generate_context!());

    match built {
        Ok(app) => app.run(as_it_runs),
        Err(error) => eprintln!("Valence could not start: {error}"),
    }
}
