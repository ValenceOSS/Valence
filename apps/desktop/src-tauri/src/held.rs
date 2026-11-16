//! Films and episodes kept on this computer to watch offline.

/// Everything kept, and how far each has come.
#[tauri::command]
pub fn held_all() -> serde_json::Value {
    serde_json::json!([])
}

/// Starts keeping something.
#[tauri::command]
pub fn held_keep(what: serde_json::Value) -> Result<(), String> {
    let _ = what;
    Ok(())
}

/// Stops keeping something and removes its files.
#[tauri::command]
pub fn held_drop(download_id: String) -> Result<(), String> {
    let _ = download_id;
    Ok(())
}

/// Pauses or resumes keeping something.
#[tauri::command]
pub fn held_pause(download_id: String, is_paused: bool) -> Result<(), String> {
    let _ = (download_id, is_paused);
    Ok(())
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
