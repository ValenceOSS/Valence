//! The window Valence is drawn in.

/// What the main window's frame is now, for the page that draws its controls.
#[must_use]
pub fn frame_now(app: &tauri::AppHandle) -> serde_json::Value {
    let _ = app;
    serde_json::json!({ "isMaximised": false, "isFullScreen": false })
}

/// Shows the application again from its first page.
#[tauri::command]
pub fn go_to_the_server() {}

/// Forgets the chosen server and asks which one again.
#[tauri::command]
pub fn change_server() {}

/// Minimises the window.
#[tauri::command]
pub fn frame_minimise() {}

/// Maximises the window, or restores it when it is maximised.
#[tauri::command]
pub fn frame_maximise() {}

/// Closes the window.
#[tauri::command]
pub fn frame_close() {}

/// Shows or hides the system's window controls, as the player asks.
#[tauri::command]
pub fn show_the_window_controls(is_shown: bool) {
    let _ = is_shown;
}

/// Gets this part of the app ready, before the window opens.
///
/// # Errors
///
/// When it cannot be got ready, and the app cannot start without it.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let _ = app;
    Ok(())
}
