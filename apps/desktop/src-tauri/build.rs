//! Generates what Tauri needs from the app's configuration and capabilities, including a
//! permission for each of the app's own commands, which the capabilities then allow.

const COMMANDS: &[&str] = &[
    "preferences_write",
    "preferences_forget",
    "this_launch_write",
    "this_launch_forget",
    "what_is_now",
    "go_to_the_server",
    "change_server",
    "frame_minimise",
    "frame_maximise",
    "frame_close",
    "show_the_window_controls",
    "keep_the_screen_on",
    "held_all",
    "held_keep",
    "held_drop",
    "held_pause",
    "listening_fetch",
    "listening_stop",
    "listening_drop",
    "listening_has",
    "servers_reach",
    "update_download",
    "set_unread_badge",
    "passkeys_ask",
    "passkeys_make",
    "passkeys_sign_in_on_a_page",
    "passkeys_add_one_in_the_browser",
    "now_watching",
];

fn main() {
    println!("cargo:rerun-if-env-changed=VALENCE_COMMIT");

    let attributes = tauri_build::Attributes::new()
        .app_manifest(tauri_build::AppManifest::new().commands(COMMANDS));

    if let Err(error) = tauri_build::try_build(attributes) {
        eprintln!("Tauri could not prepare the build: {error}");
        std::process::exit(1);
    }
}
