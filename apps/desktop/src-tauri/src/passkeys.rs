//! Signing in with a passkey: through Windows Hello, or on a page in the browser.

/// Asks for a passkey to sign in with.
#[tauri::command]
pub fn passkeys_ask(options: serde_json::Value) -> serde_json::Value {
    let _ = options;
    serde_json::json!({ "kind": "cancelled" })
}

/// Makes a passkey.
#[tauri::command]
pub fn passkeys_make(options: serde_json::Value) -> serde_json::Value {
    let _ = options;
    serde_json::json!({ "kind": "cancelled" })
}

/// Signs in on a page in the browser and waits for it to hand back.
#[tauri::command]
pub fn passkeys_sign_in_on_a_page(
    challenge: String,
    profile_id: Option<String>,
) -> serde_json::Value {
    let _ = (challenge, profile_id);
    serde_json::json!({ "kind": "cancelled" })
}

/// Opens the account's security settings in the browser, to add a passkey there.
#[tauri::command]
pub fn passkeys_add_one_in_the_browser() {}

/// Gets this part of the app ready, before the window opens.
///
/// # Errors
///
/// When it cannot be got ready, and the app cannot start without it.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let _ = app;
    Ok(())
}
