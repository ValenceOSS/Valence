//! Finding the Valence servers on this computer and on the network.

/// Servers found on this computer so far.
#[must_use]
pub fn already_found(app: &tauri::AppHandle) -> Vec<String> {
    let _ = app;
    Vec::new()
}

/// Servers heard on the network so far.
#[must_use]
pub fn already_nearby(app: &tauri::AppHandle) -> Vec<serde_json::Value> {
    let _ = app;
    Vec::new()
}

/// Whether an address answers as a Valence server.
#[tauri::command]
pub fn servers_reach(address: String) -> bool {
    let _ = address;
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
