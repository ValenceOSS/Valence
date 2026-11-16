//! One connection to a Cast device: TLS to its port, messages written in turn, every message heard
//! passed to whoever is listening, and the heartbeat that keeps it open.
//!
//! A Cast device presents a certificate it signed itself, which no authority vouches for, so this
//! connection, and no other in the app, accepts the device's certificate whatever it is. The
//! handshake's signatures are still checked, so what is accepted is the device at that address
//! rather than nobody in particular.

use std::net::{IpAddr, SocketAddr};
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::{Arc, Mutex, PoisonError};
use std::time::{Duration, Instant};

use serde_json::Value;
use tokio::io::{ReadHalf, WriteHalf};
use tokio::net::TcpStream;
use tokio::sync::{broadcast, mpsc, oneshot};
use tokio_rustls::client::TlsStream;
use tokio_rustls::rustls::client::danger::{
    HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier,
};
use tokio_rustls::rustls::crypto::{
    ring, verify_tls12_signature, verify_tls13_signature, CryptoProvider,
};
use tokio_rustls::rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use tokio_rustls::rustls::{ClientConfig, DigitallySignedStruct, SignatureScheme};
use tokio_rustls::TlsConnector;
use tokio_util::sync::CancellationToken;

use super::frame::{read_message, write_message, CastMessage};
use super::messages::{hear, ping, pong, Heard, Incoming, HEARTBEAT, PLATFORM, SENDER};

const OPEN_WITHIN: Duration = Duration::from_secs(5);
const PING_EVERY: Duration = Duration::from_secs(5);
const GONE_AFTER: Duration = Duration::from_secs(20);
const HEARD_BACKLOG: usize = 64;

/// Why a device could not be asked something.
#[derive(Debug, thiserror::Error)]
pub enum LinkError {
    /// The device could not be reached, or the connection failed.
    #[error("the device could not be reached: {0}")]
    Io(#[from] std::io::Error),
    /// The secure connection could not be set up.
    #[error("the secure connection could not be set up: {0}")]
    Tls(#[from] tokio_rustls::rustls::Error),
    /// The connection closed before the device answered.
    #[error("the connection closed")]
    Closed,
    /// The device did not answer in time.
    #[error("the device did not answer in time")]
    TimedOut,
    /// The device refused, saying why.
    #[error("the device refused: {0}")]
    Refused(String),
}

/// Accepts whatever certificate a Cast device presents, checking only that the handshake was signed
/// by the key in it.
#[derive(Debug)]
struct AnyCertificate(Arc<CryptoProvider>);

impl ServerCertVerifier for AnyCertificate {
    fn verify_server_cert(
        &self,
        _end_entity: &CertificateDer<'_>,
        _intermediates: &[CertificateDer<'_>],
        _server_name: &ServerName<'_>,
        _ocsp_response: &[u8],
        _now: UnixTime,
    ) -> Result<ServerCertVerified, tokio_rustls::rustls::Error> {
        Ok(ServerCertVerified::assertion())
    }

    fn verify_tls12_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, tokio_rustls::rustls::Error> {
        verify_tls12_signature(
            message,
            cert,
            dss,
            &self.0.signature_verification_algorithms,
        )
    }

    fn verify_tls13_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, tokio_rustls::rustls::Error> {
        verify_tls13_signature(
            message,
            cert,
            dss,
            &self.0.signature_verification_algorithms,
        )
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        self.0.signature_verification_algorithms.supported_schemes()
    }
}

/// The TLS settings for a Cast device, and for nothing else.
///
/// # Errors
///
/// When the TLS library cannot offer its usual protocol versions.
pub fn tls_for_a_cast_device() -> Result<ClientConfig, tokio_rustls::rustls::Error> {
    let provider = Arc::new(ring::default_provider());

    Ok(ClientConfig::builder_with_provider(Arc::clone(&provider))
        .with_safe_default_protocol_versions()?
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(AnyCertificate(provider)))
        .with_no_client_auth())
}

enum Outgoing {
    Message(CastMessage),
    Flushed(oneshot::Sender<()>),
}

/// An open connection to a Cast device.
pub struct Link {
    out: mpsc::UnboundedSender<Outgoing>,
    heard: broadcast::Sender<Arc<Incoming>>,
    next_request: AtomicI64,
    local: IpAddr,
    closed: CancellationToken,
}

impl Drop for Link {
    fn drop(&mut self) {
        self.closed.cancel();
    }
}

impl Link {
    /// Opens a connection to the device at `address`.
    ///
    /// # Errors
    ///
    /// When the device cannot be reached, or will not set up a secure connection.
    pub async fn open(address: SocketAddr) -> Result<Self, LinkError> {
        let stream = tokio::time::timeout(OPEN_WITHIN, TcpStream::connect(address))
            .await
            .map_err(|_| LinkError::TimedOut)??;
        let local = stream.local_addr()?.ip();
        let connector = TlsConnector::from(Arc::new(tls_for_a_cast_device()?));
        let secure = tokio::time::timeout(
            OPEN_WITHIN,
            connector.connect(ServerName::IpAddress(address.ip().into()), stream),
        )
        .await
        .map_err(|_| LinkError::TimedOut)??;
        let (reading, writing) = tokio::io::split(secure);
        let (out, outgoing) = mpsc::unbounded_channel();
        let (heard, _) = broadcast::channel(HEARD_BACKLOG);
        let closed = CancellationToken::new();
        let last_heard = Arc::new(Mutex::new(Instant::now()));

        crate::runtime::spawn(write_in_turn(writing, outgoing, closed.clone()));
        crate::runtime::spawn(hear_in_turn(
            reading,
            out.clone(),
            heard.clone(),
            Arc::clone(&last_heard),
            closed.clone(),
        ));
        crate::runtime::spawn(keep_alive(out.clone(), last_heard, closed.clone()));

        Ok(Self {
            out,
            heard,
            next_request: AtomicI64::new(1),
            local,
            closed,
        })
    }

    /// The address of this computer the device sees it at.
    #[must_use]
    pub fn local_ip(&self) -> IpAddr {
        self.local
    }

    /// Resolves once the connection has closed.
    pub async fn closed(&self) {
        self.closed.cancelled().await;
    }

    /// Every message heard from now on.
    #[must_use]
    pub fn hear(&self) -> broadcast::Receiver<Arc<Incoming>> {
        self.heard.subscribe()
    }

    /// A request id not used before on this connection.
    pub fn next_request(&self) -> i64 {
        self.next_request.fetch_add(1, Ordering::Relaxed)
    }

    /// Sends `payload` to `destination` on `namespace`, without waiting for it to be written.
    pub fn send(&self, namespace: &str, destination: &str, payload: &Value) {
        let _ = self.out.send(Outgoing::Message(CastMessage::text(
            SENDER,
            destination,
            namespace,
            payload.to_string(),
        )));
    }

    /// Waits until everything sent so far has been written, or the connection has closed.
    pub async fn flush(&self) {
        let (written, flushed) = oneshot::channel();

        if self.out.send(Outgoing::Flushed(written)).is_ok() {
            let _ = tokio::time::timeout(OPEN_WITHIN, flushed).await;
        }
    }

    /// Sends what `make` writes for a new request id, then waits up to `patience` for a message
    /// `answer` takes as the answer. A refusal of that request is an answer too.
    ///
    /// # Errors
    ///
    /// When the device refuses, the connection closes, or nothing answers in time.
    pub async fn ask<T>(
        &self,
        namespace: &str,
        destination: &str,
        make: impl FnOnce(i64) -> Value,
        mut answer: impl FnMut(&Incoming, i64) -> Option<T>,
        patience: Duration,
    ) -> Result<T, LinkError> {
        let mut hearing = self.hear();
        let request_id = self.next_request();

        self.send(namespace, destination, &make(request_id));

        let waiting = async {
            loop {
                let incoming = tokio::select! {
                    () = self.closed.cancelled() => return Err(LinkError::Closed),
                    heard = hearing.recv() => heard,
                };

                match incoming {
                    Ok(incoming) => {
                        if let Some(answered) = answer(&incoming, request_id) {
                            return Ok(answered);
                        }

                        if let (Heard::Refused(why), Some(answering)) =
                            (&incoming.heard, incoming.request_id)
                        {
                            if answering == request_id {
                                return Err(LinkError::Refused(why.clone()));
                            }
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => {}
                    Err(broadcast::error::RecvError::Closed) => return Err(LinkError::Closed),
                }
            }
        };

        tokio::time::timeout(patience, waiting)
            .await
            .map_err(|_| LinkError::TimedOut)?
    }
}

/// Writes each message in the order it was sent, until the connection closes.
async fn write_in_turn(
    mut writing: WriteHalf<TlsStream<TcpStream>>,
    mut outgoing: mpsc::UnboundedReceiver<Outgoing>,
    closed: CancellationToken,
) {
    loop {
        let next = tokio::select! {
            () = closed.cancelled() => break,
            next = outgoing.recv() => next,
        };

        match next {
            Some(Outgoing::Message(message)) => {
                if write_message(&mut writing, &message).await.is_err() {
                    closed.cancel();
                    break;
                }
            }
            Some(Outgoing::Flushed(written)) => {
                let _ = written.send(());
            }
            None => break,
        }
    }
}

/// Reads each message as it arrives, answering the device's heartbeat and passing the rest on,
/// until the connection closes.
async fn hear_in_turn(
    mut reading: ReadHalf<TlsStream<TcpStream>>,
    out: mpsc::UnboundedSender<Outgoing>,
    heard: broadcast::Sender<Arc<Incoming>>,
    last_heard: Arc<Mutex<Instant>>,
    closed: CancellationToken,
) {
    loop {
        let message = tokio::select! {
            () = closed.cancelled() => break,
            message = read_message(&mut reading) => message,
        };

        let Ok(message) = message else {
            closed.cancel();
            break;
        };

        *last_heard.lock().unwrap_or_else(PoisonError::into_inner) = Instant::now();

        let Some(incoming) = hear(&message) else {
            continue;
        };

        if incoming.namespace == HEARTBEAT && incoming.heard == Heard::Ping {
            let _ = out.send(Outgoing::Message(CastMessage::text(
                SENDER,
                &message.source,
                HEARTBEAT,
                pong().to_string(),
            )));
        }

        let _ = heard.send(Arc::new(incoming));
    }
}

/// Says this side is still there every few seconds, and closes the connection once the device has
/// said nothing for too long.
async fn keep_alive(
    out: mpsc::UnboundedSender<Outgoing>,
    last_heard: Arc<Mutex<Instant>>,
    closed: CancellationToken,
) {
    let mut beat = tokio::time::interval(PING_EVERY);

    loop {
        tokio::select! {
            () = closed.cancelled() => break,
            _ = beat.tick() => {}
        }

        let silent_for = last_heard
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .elapsed();

        if silent_for > GONE_AFTER {
            closed.cancel();
            break;
        }

        let _ = out.send(Outgoing::Message(CastMessage::text(
            SENDER,
            PLATFORM,
            HEARTBEAT,
            ping().to_string(),
        )));
    }
}
