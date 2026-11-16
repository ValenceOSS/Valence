//! Signing in with a passkey on the server's own page, in the person's own browser.

use crate::passkeys::hand_back::{HandBacks, LONG_ENOUGH_TO_SIGN_IN};
use crate::passkeys::reply::Reply;
use tauri::Url;

/// Whether a challenge is what the page makes one from: a SHA-256, in lowercase hex.
#[must_use]
pub fn is_a_challenge(challenge: &str) -> bool {
    challenge.len() == 64
        && challenge
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

/// The server's sign-in page, told where to hand the code back to.
#[must_use]
pub fn the_page(server: &str, challenge: &str, profile_id: Option<&str>, port: u16) -> Option<Url> {
    let mut page = Url::parse(server).ok()?.join("/phone-sign-in").ok()?;

    {
        let mut query = page.query_pairs_mut();

        query.append_pair("challenge", challenge);

        if let Some(profile_id) = profile_id {
            query.append_pair("profile", profile_id);
        }

        query.append_pair("port", &port.to_string());
    }

    Some(page)
}

/// Signs somebody in with a passkey on the server's own sign-in page, in their own browser, and
/// hands back the code the page gives, for a desktop app that cannot ask its operating system for a
/// passkey on the server's behalf.
///
/// The browser is whichever one they chose, so the passkeys they meet there are the ones they keep.
/// The page hands the code back to a port this machine alone listens on, and the window comes back
/// to the front for them.
pub async fn sign_in_on_a_page(
    window: &tauri::WebviewWindow,
    hand_backs: &HandBacks,
    server: Option<String>,
    challenge: &str,
    profile_id: Option<&str>,
) -> Reply<String> {
    let Some(server) = server.filter(|server| !server.is_empty()) else {
        return Reply::failed("common.noValenceHasBeenChosenYet");
    };
    let Ok(listening) = hand_backs.listen(LONG_ENOUGH_TO_SIGN_IN).await else {
        return Reply::Cancelled;
    };
    let Some(page) = the_page(&server, challenge, profile_id, listening.port) else {
        return Reply::failed("common.noValenceHasBeenChosenYet");
    };

    if tauri_plugin_opener::open_url(page.as_str(), None::<&str>).is_err() {
        return Reply::Cancelled;
    }

    let Some(code) = listening.handed_back.await.ok().flatten() else {
        return Reply::Cancelled;
    };

    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();

    Reply::Done { done: code }
}

#[cfg(test)]
mod tests {
    use super::{is_a_challenge, the_page};

    #[test]
    fn takes_only_a_challenge_that_is_a_sha_256() {
        assert!(is_a_challenge(&"a".repeat(64)));
        assert!(is_a_challenge(&"0123456789abcdef".repeat(4)));
        assert!(!is_a_challenge(&"A".repeat(64)));
        assert!(!is_a_challenge(&"a".repeat(63)));
        assert!(!is_a_challenge(&"g".repeat(64)));
    }

    #[test]
    fn opens_the_page_naming_the_port_and_the_face() {
        assert_eq!(
            the_page(
                "https://valence.example/somewhere",
                "abc",
                Some("profile 1"),
                4321
            )
            .map(String::from),
            Some(
                "https://valence.example/phone-sign-in?challenge=abc&profile=profile+1&port=4321"
                    .to_owned()
            )
        );
        assert_eq!(
            the_page("https://valence.example", "abc", None, 1).map(String::from),
            Some("https://valence.example/phone-sign-in?challenge=abc&port=1".to_owned())
        );
    }
}
