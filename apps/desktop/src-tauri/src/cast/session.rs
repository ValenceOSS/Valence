//! A cast in progress: the Default Media Receiver launched on a device, a virtual connection to it,
//! and the media it was given to play.

use std::net::SocketAddr;
use std::sync::{Mutex, PoisonError};
use std::time::Duration;

use super::link::{Link, LinkError};
use super::messages::{
    close, connect, control, get_status, launch, load, seek, set_volume, stop_app, Heard, Incoming,
    LoadAsk, MediaNow, RunningApp, CONNECTION, DEFAULT_MEDIA_RECEIVER, MEDIA, PLATFORM, RECEIVER,
};

const LAUNCH_WITHIN: Duration = Duration::from_secs(20);
const LOAD_WITHIN: Duration = Duration::from_secs(30);

/// The receiver application running on a device for this app, and the connection to it.
pub struct Session {
    link: Link,
    transport: String,
    receiver_id: String,
    media: Mutex<Option<i64>>,
}

impl Session {
    /// Connects to the device at `address` and launches the Default Media Receiver on it, or joins
    /// it where it is already running.
    ///
    /// # Errors
    ///
    /// When the device cannot be reached, or will not run the receiver.
    pub async fn start(address: SocketAddr) -> Result<Self, LinkError> {
        let link = Link::open(address).await?;

        link.send(CONNECTION, PLATFORM, &connect());

        let app = link
            .ask(
                RECEIVER,
                PLATFORM,
                |request_id| launch(request_id, DEFAULT_MEDIA_RECEIVER),
                |incoming, _| match &incoming.heard {
                    Heard::ReceiverStatus(apps) => ready_receiver(apps),
                    _ => None,
                },
                LAUNCH_WITHIN,
            )
            .await?;

        let (Some(transport), session) = (app.transport_id, app.session_id) else {
            return Err(LinkError::Closed);
        };

        link.send(CONNECTION, &transport, &connect());

        Ok(Self {
            link,
            transport,
            receiver_id: session,
            media: Mutex::new(None),
        })
    }

    /// The connection to the device.
    #[must_use]
    pub fn link(&self) -> &Link {
        &self.link
    }

    /// The media session the receiver holds, once something has been loaded.
    #[must_use]
    pub fn media_session(&self) -> Option<i64> {
        *self.media.lock().unwrap_or_else(PoisonError::into_inner)
    }

    /// Asks the receiver to play `ask`, waiting until it says it holds it.
    ///
    /// # Errors
    ///
    /// When the receiver refuses it, the connection closes, or it does not answer in time.
    pub async fn load(&self, ask: &LoadAsk) -> Result<(), LinkError> {
        let held = self
            .link
            .ask(
                MEDIA,
                &self.transport,
                |request_id| load(request_id, &self.receiver_id, ask),
                |incoming, request_id| match &incoming.heard {
                    Heard::MediaStatus(media) if incoming.request_id == Some(request_id) => {
                        media.first().map(|now| now.media_session_id)
                    }
                    _ => None,
                },
                LOAD_WITHIN,
            )
            .await?;

        self.note_media(held);
        Ok(())
    }

    /// Notes the media session the receiver says it holds.
    pub fn note_media(&self, media_session_id: i64) {
        *self.media.lock().unwrap_or_else(PoisonError::into_inner) = Some(media_session_id);
    }

    /// Reads what the receiver said about its media, noting the session it holds.
    pub fn heard_media<'a>(&self, incoming: &'a Incoming) -> Option<&'a MediaNow> {
        let Heard::MediaStatus(media) = &incoming.heard else {
            return None;
        };

        let now = media.first()?;

        self.note_media(now.media_session_id);
        Some(now)
    }

    /// Sends one of the media controls, where there is media to control.
    fn control(&self, kind: &str) {
        if let Some(media) = self.media_session() {
            let request_id = self.link.next_request();

            self.link
                .send(MEDIA, &self.transport, &control(request_id, kind, media));
        }
    }

    /// Plays the media.
    pub fn play(&self) {
        self.control("PLAY");
    }

    /// Pauses the media.
    pub fn pause(&self) {
        self.control("PAUSE");
    }

    /// Moves the media to `seconds`.
    pub fn seek(&self, seconds: f64) {
        if let Some(media) = self.media_session() {
            let request_id = self.link.next_request();

            self.link
                .send(MEDIA, &self.transport, &seek(request_id, media, seconds));
        }
    }

    /// Sets the device's volume.
    pub fn set_volume(&self, level: f64) {
        let request_id = self.link.next_request();

        self.link
            .send(RECEIVER, PLATFORM, &set_volume(request_id, level));
    }

    /// Asks the receiver where its media has got to.
    pub fn ask_where(&self) {
        let request_id = self.link.next_request();

        self.link
            .send(MEDIA, &self.transport, &get_status(request_id));
    }

    /// Whether `incoming` says this cast is over: the receiver closed its connection, or the device
    /// is no longer running it.
    #[must_use]
    pub fn is_ended_by(&self, incoming: &Incoming) -> bool {
        match &incoming.heard {
            Heard::Close => incoming.source == self.transport || incoming.source == PLATFORM,
            Heard::ReceiverStatus(apps) => {
                !apps.iter().any(|app| app.session_id == self.receiver_id)
            }
            _ => false,
        }
    }

    /// Stops the receiver on the device and closes the connection.
    pub async fn end(&self) {
        let request_id = self.link.next_request();

        self.control("STOP");
        self.link
            .send(RECEIVER, PLATFORM, &stop_app(request_id, &self.receiver_id));
        self.link.send(CONNECTION, &self.transport, &close());
        self.link.send(CONNECTION, PLATFORM, &close());
        self.link.flush().await;
    }
}

/// The Default Media Receiver among the applications a device runs, once it can be sent messages.
fn ready_receiver(apps: &[RunningApp]) -> Option<RunningApp> {
    apps.iter()
        .find(|app| app.app_id == DEFAULT_MEDIA_RECEIVER && app.transport_id.is_some())
        .cloned()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn app(app_id: &str, transport_id: Option<&str>) -> RunningApp {
        RunningApp {
            app_id: app_id.to_owned(),
            session_id: String::from("s-1"),
            transport_id: transport_id.map(str::to_owned),
        }
    }

    #[test]
    fn waits_for_the_receiver_to_be_ready_for_messages() {
        assert_eq!(ready_receiver(&[app(DEFAULT_MEDIA_RECEIVER, None)]), None);
        assert_eq!(
            ready_receiver(&[
                app("E8C28D3C", Some("web-1")),
                app(DEFAULT_MEDIA_RECEIVER, Some("web-5"))
            ]),
            Some(app(DEFAULT_MEDIA_RECEIVER, Some("web-5")))
        );
    }
}
