//! What a server asks for when it wants a passkey, read the way the shared schemas read it.

use serde::Deserialize;

/// How much a person has to prove it is them.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Requirement {
    /// They must.
    Required,
    /// They should, where the authenticator can.
    Preferred,
    /// They need not.
    Discouraged,
}

impl Requirement {
    /// The word a browser uses for it.
    #[must_use]
    pub const fn said(self) -> &'static str {
        match self {
            Self::Required => "required",
            Self::Preferred => "preferred",
            Self::Discouraged => "discouraged",
        }
    }
}

/// The one kind of credential there is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
pub enum CredentialType {
    /// A public key.
    #[serde(rename = "public-key")]
    PublicKey,
}

/// A credential the server names, to allow or to exclude.
#[derive(Debug, Clone, Deserialize)]
pub struct Credential {
    /// Its id, in base64url.
    pub id: String,
    /// Its kind, read only to refuse any other.
    #[serde(rename = "type")]
    #[allow(dead_code, reason = "read only to refuse a credential of another kind")]
    pub kind: CredentialType,
}

/// What a sign-in asks for, as `PasskeyRequestOptionsSchema` reads it.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestOptions {
    /// The challenge, in base64url.
    pub challenge: String,
    /// The server's name for itself, where it gives one.
    #[serde(default)]
    pub rp_id: Option<String>,
    /// How long to wait, in milliseconds.
    #[serde(default)]
    pub timeout: Option<u32>,
    /// The passkeys that may answer.
    #[serde(default)]
    pub allow_credentials: Option<Vec<Credential>>,
    /// How much a person has to prove it is them.
    #[serde(default)]
    pub user_verification: Option<Requirement>,
}

/// The server, as it names itself to a passkey being made.
#[derive(Debug, Clone, Deserialize)]
pub struct RelyingParty {
    /// Its name.
    pub name: String,
    /// Its id, where it gives one.
    #[serde(default)]
    pub id: Option<String>,
}

/// The account a passkey is made for.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    /// Its id, in base64url.
    pub id: String,
    /// Its name.
    pub name: String,
    /// The name it is shown by.
    pub display_name: String,
}

/// One kind of key the server takes.
#[derive(Debug, Clone, Deserialize)]
pub struct KeyParameter {
    /// The COSE algorithm.
    pub alg: i32,
    /// Its kind, read only to refuse any other.
    #[serde(rename = "type")]
    #[allow(dead_code, reason = "read only to refuse a key of another kind")]
    pub kind: CredentialType,
}

/// Which kind of authenticator may answer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Attachment {
    /// One built into this device.
    Platform,
    /// One that comes and goes, such as a phone or a security key.
    CrossPlatform,
}

impl Attachment {
    /// The word a browser uses for it.
    #[must_use]
    pub const fn said(self) -> &'static str {
        match self {
            Self::Platform => "platform",
            Self::CrossPlatform => "cross-platform",
        }
    }
}

/// How much the server wants to know about the authenticator.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Attestation {
    /// Nothing.
    None,
    /// Something, anonymised.
    Indirect,
    /// What the authenticator says of itself.
    Direct,
    /// What an organisation's own authenticators say.
    Enterprise,
}

impl Attestation {
    /// The word a browser uses for it.
    #[must_use]
    pub const fn said(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Indirect => "indirect",
            Self::Direct => "direct",
            Self::Enterprise => "enterprise",
        }
    }
}

/// Which authenticators the server wants a passkey made on.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Selection {
    /// Which kind may answer.
    #[serde(default)]
    pub authenticator_attachment: Option<Attachment>,
    /// Whether the passkey is to be kept on the authenticator.
    #[serde(default)]
    pub resident_key: Option<Requirement>,
    /// The older way of saying it must be.
    #[serde(default)]
    pub require_resident_key: Option<bool>,
    /// How much a person has to prove it is them.
    #[serde(default)]
    pub user_verification: Option<Requirement>,
}

/// What adding a passkey asks for, as `PasskeyCreationOptionsSchema` reads it.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationOptions {
    /// The challenge, in base64url.
    pub challenge: String,
    /// The server.
    pub rp: RelyingParty,
    /// The account.
    pub user: User,
    /// The kinds of key the server takes.
    pub pub_key_cred_params: Vec<KeyParameter>,
    /// How long to wait, in milliseconds.
    #[serde(default)]
    pub timeout: Option<u32>,
    /// The passkeys this account already has.
    #[serde(default)]
    pub exclude_credentials: Option<Vec<Credential>>,
    /// Which authenticators to make it on.
    #[serde(default)]
    pub authenticator_selection: Option<Selection>,
    /// How much the server wants to know about the authenticator.
    #[serde(default)]
    pub attestation: Option<Attestation>,
}

/// Whether a value the schema says may not be empty is not.
fn is_filled(text: &str) -> bool {
    !text.is_empty()
}

/// Whether every credential named has an id.
fn are_named(credentials: Option<&Vec<Credential>>) -> bool {
    credentials.is_none_or(|all| all.iter().all(|credential| is_filled(&credential.id)))
}

/// Reads a sign-in's options from what the page sent, or nothing where they are not options.
#[must_use]
pub fn request_options(said: serde_json::Value) -> Option<RequestOptions> {
    let options: RequestOptions = serde_json::from_value(said).ok()?;
    let is_whole = is_filled(&options.challenge)
        && options.rp_id.as_deref().is_none_or(is_filled)
        && options.timeout.is_none_or(|timeout| timeout > 0)
        && are_named(options.allow_credentials.as_ref());

    is_whole.then_some(options)
}

/// Reads the options for adding a passkey from what the page sent, or nothing where they are not
/// options.
#[must_use]
pub fn creation_options(said: serde_json::Value) -> Option<CreationOptions> {
    let options: CreationOptions = serde_json::from_value(said).ok()?;
    let is_whole = is_filled(&options.challenge)
        && options.rp.id.as_deref().is_none_or(is_filled)
        && is_filled(&options.user.id)
        && options.timeout.is_none_or(|timeout| timeout > 0)
        && are_named(options.exclude_credentials.as_ref());

    is_whole.then_some(options)
}

#[cfg(test)]
mod tests {
    use super::{creation_options, request_options, Requirement};
    use serde_json::json;

    #[test]
    fn reads_a_sign_in_the_server_asked_for() {
        let read = request_options(json!({
            "challenge": "Y2hhbGxlbmdl",
            "rpId": "valence.example",
            "allowCredentials": [{ "id": "a2V5", "type": "public-key" }],
            "userVerification": "required",
            "timeout": 60000
        }));

        assert_eq!(
            read.and_then(|options| options.user_verification),
            Some(Requirement::Required)
        );
    }

    #[test]
    fn refuses_options_with_no_challenge() {
        assert!(request_options(json!({ "rpId": "x" })).is_none());
        assert!(request_options(json!({ "challenge": "" })).is_none());
    }

    #[test]
    fn refuses_a_credential_of_another_kind() {
        assert!(request_options(json!({
            "challenge": "abc",
            "allowCredentials": [{ "id": "a2V5", "type": "password" }]
        }))
        .is_none());
    }

    #[test]
    fn refuses_a_wait_of_nothing() {
        assert!(request_options(json!({ "challenge": "abc", "timeout": 0 })).is_none());
        assert!(request_options(json!({ "challenge": "abc", "timeout": 1.5 })).is_none());
    }

    #[test]
    fn reads_what_adding_a_passkey_asks_for() {
        let read = creation_options(json!({
            "challenge": "abc",
            "rp": { "name": "Valence" },
            "user": { "id": "dXNlcg", "name": "sam", "displayName": "Sam" },
            "pubKeyCredParams": [{ "alg": -7, "type": "public-key" }],
            "authenticatorSelection": { "residentKey": "preferred" },
            "attestation": "none"
        }));

        assert_eq!(
            read.map(|options| options.pub_key_cred_params[0].alg),
            Some(-7)
        );
    }

    #[test]
    fn refuses_a_passkey_for_nobody() {
        assert!(creation_options(json!({
            "challenge": "abc",
            "rp": { "name": "Valence" },
            "user": { "id": "", "name": "sam", "displayName": "Sam" },
            "pubKeyCredParams": []
        }))
        .is_none());
    }
}
