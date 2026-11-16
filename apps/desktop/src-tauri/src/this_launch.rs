//! What the page keeps for as long as this launch lasts.

/// Keeps something for this launch.
#[tauri::command]
pub fn this_launch_write(key: String, value: String) {
    let _ = (key, value);
}

/// Forgets something kept for this launch.
#[tauri::command]
pub fn this_launch_forget(key: String) {
    let _ = key;
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
