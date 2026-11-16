//! How this app trusts the servers it asks: as the system it runs on does.
//!
//! A server at home is often signed by an authority of the person's own, trusted in their system
//! rather than in any list shipped with an app. The Electron app trusted what Chromium did, which is
//! what the system does, so this does the same, through the system's own verifier, for requests
//! and for the live connection alike.

use std::sync::{Arc, OnceLock};

use rustls_platform_verifier::BuilderVerifierExt;
use tokio_rustls::rustls::crypto::ring;
use tokio_rustls::rustls::ClientConfig;

/// What a request may speak once connected, best first.
const FOR_REQUESTS: [&[u8]; 2] = [b"h2", b"http/1.1"];

/// What a live connection speaks, which only HTTP/1.1 can carry.
const FOR_SOCKETS: [&[u8]; 1] = [b"http/1.1"];

/// A configuration that trusts what the system trusts and offers `protocols`, or nothing where
/// the system's verifier cannot be had.
fn trusting_the_system(protocols: &[&[u8]]) -> Option<ClientConfig> {
    let mut config = ClientConfig::builder_with_provider(Arc::new(ring::default_provider()))
        .with_safe_default_protocol_versions()
        .ok()?
        .with_platform_verifier()
        .ok()?
        .with_no_client_auth();

    config.alpn_protocols = protocols.iter().map(|protocol| protocol.to_vec()).collect();
    Some(config)
}

/// The configuration requests to a server go out with, offering HTTP/2 where the server has it.
#[must_use]
pub fn for_requests() -> Option<ClientConfig> {
    trusting_the_system(&FOR_REQUESTS)
}

/// The configuration live connections to a server go out with, made once.
#[must_use]
pub fn for_sockets() -> Option<Arc<ClientConfig>> {
    static MADE: OnceLock<Option<Arc<ClientConfig>>> = OnceLock::new();

    MADE.get_or_init(|| trusting_the_system(&FOR_SOCKETS).map(Arc::new))
        .clone()
}

/// A client for asking servers, trusting what the system trusts, offering HTTP/2 where a server
/// has it and giving up on a server that does not answer a connection within `connecting`.
///
/// # Errors
///
/// When the client cannot be made.
pub fn a_client(
    builder: reqwest::ClientBuilder,
    connecting: std::time::Duration,
) -> Result<reqwest::Client, reqwest::Error> {
    let builder = builder
        .connect_timeout(connecting)
        .http2_adaptive_window(true);

    match for_requests() {
        Some(config) => builder.use_preconfigured_tls(config),
        None => builder,
    }
    .build()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn offers_http2_to_requests_and_only_http1_to_live_connections() {
        let requests = for_requests().expect("a configuration");
        let sockets = for_sockets().expect("a configuration");

        assert_eq!(
            requests.alpn_protocols,
            vec![b"h2".to_vec(), b"http/1.1".to_vec()]
        );
        assert_eq!(sockets.alpn_protocols, vec![b"http/1.1".to_vec()]);
        assert!(Arc::ptr_eq(
            &sockets,
            &for_sockets().expect("a configuration")
        ));
    }

    #[test]
    fn makes_a_client_with_the_systems_trust() {
        assert!(a_client(
            reqwest::Client::builder(),
            std::time::Duration::from_secs(1)
        )
        .is_ok());
    }
}
