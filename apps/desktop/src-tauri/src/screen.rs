//! Keeping the screen on while something plays.

/// Keeps the screen on, or lets it sleep again.
#[tauri::command]
pub fn keep_the_screen_on(is_on: bool) {
    let _ = is_on;
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
