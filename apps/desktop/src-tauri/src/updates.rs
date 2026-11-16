//! Updating this app.

/// What is known about an update now.
#[must_use]
pub fn now(app: &tauri::AppHandle) -> serde_json::Value {
    let _ = app;
    serde_json::json!({ "kind": "none" })
}

/// Downloads the update that is available.
#[tauri::command]
pub fn update_download() {}

/// Gets this part of the app ready, before the window opens.
///
/// # Errors
///
/// When it cannot be got ready, and the app cannot start without it.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let _ = app;
    Ok(())
}
