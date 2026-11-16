//! Asking Windows to make a passkey.

use crate::passkeys::asking::PASSKEY_TIMEOUT;
use crate::passkeys::base64url;
use crate::passkeys::client_data::{a_client_data, host_of, Ceremony};
use crate::passkeys::options::{CreationOptions, Requirement};
use crate::passkeys::reply::{what_windows_said, Reply};
use crate::passkeys::windows_hello;
use serde::Serialize;

/// What adding a passkey asks Windows to make.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PasskeyMaking {
    /// The server's name for itself.
    pub rp_id: String,
    /// The server's name to show.
    pub rp_name: String,
    /// The account's id.
    pub user_id: Vec<u8>,
    /// The account's name.
    pub user_name: String,
    /// The name the account is shown by.
    pub user_display_name: String,
    /// The client data the passkey signs.
    pub client_data_json: String,
    /// The kinds of key the server takes, in its order.
    pub algorithms: Vec<i32>,
    /// The passkeys the account already has.
    pub exclude: Vec<Vec<u8>>,
    /// Which kind of authenticator may answer, or nothing for any.
    pub attachment: String,
    /// Whether the passkey is to be kept on the authenticator, or nothing to leave it be.
    pub resident_key: String,
    /// How much a person has to prove it is them.
    pub user_verification: String,
    /// How much the server wants to know about the authenticator.
    pub attestation: String,
    /// How long to wait, in milliseconds.
    pub timeout_ms: u32,
}

/// What Windows made, in bytes of our own.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Made {
    /// The passkey's id.
    pub credential_id: Vec<u8>,
    /// What the authenticator says of the passkey.
    pub attestation_object: Vec<u8>,
    /// How it was reached, in the words a server expects.
    pub transports: Vec<String>,
}

/// What was made, shaped like a browser's `PublicKeyCredential` JSON.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Attestation {
    id: String,
    raw_id: String,
    #[serde(rename = "type")]
    kind: &'static str,
    response: AttestationResponse,
}

/// The made part of an attestation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
struct AttestationResponse {
    #[serde(rename = "clientDataJSON")]
    client_data_json: String,
    attestation_object: String,
    transports: Vec<String>,
}

/// What to ask Windows to make, from what the server asked for, or nothing where it cannot be
/// asked.
#[must_use]
pub fn the_making(options: &CreationOptions, server: &str) -> Option<PasskeyMaking> {
    let exclude = options
        .exclude_credentials
        .iter()
        .flatten()
        .map(|credential| base64url::decode(&credential.id))
        .collect::<Option<Vec<_>>>()?;
    let selection = options.authenticator_selection.clone().unwrap_or_default();
    let resident_key = match (selection.resident_key, selection.require_resident_key) {
        (Some(said), _) => said.said(),
        (None, Some(true)) => "required",
        (None, _) => "",
    };

    Some(PasskeyMaking {
        rp_id: options.rp.id.clone().or_else(|| host_of(server))?,
        rp_name: options.rp.name.clone(),
        user_id: base64url::decode(&options.user.id)?,
        user_name: options.user.name.clone(),
        user_display_name: options.user.display_name.clone(),
        client_data_json: a_client_data(Ceremony::Create, &options.challenge, server)?,
        algorithms: options
            .pub_key_cred_params
            .iter()
            .map(|parameter| parameter.alg)
            .collect(),
        exclude,
        attachment: selection
            .authenticator_attachment
            .map_or("", |attachment| attachment.said())
            .to_owned(),
        resident_key: resident_key.to_owned(),
        user_verification: selection
            .user_verification
            .unwrap_or(Requirement::Preferred)
            .said()
            .to_owned(),
        attestation: options
            .attestation
            .map_or("none", |attestation| attestation.said())
            .to_owned(),
        timeout_ms: options.timeout.unwrap_or(PASSKEY_TIMEOUT),
    })
}

/// What Windows made, as the server reads it.
#[must_use]
pub fn the_attestation(made: &Made, client_data_json: &str) -> Attestation {
    let id = base64url::encode(&made.credential_id);

    Attestation {
        raw_id: id.clone(),
        id,
        kind: "public-key",
        response: AttestationResponse {
            client_data_json: base64url::encode(client_data_json.as_bytes()),
            attestation_object: base64url::encode(&made.attestation_object),
            transports: made.transports.clone(),
        },
    }
}

/// Asks Windows to make a passkey for this account, over the given window, wherever the person
/// chooses to keep it — Windows Hello, a phone, a security key, or a passkey manager. Windows is
/// waited on off the main thread.
pub async fn have_windows_make_a_passkey(
    window: usize,
    options: &CreationOptions,
    server: &str,
) -> Reply<Attestation> {
    if !windows_hello::CAN_ASK {
        return Reply::failed("desktop.main.haveWindowsMakeAPasskey.thisBuildCannotAskWindowsTo");
    }

    let Some(making) = the_making(options, server) else {
        return what_windows_said(None);
    };
    let client_data_json = making.client_data_json.clone();
    let asked = tauri::async_runtime::spawn_blocking(move || {
        windows_hello::make_a_passkey(window, &making)
    })
    .await;

    match asked {
        Ok(Ok(made)) => Reply::Done {
            done: the_attestation(&made, &client_data_json),
        },
        Ok(Err(name)) => what_windows_said(Some(&name)),
        Err(_) => what_windows_said(None),
    }
}

#[cfg(test)]
mod tests {
    use super::{the_attestation, the_making, Made, PASSKEY_TIMEOUT};
    use crate::passkeys::options::{creation_options, CreationOptions};
    use serde_json::{json, Value};

    const SERVER: &str = "https://valence.example";

    fn options(said: &Value) -> CreationOptions {
        creation_options(said.clone()).unwrap_or_else(|| panic!("not options: {said}"))
    }

    fn asked(selection: &Value) -> Value {
        json!({
            "challenge": "Y2hhbGxlbmdl",
            "rp": { "name": "Valence", "id": "valence.example" },
            "user": { "id": "dXNlcg", "name": "sam", "displayName": "Sam" },
            "pubKeyCredParams": [
                { "alg": -7, "type": "public-key" },
                { "alg": -257, "type": "public-key" }
            ],
            "excludeCredentials": [{ "id": "a2V5", "type": "public-key" }],
            "authenticatorSelection": selection,
            "attestation": "none"
        })
    }

    #[test]
    fn asks_windows_to_make_one_for_this_account_as_the_server_described_it() {
        let Some(making) = the_making(
            &options(&asked(&json!({
                "residentKey": "preferred",
                "userVerification": "required",
                "authenticatorAttachment": "platform"
            }))),
            SERVER,
        ) else {
            panic!("nothing to make");
        };
        let client_data: Value = serde_json::from_str(&making.client_data_json).unwrap_or_default();

        assert_eq!(making.rp_id, "valence.example");
        assert_eq!(making.rp_name, "Valence");
        assert_eq!(making.user_id, b"user".to_vec());
        assert_eq!(making.user_name, "sam");
        assert_eq!(making.user_display_name, "Sam");
        assert_eq!(making.algorithms, vec![-7, -257]);
        assert_eq!(making.exclude, vec![b"key".to_vec()]);
        assert_eq!(making.attachment, "platform");
        assert_eq!(making.resident_key, "preferred");
        assert_eq!(making.user_verification, "required");
        assert_eq!(making.attestation, "none");
        assert_eq!(making.timeout_ms, PASSKEY_TIMEOUT);
        assert_eq!(client_data["type"], "webauthn.create");
        assert_eq!(client_data["origin"], SERVER);
    }

    #[test]
    fn asks_for_a_resident_key_where_the_server_requires_one_the_old_way() {
        let making = the_making(
            &options(&asked(&json!({ "requireResidentKey": true }))),
            SERVER,
        );

        assert_eq!(
            making.map(|making| (making.resident_key, making.attachment)),
            Some(("required".to_owned(), String::new()))
        );
    }

    #[test]
    fn answers_as_a_browser_would() {
        let made = Made {
            credential_id: b"key".to_vec(),
            attestation_object: b"object".to_vec(),
            transports: vec!["internal".to_owned()],
        };

        assert_eq!(
            serde_json::to_value(the_attestation(&made, "{}")).unwrap_or_default(),
            json!({
                "id": "a2V5",
                "rawId": "a2V5",
                "type": "public-key",
                "response": {
                    "clientDataJSON": "e30",
                    "attestationObject": "b2JqZWN0",
                    "transports": ["internal"]
                }
            })
        );
    }

    #[cfg(not(windows))]
    #[tokio::test]
    async fn says_so_where_this_build_has_no_way_to_ask_windows() {
        assert_eq!(
            super::have_windows_make_a_passkey(0, &options(&asked(&json!({}))), SERVER).await,
            crate::passkeys::reply::Reply::Failed {
                reason: "This build can’t create Windows passkeys.".to_owned()
            }
        );
    }
}
