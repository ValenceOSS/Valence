//! The client data a passkey signs.

use serde::Serialize;
use tauri::Url;

/// Whether a passkey signs in or is being made.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum Ceremony {
    /// Signing in.
    #[serde(rename = "webauthn.get")]
    Get,
    /// Making one.
    #[serde(rename = "webauthn.create")]
    Create,
}

/// The client data, in the order a browser writes it.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ClientData<'a> {
    #[serde(rename = "type")]
    kind: Ceremony,
    challenge: &'a str,
    origin: String,
    cross_origin: bool,
}

/// The origin of the server at an address, as a browser would say it.
#[must_use]
pub fn origin_of(server: &str) -> Option<String> {
    Url::parse(server)
        .ok()
        .map(|url| url.origin().ascii_serialization())
        .filter(|origin| origin != "null")
}

/// The host of the server at an address, which names it where the server does not.
#[must_use]
pub fn host_of(server: &str) -> Option<String> {
    Url::parse(server)
        .ok()
        .and_then(|url| url.host_str().map(str::to_owned))
}

/// The client data a passkey signs, written as a browser on the server's own page would write it.
///
/// The origin is the server's, because that is where this client's requests arrive from as far as
/// the server is concerned, and the proxy already says the server's origin on every request it
/// carries. Nothing where the server's address is not one.
#[must_use]
pub fn a_client_data(kind: Ceremony, challenge: &str, server: &str) -> Option<String> {
    serde_json::to_string(&ClientData {
        kind,
        challenge,
        origin: origin_of(server)?,
        cross_origin: false,
    })
    .ok()
}

#[cfg(test)]
mod tests {
    use super::{a_client_data, host_of, Ceremony};
    use serde_json::{json, Value};

    fn read(said: Option<String>) -> Value {
        said.and_then(|text| serde_json::from_str(&text).ok())
            .unwrap_or(Value::Null)
    }

    #[test]
    fn says_the_servers_own_origin_as_a_page_on_the_server_would() {
        assert_eq!(
            read(a_client_data(
                Ceremony::Get,
                "Y2hhbGxlbmdl",
                "https://valence.example/some/path"
            )),
            json!({
                "type": "webauthn.get",
                "challenge": "Y2hhbGxlbmdl",
                "origin": "https://valence.example",
                "crossOrigin": false
            })
        );
    }

    #[test]
    fn keeps_a_port_the_server_is_reached_on() {
        let said = read(a_client_data(
            Ceremony::Create,
            "abc",
            "https://valence.example:8443",
        ));

        assert_eq!(said["type"], "webauthn.create");
        assert_eq!(said["origin"], "https://valence.example:8443");
    }

    #[test]
    fn writes_the_fields_in_a_browsers_order() {
        assert_eq!(
            a_client_data(Ceremony::Get, "abc", "https://valence.example"),
            Some(
                r#"{"type":"webauthn.get","challenge":"abc","origin":"https://valence.example","crossOrigin":false}"#
                    .to_owned()
            )
        );
    }

    #[test]
    fn writes_nothing_for_an_address_that_is_not_one() {
        assert_eq!(a_client_data(Ceremony::Get, "abc", "not a server"), None);
        assert_eq!(
            host_of("https://valence.example:8443/x"),
            Some("valence.example".to_owned())
        );
    }
}
