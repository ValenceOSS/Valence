//! Signing in with a passkey: through Windows Hello, or on a page in the browser.
//!
//! Every question is read on the way in, because it arrives from a page, and every answer says what
//! came of it rather than failing — a failure reaches the page wrapped in words about IPC. Each
//! prompt belongs to the window that asked, so the system draws it there.

mod asking;
mod base64url;
mod client_data;
mod hand_back;
mod making;
mod options;
mod reply;
mod sign_in_on_a_page;
#[cfg(windows)]
mod windows_hello;
#[cfg(not(windows))]
mod without_windows_hello;
#[cfg(not(windows))]
use without_windows_hello as windows_hello;

use hand_back::HandBacks;
use reply::Reply;
use tauri::{AppHandle, Manager, State, WebviewWindow};

/// The address of the window that asked, which the system draws its prompt over.
#[cfg(windows)]
fn the_window(window: &WebviewWindow) -> Option<usize> {
    window.hwnd().ok().map(|handle| handle.0 as usize)
}

/// The address of the window that asked, which only Windows draws a prompt over.
#[cfg(not(windows))]
#[allow(
    clippy::unnecessary_wraps,
    reason = "the same shape as the Windows build, which can fail to find the window"
)]
fn the_window(window: &WebviewWindow) -> Option<usize> {
    let _ = window;

    Some(0)
}

/// What the page is told when it sent options this app cannot read.
fn not_understood() -> serde_json::Value {
    Reply::<()>::failed("desktop.main.answerAboutPasskeys.valenceAskedForAPasskeyIn").said()
}

/// What the page is told when the window that asked has gone.
fn no_window() -> serde_json::Value {
    Reply::<()>::failed("desktop.main.answerAboutPasskeys.theWindowAskingHasGone").said()
}

/// What the page is told before any server has been chosen.
fn no_server() -> serde_json::Value {
    Reply::<()>::failed("common.noValenceHasBeenChosenYet").said()
}

/// The chosen server, where there is one.
fn the_server(app: &AppHandle) -> Option<String> {
    crate::preferences::server_address(app).filter(|server| !server.is_empty())
}

/// Asks for a passkey to sign in with, from Windows, over the window that asked.
#[tauri::command]
pub async fn passkeys_ask(
    app: AppHandle,
    window: WebviewWindow,
    options: serde_json::Value,
) -> serde_json::Value {
    let Some(options) = options::request_options(options) else {
        return not_understood();
    };
    let Some(handle) = the_window(&window) else {
        return no_window();
    };
    let Some(server) = the_server(&app) else {
        return no_server();
    };

    asking::ask_windows_for_a_passkey(handle, &options, &server)
        .await
        .said()
}

/// Has Windows make a passkey, over the window that asked.
#[tauri::command]
pub async fn passkeys_make(
    app: AppHandle,
    window: WebviewWindow,
    options: serde_json::Value,
) -> serde_json::Value {
    let Some(options) = options::creation_options(options) else {
        return not_understood();
    };
    let Some(handle) = the_window(&window) else {
        return no_window();
    };
    let Some(server) = the_server(&app) else {
        return no_server();
    };

    making::have_windows_make_a_passkey(handle, &options, &server)
        .await
        .said()
}

/// Signs in on the server's page in the browser, and waits for it to hand a code back.
///
/// Only a challenge that is a SHA-256 is taken; a face that is not a name is left out.
#[tauri::command]
pub async fn passkeys_sign_in_on_a_page(
    app: AppHandle,
    window: WebviewWindow,
    hand_backs: State<'_, HandBacks>,
    challenge: serde_json::Value,
    profile_id: serde_json::Value,
) -> Result<serde_json::Value, ()> {
    let Some(challenge) = challenge
        .as_str()
        .filter(|challenge| sign_in_on_a_page::is_a_challenge(challenge))
    else {
        return Ok(not_understood());
    };
    let profile_id = profile_id.as_str().filter(|profile| !profile.is_empty());

    Ok(sign_in_on_a_page::sign_in_on_a_page(
        &window,
        &hand_backs,
        the_server(&app),
        challenge,
        profile_id,
    )
    .await
    .said())
}

/// Opens the account's security settings in the browser, to add a passkey there.
#[tauri::command]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn passkeys_add_one_in_the_browser(app: AppHandle) {
    let page = the_server(&app)
        .and_then(|server| tauri::Url::parse(&server).ok())
        .and_then(|server| server.join("/?account=security").ok());

    if let Some(page) = page {
        let _ = tauri_plugin_opener::open_url(page.as_str(), None::<&str>);
    }
}

/// Gets this part of the app ready, before the window opens: the one sign-in on a page that can
/// be waited for at a time.
///
/// # Errors
///
/// Never.
#[allow(
    clippy::unnecessary_wraps,
    reason = "every part of the app is set up the same way, and most can fail"
)]
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    app.manage(HandBacks::default());

    Ok(())
}
