//! What is said on a Cast connection: the JSON each namespace's messages carry, written for a
//! device and read from one.

use serde::Deserialize;
use serde_json::{json, Value};

use super::frame::{CastMessage, Payload};

/// The namespace a virtual connection to the device or an application is opened and closed on.
pub const CONNECTION: &str = "urn:x-cast:com.google.cast.tp.connection";

/// The namespace each side says it is still there on.
pub const HEARTBEAT: &str = "urn:x-cast:com.google.cast.tp.heartbeat";

/// The namespace applications are launched, stopped and asked about on, and the volume set.
pub const RECEIVER: &str = "urn:x-cast:com.google.cast.receiver";

/// The namespace media is loaded and played on.
pub const MEDIA: &str = "urn:x-cast:com.google.cast.media";

/// The device itself, as a destination.
pub const PLATFORM: &str = "receiver-0";

/// This app, as a source.
pub const SENDER: &str = "sender-0";

/// Google's Default Media Receiver, the receiver the web player's Cast SDK and the phone app
/// both launch.
pub const DEFAULT_MEDIA_RECEIVER: &str = "CC1AD845";

/// What a device is asked to play.
#[derive(Clone, Debug, PartialEq)]
pub struct LoadAsk {
    /// The whole address the device fetches it from.
    pub url: String,
    /// Its media type.
    pub content_type: String,
    /// What it is called, for the device to show.
    pub title: String,
    /// Where to start, in seconds.
    pub start_seconds: f64,
}

/// Opens a virtual connection.
#[must_use]
pub fn connect() -> Value {
    json!({ "type": "CONNECT", "origin": {} })
}

/// Closes a virtual connection.
#[must_use]
pub fn close() -> Value {
    json!({ "type": "CLOSE" })
}

/// Says this side is still there.
#[must_use]
pub fn ping() -> Value {
    json!({ "type": "PING" })
}

/// Answers the other side saying it is still there.
#[must_use]
pub fn pong() -> Value {
    json!({ "type": "PONG" })
}

/// Asks the device to launch an application, or answer with it where it is already running.
#[must_use]
pub fn launch(request_id: i64, app_id: &str) -> Value {
    json!({ "type": "LAUNCH", "requestId": request_id, "appId": app_id })
}

/// Asks the device to stop an application it is running.
#[must_use]
pub fn stop_app(request_id: i64, session_id: &str) -> Value {
    json!({ "type": "STOP", "requestId": request_id, "sessionId": session_id })
}

/// Asks the device, or an application's media channel, how it stands.
#[must_use]
pub fn get_status(request_id: i64) -> Value {
    json!({ "type": "GET_STATUS", "requestId": request_id })
}

/// Sets the device's volume, from nothing to all of it.
#[must_use]
pub fn set_volume(request_id: i64, level: f64) -> Value {
    json!({
        "type": "SET_VOLUME",
        "requestId": request_id,
        "volume": { "level": level.clamp(0.0, 1.0) },
    })
}

/// Asks the media receiver to play something, as the web player's Cast SDK does: a buffered
/// stream with generic metadata carrying its title, starting where it was and playing at once.
#[must_use]
pub fn load(request_id: i64, session_id: &str, ask: &LoadAsk) -> Value {
    json!({
        "type": "LOAD",
        "requestId": request_id,
        "sessionId": session_id,
        "media": {
            "contentId": ask.url,
            "contentUrl": ask.url,
            "contentType": ask.content_type,
            "streamType": "BUFFERED",
            "metadata": { "metadataType": 0, "title": ask.title },
        },
        "currentTime": ask.start_seconds.max(0.0),
        "autoplay": true,
    })
}

/// One of the media receiver's controls for the media it holds: `PLAY`, `PAUSE` or `STOP`.
#[must_use]
pub fn control(request_id: i64, kind: &str, media_session_id: i64) -> Value {
    json!({ "type": kind, "requestId": request_id, "mediaSessionId": media_session_id })
}

/// Moves the media receiver to `seconds` in the media it holds.
#[must_use]
pub fn seek(request_id: i64, media_session_id: i64, seconds: f64) -> Value {
    json!({
        "type": "SEEK",
        "requestId": request_id,
        "mediaSessionId": media_session_id,
        "currentTime": seconds.max(0.0),
    })
}

/// An application the device is running.
#[derive(Clone, Debug, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(
    clippy::struct_field_names,
    reason = "the fields are named as the device names them"
)]
pub struct RunningApp {
    /// Which application.
    pub app_id: String,
    /// Its session on the device.
    pub session_id: String,
    /// Where to send it messages, once it is ready for them.
    #[serde(default)]
    pub transport_id: Option<String>,
}

/// How a piece of media stands on the device.
#[derive(Clone, Debug, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaNow {
    /// The media session it is held in.
    pub media_session_id: i64,
    /// `IDLE`, `LOADING`, `BUFFERING`, `PLAYING` or `PAUSED`.
    #[serde(default)]
    pub player_state: String,
    /// How far in it is, in seconds.
    #[serde(default)]
    pub current_time: f64,
    /// Why it is idle, where it is.
    #[serde(default)]
    pub idle_reason: Option<String>,
}

impl MediaNow {
    /// Whether it is playing, or about to once it has enough of the stream.
    #[must_use]
    pub fn is_playing(&self) -> bool {
        matches!(self.player_state.as_str(), "PLAYING" | "BUFFERING")
    }
}

/// What a message from a device says, as far as this app needs to know.
#[derive(Clone, Debug, PartialEq)]
pub enum Heard {
    /// The device asks whether this side is still there.
    Ping,
    /// The device answers that it is.
    Pong,
    /// The device closed the virtual connection.
    Close,
    /// The applications the device is running.
    ReceiverStatus(Vec<RunningApp>),
    /// How the media on the device stands.
    MediaStatus(Vec<MediaNow>),
    /// The device refused what it was asked, saying why.
    Refused(String),
    /// Anything else.
    Other,
}

/// A message from a device, read.
#[derive(Clone, Debug, PartialEq)]
pub struct Incoming {
    /// Who sent it.
    pub source: String,
    /// The namespace it came on.
    pub namespace: String,
    /// The request it answers, where it answers one.
    pub request_id: Option<i64>,
    /// What it says.
    pub heard: Heard,
}

#[derive(Deserialize)]
struct Envelope {
    #[serde(rename = "type", default)]
    kind: String,
    #[serde(rename = "requestId", default)]
    request_id: Option<i64>,
    #[serde(default)]
    status: Option<Value>,
    #[serde(default)]
    reason: Option<String>,
}

#[derive(Deserialize, Default)]
struct ReceiverStatus {
    #[serde(default)]
    applications: Vec<RunningApp>,
}

/// Reads a device's message; nothing where it is not JSON text.
#[must_use]
pub fn hear(message: &CastMessage) -> Option<Incoming> {
    let Payload::Text(text) = &message.payload else {
        return None;
    };
    let envelope: Envelope = serde_json::from_str(text).ok()?;

    let heard = match envelope.kind.as_str() {
        "PING" => Heard::Ping,
        "PONG" => Heard::Pong,
        "CLOSE" => Heard::Close,
        "RECEIVER_STATUS" => Heard::ReceiverStatus(
            envelope
                .status
                .and_then(|status| serde_json::from_value::<ReceiverStatus>(status).ok())
                .unwrap_or_default()
                .applications,
        ),
        "MEDIA_STATUS" => Heard::MediaStatus(
            envelope
                .status
                .and_then(|status| serde_json::from_value::<Vec<MediaNow>>(status).ok())
                .unwrap_or_default(),
        ),
        "LAUNCH_ERROR"
        | "LOAD_FAILED"
        | "LOAD_CANCELLED"
        | "INVALID_REQUEST"
        | "INVALID_PLAYER_STATE" => {
            Heard::Refused(envelope.reason.unwrap_or_else(|| envelope.kind.clone()))
        }
        _ => Heard::Other,
    };

    Some(Incoming {
        source: message.source.clone(),
        namespace: message.namespace.clone(),
        request_id: envelope.request_id,
        heard,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn from_the_device(namespace: &str, payload: &str) -> CastMessage {
        CastMessage::text("receiver-0", SENDER, namespace, payload.to_owned())
    }

    #[test]
    fn asks_to_play_what_the_web_player_sends() {
        let asked = load(
            4,
            "session-1",
            &LoadAsk {
                url: String::from("http://192.168.1.20:8420/api/playback/cast/t/master.m3u8"),
                content_type: String::from("application/x-mpegurl"),
                title: String::from("Arrival"),
                start_seconds: 61.5,
            },
        );

        assert_eq!(
            asked,
            json!({
                "type": "LOAD",
                "requestId": 4,
                "sessionId": "session-1",
                "media": {
                    "contentId": "http://192.168.1.20:8420/api/playback/cast/t/master.m3u8",
                    "contentUrl": "http://192.168.1.20:8420/api/playback/cast/t/master.m3u8",
                    "contentType": "application/x-mpegurl",
                    "streamType": "BUFFERED",
                    "metadata": { "metadataType": 0, "title": "Arrival" },
                },
                "currentTime": 61.5,
                "autoplay": true,
            })
        );
    }

    #[test]
    fn launches_the_receiver_the_web_and_the_phone_use() {
        assert_eq!(
            launch(1, DEFAULT_MEDIA_RECEIVER),
            json!({ "type": "LAUNCH", "requestId": 1, "appId": "CC1AD845" })
        );
    }

    #[test]
    fn keeps_the_volume_between_nothing_and_all_of_it() {
        assert_eq!(set_volume(2, 1.4)["volume"]["level"], json!(1.0));
        assert_eq!(set_volume(2, -1.0)["volume"]["level"], json!(0.0));
    }

    #[test]
    fn never_seeks_before_the_start() {
        assert_eq!(seek(3, 7, -4.0)["currentTime"], json!(0.0));
    }

    #[test]
    fn hears_the_application_the_device_launched() {
        let heard = hear(&from_the_device(
            RECEIVER,
            r#"{"type":"RECEIVER_STATUS","requestId":1,"status":{"applications":[{"appId":"CC1AD845","sessionId":"s-1","transportId":"web-5","displayName":"Default Media Receiver"}],"volume":{"level":1}}}"#,
        ))
        .unwrap();

        assert_eq!(heard.request_id, Some(1));
        assert_eq!(
            heard.heard,
            Heard::ReceiverStatus(vec![RunningApp {
                app_id: String::from("CC1AD845"),
                session_id: String::from("s-1"),
                transport_id: Some(String::from("web-5")),
            }])
        );
    }

    #[test]
    fn hears_a_device_running_nothing() {
        let heard = hear(&from_the_device(
            RECEIVER,
            r#"{"type":"RECEIVER_STATUS","requestId":0,"status":{"volume":{"level":1}}}"#,
        ))
        .unwrap();

        assert_eq!(heard.heard, Heard::ReceiverStatus(Vec::new()));
    }

    #[test]
    fn hears_where_the_media_has_got_to() {
        let heard = hear(&from_the_device(
            MEDIA,
            r#"{"type":"MEDIA_STATUS","status":[{"mediaSessionId":7,"playerState":"PLAYING","currentTime":12.25,"media":{"duration":7200}}],"requestId":0}"#,
        ))
        .unwrap();

        let Heard::MediaStatus(media) = heard.heard else {
            panic!("not a media status");
        };

        assert_eq!(media[0].media_session_id, 7);
        assert!((media[0].current_time - 12.25).abs() < f64::EPSILON);
        assert!(media[0].is_playing());
    }

    #[test]
    fn hears_a_refusal_and_why() {
        let heard = hear(&from_the_device(
            MEDIA,
            r#"{"type":"LOAD_FAILED","requestId":9}"#,
        ))
        .unwrap();

        assert_eq!(heard.request_id, Some(9));
        assert_eq!(heard.heard, Heard::Refused(String::from("LOAD_FAILED")));
    }

    #[test]
    fn hears_the_heartbeat() {
        assert_eq!(
            hear(&from_the_device(HEARTBEAT, r#"{"type":"PING"}"#))
                .unwrap()
                .heard,
            Heard::Ping
        );
    }

    #[test]
    fn ignores_what_is_not_json() {
        assert!(hear(&from_the_device(MEDIA, "not json")).is_none());
        assert!(hear(&CastMessage {
            payload: Payload::Binary(vec![1, 2]),
            ..from_the_device(MEDIA, "")
        })
        .is_none());
    }
}
