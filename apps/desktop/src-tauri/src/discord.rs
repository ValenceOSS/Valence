//! Telling Discord what is playing.

/// Tells Discord what is playing now, or that nothing is.
#[tauri::command]
pub fn now_watching(said: serde_json::Value) {
    let _ = said;
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
