//! Music and audiobooks kept on this computer to listen to offline.

/// Fetches a file to keep.
#[tauri::command]
pub fn listening_fetch(from: String, name: String) -> serde_json::Value {
    let _ = (from, name);
    serde_json::json!({ "bytes": 0, "isComplete": false, "failure": null })
}

/// Stops fetching a file.
#[tauri::command]
pub fn listening_stop(name: String) {
    let _ = name;
}

/// Removes a kept file.
#[tauri::command]
pub fn listening_drop(name: String) {
    let _ = name;
}

/// Whether a file is kept.
#[tauri::command]
pub fn listening_has(name: String) -> bool {
    let _ = name;
    false
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
