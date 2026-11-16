//! Valence's desktop app: a window onto a Valence server, hosted by Tauri.

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
mod say;
mod screen;
mod serve;
mod this_launch;
mod tray;
mod updates;
mod upstream;
mod window;

/// Builds and runs the app until it quits.
pub fn run() {
    let built = tauri::Builder::default()
        .setup(|app| {
            preferences::setup(app)?;
            this_launch::setup(app)?;
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
            screen::setup(app)?;
            window::setup(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            preferences::preferences_write,
            preferences::preferences_forget,
            this_launch::this_launch_write,
            this_launch::this_launch_forget,
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
        .run(tauri::generate_context!());

    if let Err(error) = built {
        eprintln!("Valence could not start: {error}");
    }
}
