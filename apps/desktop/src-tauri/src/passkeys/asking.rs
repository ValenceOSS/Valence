//! Asking Windows for a passkey to sign in with.

use crate::passkeys::base64url;
use crate::passkeys::client_data::{a_client_data, host_of, Ceremony};
use crate::passkeys::options::{RequestOptions, Requirement};
use crate::passkeys::reply::{what_windows_said, Reply};
use crate::passkeys::windows_hello;
use serde::Serialize;

/// How long a prompt waits for somebody, where the server does not say.
pub const PASSKEY_TIMEOUT: u32 = 5 * 60 * 1000;

/// What a sign-in asks Windows for.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PasskeyAsk {
    /// The server's name for itself.
    pub rp_id: String,
    /// The client data the passkey signs.
    pub client_data_json: String,
    /// The passkeys that may answer.
    pub allow: Vec<Vec<u8>>,
    /// How much a person has to prove it is them.
    pub user_verification: String,
    /// How long to wait, in milliseconds.
    pub timeout_ms: u32,
}

/// What Windows answered a sign-in with, in bytes of our own.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Answered {
    /// The passkey's id.
    pub credential_id: Vec<u8>,
    /// What the authenticator says of itself.
    pub authenticator_data: Vec<u8>,
    /// The signature.
    pub signature: Vec<u8>,
    /// The account's id, where the passkey keeps one.
    pub user_handle: Vec<u8>,
}

/// What was signed, shaped like a browser's `PublicKeyCredential` JSON.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Assertion {
    id: String,
    raw_id: String,
    #[serde(rename = "type")]
    kind: &'static str,
    response: AssertionResponse,
}

/// The signed part of an assertion.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
struct AssertionResponse {
    #[serde(rename = "clientDataJSON")]
    client_data_json: String,
    authenticator_data: String,
    signature: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    user_handle: Option<String>,
}

/// What to ask Windows for, from what the server asked for, or nothing where it cannot be asked.
#[must_use]
pub fn the_ask(options: &RequestOptions, server: &str) -> Option<PasskeyAsk> {
    let allow = options
        .allow_credentials
        .iter()
        .flatten()
        .map(|credential| base64url::decode(&credential.id))
        .collect::<Option<Vec<_>>>()?;

    Some(PasskeyAsk {
        rp_id: options.rp_id.clone().or_else(|| host_of(server))?,
        client_data_json: a_client_data(Ceremony::Get, &options.challenge, server)?,
        allow,
        user_verification: options
            .user_verification
            .unwrap_or(Requirement::Preferred)
            .said()
            .to_owned(),
        timeout_ms: options.timeout.unwrap_or(PASSKEY_TIMEOUT),
    })
}

/// What Windows signed, as the server reads it.
#[must_use]
pub fn the_assertion(answered: &Answered, client_data_json: &str) -> Assertion {
    let id = base64url::encode(&answered.credential_id);

    Assertion {
        raw_id: id.clone(),
        id,
        kind: "public-key",
        response: AssertionResponse {
            client_data_json: base64url::encode(client_data_json.as_bytes()),
            authenticator_data: base64url::encode(&answered.authenticator_data),
            signature: base64url::encode(&answered.signature),
            user_handle: (!answered.user_handle.is_empty())
                .then(|| base64url::encode(&answered.user_handle)),
        },
    }
}

/// Asks Windows for a passkey to sign in with, over the given window: Windows Hello, a phone, a
/// security key, or whatever passkey manager has put itself in Windows' list.
///
/// The ceremony a browser on the server's own page would run, run by Windows instead, because the
/// webview refuses one from a window whose address is not the server's. Windows is waited on off
/// the main thread.
pub async fn ask_windows_for_a_passkey(
    window: usize,
    options: &RequestOptions,
    server: &str,
) -> Reply<Assertion> {
    if !windows_hello::CAN_ASK {
        return Reply::failed("desktop.main.askWindowsForAPasskey.thisBuildCannotAskWindowsFor");
    }

    let Some(ask) = the_ask(options, server) else {
        return what_windows_said(None);
    };
    let client_data_json = ask.client_data_json.clone();
    let asked = tauri::async_runtime::spawn_blocking(move || {
        windows_hello::ask_for_a_passkey(window, &ask)
    })
    .await;

    match asked {
        Ok(Ok(answered)) => Reply::Done {
            done: the_assertion(&answered, &client_data_json),
        },
        Ok(Err(name)) => what_windows_said(Some(&name)),
        Err(_) => what_windows_said(None),
    }
}

#[cfg(test)]
mod tests {
    use super::{the_ask, the_assertion, Answered, PASSKEY_TIMEOUT};
    use crate::passkeys::options::request_options;
    use serde_json::{json, Value};

    const SERVER: &str = "https://valence.example";

    fn options(said: &Value) -> crate::passkeys::options::RequestOptions {
        request_options(said.clone()).unwrap_or_else(|| panic!("not options: {said}"))
    }

    #[test]
    fn asks_windows_for_the_server_as_its_own_page_would() {
        let ask = the_ask(
            &options(&json!({
                "challenge": "Y2hhbGxlbmdl",
                "rpId": "valence.example",
                "allowCredentials": [{ "id": "a2V5", "type": "public-key" }],
                "userVerification": "required",
                "timeout": 60000
            })),
            SERVER,
        );

        let Some(ask) = ask else {
            panic!("nothing to ask");
        };
        let client_data: Value = serde_json::from_str(&ask.client_data_json).unwrap_or_default();

        assert_eq!(ask.rp_id, "valence.example");
        assert_eq!(ask.user_verification, "required");
        assert_eq!(ask.timeout_ms, 60_000);
        assert_eq!(ask.allow, vec![b"key".to_vec()]);
        assert_eq!(client_data["type"], "webauthn.get");
        assert_eq!(client_data["challenge"], "Y2hhbGxlbmdl");
        assert_eq!(client_data["origin"], SERVER);
    }

    #[test]
    fn names_the_server_by_its_own_host_where_the_options_do_not() {
        let ask = the_ask(&options(&json!({ "challenge": "abc" })), SERVER);

        assert_eq!(
            ask.map(|ask| (ask.rp_id, ask.allow, ask.user_verification, ask.timeout_ms)),
            Some((
                "valence.example".to_owned(),
                Vec::new(),
                "preferred".to_owned(),
                PASSKEY_TIMEOUT
            ))
        );
    }

    #[test]
    fn answers_as_a_browser_would() {
        let answered = Answered {
            credential_id: b"key".to_vec(),
            authenticator_data: b"data".to_vec(),
            signature: b"signed".to_vec(),
            user_handle: b"user".to_vec(),
        };

        assert_eq!(
            serde_json::to_value(the_assertion(&answered, "{}")).unwrap_or_default(),
            json!({
                "id": "a2V5",
                "rawId": "a2V5",
                "type": "public-key",
                "response": {
                    "clientDataJSON": "e30",
                    "authenticatorData": "ZGF0YQ",
                    "signature": "c2lnbmVk",
                    "userHandle": "dXNlcg"
                }
            })
        );
    }

    #[test]
    fn leaves_out_a_user_handle_the_passkey_did_not_keep() {
        let answered = Answered {
            credential_id: b"key".to_vec(),
            ..Answered::default()
        };
        let said = serde_json::to_value(the_assertion(&answered, "{}")).unwrap_or_default();

        assert!(said["response"].get("userHandle").is_none());
    }

    #[cfg(not(windows))]
    #[tokio::test]
    async fn says_so_where_this_build_has_no_way_to_ask_windows() {
        assert_eq!(
            super::ask_windows_for_a_passkey(0, &options(&json!({ "challenge": "abc" })), SERVER)
                .await,
            crate::passkeys::reply::Reply::Failed {
                reason: "This build can’t use Windows passkeys.".to_owned()
            }
        );
    }
}
