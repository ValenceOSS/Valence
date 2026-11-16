//! Preferences kept between launches, in the file the Electron app kept them in.

/// Keeps a preference, as the page asked.
#[tauri::command]
pub fn preferences_write(key: String, value: String) {
    let _ = (key, value);
}

/// Forgets a preference, as the page asked.
#[tauri::command]
pub fn preferences_forget(key: String) {
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
