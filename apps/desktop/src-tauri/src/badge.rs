//! The unread count on the app’s icon, and asking to notify.

/// Shows the unread count on the app's icon.
#[tauri::command]
pub fn set_unread_badge(count: u32, picture: Option<String>) {
    let _ = (count, picture);
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
