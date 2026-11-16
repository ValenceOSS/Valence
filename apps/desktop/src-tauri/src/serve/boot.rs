//! The first script every page runs, before anything is drawn: everything the page reads while it
//! draws, as it is at this moment, and the marks on the document the desktop's styles hang on.
//!
//! Built fresh for every page load, so a page that reloads sees what is true now.

use axum::extract::State;
use axum::http::header::{CACHE_CONTROL, CONTENT_TYPE};
use axum::http::{HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

use super::Served;
use crate::preferences::Preferences;
use crate::this_launch::ThisLaunch;

/// How passkeys are made on this system: by the system itself on Windows, and on a page in the
/// browser elsewhere.
#[must_use]
pub fn passkey_way(os: &str) -> &'static str {
    if os == "windows" {
        "system"
    } else {
        "page"
    }
}

/// Everything the page reads as it loads, as it is now.
#[must_use]
pub fn snapshot(app: &AppHandle) -> Value {
    json!({
        "preferences": app.try_state::<Preferences>().map(|kept| kept.all()).unwrap_or_default(),
        "thisLaunch": app.try_state::<ThisLaunch>().map(|kept| kept.all()).unwrap_or_default(),
        "alreadyFound": crate::discovery::already_found(app),
        "alreadyNearby": crate::discovery::already_nearby(app),
        "update": crate::updates::now(app),
        "frame": crate::window::frame_now(app),
        "isReachable": crate::reach::is_reachable(app),
        "about": crate::about::about(app),
        "passkeyWay": passkey_way(std::env::consts::OS),
    })
}

/// What may have changed between the first script being built and the page listening for
/// changes: whether the server can be reached, what is known of an update, and the window's frame.
#[tauri::command]
#[must_use]
#[allow(
    clippy::needless_pass_by_value,
    reason = "Tauri hands a command what it was asked with by value"
)]
pub fn what_is_now(app: AppHandle) -> Value {
    json!({
        "isReachable": crate::reach::is_reachable(&app),
        "update": crate::updates::now(&app),
        "frame": crate::window::frame_now(&app),
    })
}

/// The script that hands `boot` to the page, as nothing but the values it holds.
#[must_use]
pub fn script(boot: &Value) -> String {
    format!("window.__VALENCE_BOOT__ = {boot};\n")
}

/// Answers with the first script, built now.
pub async fn answer(State(served): State<Served>) -> Response {
    let boot = served.boot.clone();
    let Ok(boot) = tokio::task::spawn_blocking(move || boot()).await else {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    };

    (
        [
            (
                CONTENT_TYPE,
                HeaderValue::from_static("text/javascript; charset=utf-8"),
            ),
            (CACHE_CONTROL, HeaderValue::from_static("no-store")),
        ],
        script(&boot),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn makes_passkeys_with_the_system_only_on_windows() {
        assert_eq!(passkey_way("windows"), "system");
        assert_eq!(passkey_way("macos"), "page");
        assert_eq!(passkey_way("linux"), "page");
    }

    #[test]
    fn hands_the_page_its_values_and_nothing_else() {
        let boot = json!({
            "preferences": { "valence.server.address": "http://nas:8420" },
            "about": { "platform": "darwin" },
        });

        let written = script(&boot);

        let handed = written
            .strip_prefix("window.__VALENCE_BOOT__ = ")
            .and_then(|rest| rest.split_once(";\n"))
            .map(|(json, _)| json)
            .expect("the values first");

        assert_eq!(serde_json::from_str::<Value>(handed).expect("JSON"), boot);
        assert!(!written.contains("setAttribute"));
    }

    #[test]
    fn says_text_that_looks_like_script_as_text() {
        let written = script(
            &json!({ "preferences": { "a": "\";alert(1);//" }, "about": { "platform": "x\"" } }),
        );

        assert!(written.contains(r#""a":"\";alert(1);//""#));
        assert!(written.contains(r#""platform":"x\"""#));
    }
}
