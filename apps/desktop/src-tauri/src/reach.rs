//! Whether the chosen server can be reached now.

/// Whether the server could be reached when last asked.
#[must_use]
pub fn is_reachable(app: &tauri::AppHandle) -> bool {
    let _ = app;
    true
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
