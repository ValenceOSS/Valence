use super::caster::{CastPlayed, Caster, Told};
use super::devices::CastDevice;
use super::frame::{read_message, write_message, CastMessage, Payload};
use reqwest::Url;
use serde_json::{json, Value};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::sync::mpsc;
use tokio_rustls::rustls::crypto::ring;
use tokio_rustls::rustls::pki_types::{PrivateKeyDer, PrivatePkcs8KeyDer};
use tokio_rustls::rustls::ServerConfig;
use tokio_rustls::TlsAcceptor;

const RECEIVER: &str = "urn:x-cast:com.google.cast.receiver";
const MEDIA: &str = "urn:x-cast:com.google.cast.media";
const TRANSPORT: &str = "web-5";

type Heard = Arc<Mutex<Vec<(String, String, Value)>>>;

struct FakeDevice {
    address: SocketAddr,
    heard: Heard,
    say: mpsc::UnboundedSender<CastMessage>,
}

#[derive(Default)]
struct Playing {
    is_running: bool,
    state: &'static str,
    at: f64,
}

fn to_the_sender(source: &str, namespace: &str, payload: &Value) -> CastMessage {
    CastMessage::text(source, "sender-0", namespace, payload.to_string())
}

fn receiver_status(request_id: &Value, is_running: bool) -> CastMessage {
    let applications = if is_running {
        json!([{ "appId": "CC1AD845", "sessionId": "s-1", "transportId": TRANSPORT }])
    } else {
        json!([])
    };

    to_the_sender(
        "receiver-0",
        RECEIVER,
        &json!({
            "type": "RECEIVER_STATUS",
            "requestId": request_id,
            "status": { "applications": applications, "volume": { "level": 1.0 } },
        }),
    )
}

fn media_status(request_id: &Value, playing: &Playing) -> CastMessage {
    to_the_sender(
        TRANSPORT,
        MEDIA,
        &json!({
            "type": "MEDIA_STATUS",
            "requestId": request_id,
            "status": [{
                "mediaSessionId": 7,
                "playerState": playing.state,
                "currentTime": playing.at,
            }],
        }),
    )
}

/// What a fake device answers to each message, as a Chromecast running the Default Media Receiver
/// would.
fn answer(
    said: &CastMessage,
    payload: &Value,
    playing: &mut Playing,
    refuses: bool,
) -> Option<CastMessage> {
    let request_id = payload["requestId"].clone();
    let kind = payload["type"].as_str().unwrap_or_default();

    match (said.namespace.as_str(), kind) {
        ("urn:x-cast:com.google.cast.tp.heartbeat", "PING") => Some(to_the_sender(
            "receiver-0",
            "urn:x-cast:com.google.cast.tp.heartbeat",
            &json!({ "type": "PONG" }),
        )),
        (RECEIVER, "LAUNCH") => {
            playing.is_running = true;
            Some(receiver_status(&request_id, true))
        }
        (RECEIVER, "STOP") => {
            playing.is_running = false;
            Some(receiver_status(&request_id, false))
        }
        (RECEIVER, "GET_STATUS" | "SET_VOLUME") => {
            Some(receiver_status(&request_id, playing.is_running))
        }
        (MEDIA, "LOAD") if refuses => Some(to_the_sender(
            TRANSPORT,
            MEDIA,
            &json!({ "type": "LOAD_FAILED", "requestId": request_id }),
        )),
        (MEDIA, "LOAD") => {
            playing.state = "PLAYING";
            playing.at = payload["currentTime"].as_f64().unwrap_or_default();
            Some(media_status(&request_id, playing))
        }
        (MEDIA, "PAUSE") => {
            playing.state = "PAUSED";
            Some(media_status(&request_id, playing))
        }
        (MEDIA, "PLAY") => {
            playing.state = "PLAYING";
            Some(media_status(&request_id, playing))
        }
        (MEDIA, "SEEK") => {
            playing.at = payload["currentTime"].as_f64().unwrap_or_default();
            Some(media_status(&request_id, playing))
        }
        (MEDIA, "GET_STATUS") => Some(media_status(&request_id, playing)),
        _ => None,
    }
}

/// A Cast device on 127.0.0.1, with a certificate it signed itself as a real one does.
async fn a_fake_device(refuses: bool) -> FakeDevice {
    let made = rcgen::generate_simple_self_signed(vec![String::from("Chromecast")]).unwrap();
    let key = PrivateKeyDer::Pkcs8(PrivatePkcs8KeyDer::from(made.signing_key.serialize_der()));
    let config = ServerConfig::builder_with_provider(Arc::new(ring::default_provider()))
        .with_safe_default_protocol_versions()
        .unwrap()
        .with_no_client_auth()
        .with_single_cert(vec![made.cert.der().clone()], key)
        .unwrap();
    let acceptor = TlsAcceptor::from(Arc::new(config));
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let heard: Heard = Arc::new(Mutex::new(Vec::new()));
    let (say, mut to_say) = mpsc::unbounded_channel::<CastMessage>();
    let hearing = Arc::clone(&heard);

    tokio::spawn(async move {
        let (stream, _) = listener.accept().await.unwrap();
        let secure = acceptor.accept(stream).await.unwrap();
        let (mut reading, mut writing) = tokio::io::split(secure);
        let mut playing = Playing {
            state: "IDLE",
            ..Playing::default()
        };

        loop {
            let reply = tokio::select! {
                said = to_say.recv() => said,
                read = read_message(&mut reading) => {
                    let Ok(said) = read else { break };
                    let Payload::Text(text) = &said.payload else { continue };
                    let payload: Value = serde_json::from_str(text).unwrap();

                    hearing.lock().unwrap().push((
                        said.namespace.clone(),
                        said.destination.clone(),
                        payload.clone(),
                    ));

                    answer(&said, &payload, &mut playing, refuses)
                }
            };

            if let Some(reply) = reply {
                if write_message(&mut writing, &reply).await.is_err() {
                    break;
                }
            }
        }
    });

    FakeDevice {
        address,
        heard,
        say,
    }
}

impl FakeDevice {
    fn as_found(&self) -> CastDevice {
        CastDevice {
            id: String::from("Chromecast-fake._googlecast._tcp.local."),
            name: String::from("Living Room TV"),
            model: Some(String::from("Chromecast")),
            address: self.address,
        }
    }

    fn heard(&self, kind: &str) -> Vec<(String, String, Value)> {
        self.heard
            .lock()
            .unwrap()
            .iter()
            .filter(|(_, _, payload)| payload["type"] == kind)
            .cloned()
            .collect()
    }
}

struct Listening {
    caster: Arc<Caster>,
    told: Arc<Mutex<Vec<Told>>>,
}

fn a_caster() -> Listening {
    let told = Arc::new(Mutex::new(Vec::new()));
    let telling = Arc::clone(&told);
    let caster = Arc::new(Caster::new(Arc::new(move |said| {
        telling.lock().unwrap().push(said);
    })));

    Listening { caster, told }
}

async fn until(what: impl Fn() -> bool) {
    tokio::time::timeout(Duration::from_secs(5), async {
        while !what() {
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .unwrap();
}

impl Listening {
    fn was_told(&self, said: &Told) -> bool {
        self.told.lock().unwrap().contains(said)
    }

    fn last_state(&self) -> Option<&'static str> {
        self.told
            .lock()
            .unwrap()
            .iter()
            .rev()
            .find_map(|said| match said {
                Told::Changed(now) => Some(now.state),
                Told::Played(_) => None,
            })
    }
}

const STREAM: &str = "http://localhost:8420/api/playback/cast/ticket/master.m3u8";

#[tokio::test]
async fn launches_the_receiver_loads_the_stream_and_follows_it() {
    let device = a_fake_device(false).await;
    let listening = a_caster();
    let caster = &listening.caster;

    caster.heard_devices(vec![device.as_found()]);
    assert_eq!(listening.last_state(), Some("available"));

    assert!(caster.connect(&device.as_found().id).await);
    assert_eq!(caster.now().state, "connected");
    assert_eq!(caster.now().device, Some(device.as_found()));
    assert_eq!(device.heard("LAUNCH")[0].2["appId"], "CC1AD845");

    until(|| device.heard("CONNECT").len() == 2).await;

    let connected_to: Vec<String> = device
        .heard("CONNECT")
        .into_iter()
        .map(|(_, destination, _)| destination)
        .collect();

    assert_eq!(connected_to, vec!["receiver-0", TRANSPORT]);

    assert!(
        caster
            .load(
                Url::parse(STREAM).unwrap(),
                "application/x-mpegurl",
                "Arrival",
                61.5
            )
            .await
    );

    let (_, destination, loaded) = device.heard("LOAD").remove(0);

    assert_eq!(destination, TRANSPORT);
    assert_eq!(loaded["sessionId"], "s-1");
    assert_eq!(
        loaded["media"]["contentId"],
        "http://127.0.0.1:8420/api/playback/cast/ticket/master.m3u8"
    );
    assert_eq!(loaded["media"]["contentType"], "application/x-mpegurl");
    assert_eq!(loaded["media"]["streamType"], "BUFFERED");
    assert_eq!(loaded["media"]["metadata"]["title"], "Arrival");
    assert_eq!(loaded["currentTime"], 61.5);
    assert_eq!(loaded["autoplay"], true);

    until(|| {
        listening.was_told(&Told::Played(CastPlayed {
            seconds: 61.5,
            is_playing: true,
        }))
    })
    .await;

    caster.pause();
    until(|| {
        listening.was_told(&Told::Played(CastPlayed {
            seconds: 61.5,
            is_playing: false,
        }))
    })
    .await;

    caster.seek(1500.0);
    until(|| {
        listening.was_told(&Told::Played(CastPlayed {
            seconds: 1500.0,
            is_playing: false,
        }))
    })
    .await;

    caster.set_volume(0.4);
    until(|| !device.heard("SET_VOLUME").is_empty()).await;
    assert_eq!(device.heard("SET_VOLUME")[0].2["volume"]["level"], 0.4);

    caster.disconnect().await;

    assert_eq!(caster.now().state, "available");
    until(|| !device.heard("STOP").is_empty()).await;
    assert!(device
        .heard("STOP")
        .iter()
        .any(|(namespace, _, payload)| namespace == RECEIVER && payload["sessionId"] == "s-1"));
}

#[tokio::test]
async fn asks_where_the_stream_has_got_to_while_it_plays() {
    let device = a_fake_device(false).await;
    let listening = a_caster();
    let caster = &listening.caster;

    caster.heard_devices(vec![device.as_found()]);
    assert!(caster.connect(&device.as_found().id).await);
    assert!(
        caster
            .load(
                Url::parse(STREAM).unwrap(),
                "application/x-mpegurl",
                "Arrival",
                0.0
            )
            .await
    );

    until(|| {
        device
            .heard("GET_STATUS")
            .iter()
            .any(|(namespace, _, _)| namespace == MEDIA)
    })
    .await;
}

#[tokio::test]
async fn lets_the_cast_go_when_the_device_ends_it() {
    let device = a_fake_device(false).await;
    let listening = a_caster();
    let caster = &listening.caster;

    caster.heard_devices(vec![device.as_found()]);
    assert!(caster.connect(&device.as_found().id).await);

    device.say.send(receiver_status(&json!(0), false)).unwrap();

    until(|| listening.last_state() == Some("available")).await;
    assert_eq!(caster.now().device, None);
}

#[tokio::test]
async fn says_the_device_did_not_take_a_stream_it_refused() {
    let device = a_fake_device(true).await;
    let listening = a_caster();
    let caster = &listening.caster;

    caster.heard_devices(vec![device.as_found()]);
    assert!(caster.connect(&device.as_found().id).await);

    assert!(
        !caster
            .load(
                Url::parse(STREAM).unwrap(),
                "application/x-mpegurl",
                "Arrival",
                0.0
            )
            .await
    );
}

#[tokio::test]
async fn is_back_where_it_was_when_a_device_cannot_be_reached() {
    let nobody = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = nobody.local_addr().unwrap();

    drop(nobody);

    let listening = a_caster();
    let caster = &listening.caster;
    let gone = CastDevice {
        id: String::from("gone"),
        name: String::from("Gone"),
        model: None,
        address,
    };

    caster.heard_devices(vec![gone]);

    assert!(!caster.connect("gone").await);
    assert_eq!(caster.now().state, "available");
    assert!(listening
        .told
        .lock()
        .unwrap()
        .iter()
        .any(|said| matches!(said, Told::Changed(now) if now.state == "connecting")));
}

#[tokio::test]
async fn connects_to_nothing_it_has_not_heard_of() {
    let listening = a_caster();

    assert!(!listening.caster.connect("nobody").await);
    assert!(
        !listening
            .caster
            .load(
                Url::parse(STREAM).unwrap(),
                "application/x-mpegurl",
                "Arrival",
                0.0
            )
            .await
    );
}
