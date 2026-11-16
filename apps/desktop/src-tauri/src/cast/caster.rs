//! Casting from this app: the devices there are to cast to, which one is being cast to, and
//! everything said about it, told to the page as it changes.

use std::net::{IpAddr, Ipv4Addr, UdpSocket};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use std::time::Duration;

use reqwest::Url;
use serde::Serialize;
use tokio::sync::broadcast::error::RecvError;

use super::devices::CastDevice;
use super::messages::LoadAsk;
use super::session::Session;

const ASK_WHERE_EVERY: Duration = Duration::from_secs(1);

/// Where casting stands, as the page is told it.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CastingNow {
    /// `unavailable`, `available`, `connecting` or `connected`.
    pub state: &'static str,
    /// The devices there are to cast to.
    pub devices: Vec<CastDevice>,
    /// The device being cast to, or connected to on the way.
    pub device: Option<CastDevice>,
}

/// How the media on the device being cast to stands, as the page is told it.
#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CastPlayed {
    /// How far in it is, in seconds.
    pub seconds: f64,
    /// Whether it is playing.
    pub is_playing: bool,
}

/// What the page is told.
#[derive(Clone, Debug, PartialEq)]
pub enum Told {
    /// Where casting stands changed.
    Changed(CastingNow),
    /// The device said how its media stands.
    Played(CastPlayed),
}

/// Who the page is told through.
pub type Tell = Arc<dyn Fn(Told) + Send + Sync>;

enum Connection {
    Idle,
    Connecting {
        device: CastDevice,
        attempt: u64,
    },
    Connected {
        device: CastDevice,
        attempt: u64,
        session: Arc<Session>,
    },
}

/// Casting from this app.
pub struct Caster {
    devices: Mutex<Vec<CastDevice>>,
    connection: Mutex<Connection>,
    attempts: AtomicU64,
    tell: Tell,
}

/// Takes what a mutex guards, whatever another thread was doing when it panicked.
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

/// The address a device is handed: `url`, with a server on this computer named by the address the
/// device reaches this computer at, since to a device `localhost` is itself.
#[must_use]
pub fn reachable_from(mut url: Url, here: IpAddr) -> Url {
    let host = url.host_str().unwrap_or_default();
    let is_this_computer = host.eq_ignore_ascii_case("localhost")
        || host
            .trim_start_matches('[')
            .trim_end_matches(']')
            .parse::<IpAddr>()
            .is_ok_and(|address| address.is_loopback() || address.is_unspecified());

    if is_this_computer {
        let _ = url.set_ip_host(here);
    }

    url
}

/// The address other devices on the network reach this computer at: the one it would send mDNS
/// from, or else the first ordinary IPv4 address it holds.
#[must_use]
pub fn this_computers_network_address() -> Option<IpAddr> {
    let probed = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0))
        .and_then(|probe| {
            probe.connect((Ipv4Addr::new(224, 0, 0, 251), 5353))?;
            probe.local_addr()
        })
        .ok()
        .map(|local| local.ip())
        .filter(|here| !here.is_unspecified() && !here.is_loopback());

    probed.or_else(|| {
        let held: Vec<IpAddr> = crate::discovery::listen::these_machines_addresses()
            .into_iter()
            .filter(|address| !address.is_loopback())
            .collect();

        crate::discovery::listen::where_it_answers(&held).map(IpAddr::V4)
    })
}

impl Caster {
    /// Casting with no devices heard yet, telling the page through `tell`.
    #[must_use]
    pub fn new(tell: Tell) -> Self {
        Self {
            devices: Mutex::new(Vec::new()),
            connection: Mutex::new(Connection::Idle),
            attempts: AtomicU64::new(0),
            tell,
        }
    }

    /// Where casting stands.
    #[must_use]
    pub fn now(&self) -> CastingNow {
        let devices = lock(&self.devices).clone();
        let (state, device) = match &*lock(&self.connection) {
            Connection::Idle if devices.is_empty() => ("unavailable", None),
            Connection::Idle => ("available", None),
            Connection::Connecting { device, .. } => ("connecting", Some(device.clone())),
            Connection::Connected { device, .. } => ("connected", Some(device.clone())),
        };

        CastingNow {
            state,
            devices,
            device,
        }
    }

    /// Tells the page where casting stands.
    fn tell_now(&self) {
        (self.tell)(Told::Changed(self.now()));
    }

    /// Takes the whole list of devices on the network.
    pub fn heard_devices(&self, devices: Vec<CastDevice>) {
        *lock(&self.devices) = devices;
        self.tell_now();
    }

    /// The session being cast through, where there is one.
    fn session(&self) -> Option<Arc<Session>> {
        match &*lock(&self.connection) {
            Connection::Connected { session, .. } => Some(Arc::clone(session)),
            _ => None,
        }
    }

    /// Whether `attempt` is still the connection being made or held.
    fn is_current(&self, attempt: u64) -> bool {
        match &*lock(&self.connection) {
            Connection::Connecting {
                attempt: current, ..
            }
            | Connection::Connected {
                attempt: current, ..
            } => *current == attempt,
            Connection::Idle => false,
        }
    }

    /// Connects to the device called `device_id`, ending any cast to another one first; whether it
    /// is now connected.
    pub async fn connect(self: &Arc<Self>, device_id: &str) -> bool {
        let Some(device) = lock(&self.devices)
            .iter()
            .find(|device| device.id == device_id)
            .cloned()
        else {
            return false;
        };

        let (earlier, attempt) = {
            let mut connection = lock(&self.connection);

            if let Connection::Connected {
                device: connected, ..
            } = &*connection
            {
                if connected.id == device.id {
                    return true;
                }
            }

            let attempt = self.attempts.fetch_add(1, Ordering::Relaxed) + 1;

            let earlier = std::mem::replace(
                &mut *connection,
                Connection::Connecting {
                    device: device.clone(),
                    attempt,
                },
            );

            (earlier, attempt)
        };

        if let Connection::Connected { session, .. } = earlier {
            session.end().await;
        }

        self.tell_now();

        let started = Session::start(device.address).await;

        let Ok(session) = started else {
            if self.is_current(attempt) {
                *lock(&self.connection) = Connection::Idle;
                self.tell_now();
            }

            return false;
        };

        let session = Arc::new(session);

        let is_still_wanted = {
            let mut connection = lock(&self.connection);
            let is_still_wanted = matches!(
                &*connection,
                Connection::Connecting { attempt: current, .. } if *current == attempt
            );

            if is_still_wanted {
                *connection = Connection::Connected {
                    device,
                    attempt,
                    session: Arc::clone(&session),
                };
            }

            is_still_wanted
        };

        if !is_still_wanted {
            session.end().await;

            return false;
        }

        self.tell_now();
        crate::runtime::spawn(Arc::clone(self).follow(session, attempt));

        true
    }

    /// Follows what the device says for as long as the cast lasts, asking where its media has got
    /// to each second while it plays, and lets the cast go once the device ends it.
    async fn follow(self: Arc<Self>, session: Arc<Session>, attempt: u64) {
        let mut hearing = session.link().hear();
        let mut ask = tokio::time::interval(ASK_WHERE_EVERY);
        let mut is_playing = false;

        loop {
            tokio::select! {
                () = session.link().closed() => break,
                _ = ask.tick() => {
                    if is_playing {
                        session.ask_where();
                    }
                }
                heard = hearing.recv() => match heard {
                    Ok(incoming) => {
                        if session.is_ended_by(&incoming) {
                            break;
                        }

                        if let Some(now) = session.heard_media(&incoming) {
                            is_playing = now.is_playing();
                            (self.tell)(Told::Played(CastPlayed {
                                seconds: now.current_time.max(0.0),
                                is_playing,
                            }));
                        }
                    }
                    Err(RecvError::Lagged(_)) => {}
                    Err(RecvError::Closed) => break,
                },
            }

            if !self.is_current(attempt) {
                return;
            }
        }

        if self.is_current(attempt) {
            *lock(&self.connection) = Connection::Idle;
            self.tell_now();
        }
    }

    /// Asks the device being cast to to play `url`; whether it took it.
    pub async fn load(
        &self,
        url: Url,
        content_type: &str,
        title: &str,
        start_seconds: f64,
    ) -> bool {
        let Some(session) = self.session() else {
            return false;
        };

        let ask = LoadAsk {
            url: reachable_from(url, session.link().local_ip()).to_string(),
            content_type: content_type.to_owned(),
            title: title.to_owned(),
            start_seconds,
        };

        session.load(&ask).await.is_ok()
    }

    /// Plays what the device holds.
    pub fn play(&self) {
        if let Some(session) = self.session() {
            session.play();
        }
    }

    /// Pauses what the device holds.
    pub fn pause(&self) {
        if let Some(session) = self.session() {
            session.pause();
        }
    }

    /// Moves what the device holds to `seconds`.
    pub fn seek(&self, seconds: f64) {
        if let Some(session) = self.session() {
            session.seek(seconds);
        }
    }

    /// Sets the device's volume.
    pub fn set_volume(&self, level: f64) {
        if let Some(session) = self.session() {
            session.set_volume(level);
        }
    }

    /// Stops casting, stopping the receiver on the device.
    pub async fn disconnect(&self) {
        let earlier = std::mem::replace(&mut *lock(&self.connection), Connection::Idle);

        match earlier {
            Connection::Idle => {}
            Connection::Connected { session, .. } => {
                self.tell_now();
                session.end().await;
            }
            Connection::Connecting { .. } => self.tell_now(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_a_server_on_this_computer_as_the_device_reaches_it() {
        let here: IpAddr = "192.168.1.10".parse().unwrap();

        for server in [
            "http://localhost:8420/api/playback/cast/t/master.m3u8",
            "http://127.0.0.1:8420/api/playback/cast/t/master.m3u8",
            "http://[::1]:8420/api/playback/cast/t/master.m3u8",
        ] {
            assert_eq!(
                reachable_from(Url::parse(server).unwrap(), here).as_str(),
                "http://192.168.1.10:8420/api/playback/cast/t/master.m3u8"
            );
        }
    }

    #[test]
    fn leaves_a_server_elsewhere_as_it_is() {
        let url =
            Url::parse("https://valence.example.com/api/playback/cast/t/master.m3u8").unwrap();

        assert_eq!(
            reachable_from(url.clone(), "192.168.1.10".parse().unwrap()),
            url
        );
    }

    #[test]
    fn names_this_computer_by_an_address_other_devices_can_reach() {
        if let Some(here) = this_computers_network_address() {
            assert!(!here.is_loopback() && !here.is_unspecified());
        }
    }

    #[test]
    fn has_nothing_to_offer_before_a_device_is_heard() {
        let caster = Caster::new(Arc::new(|_| {}));

        assert_eq!(caster.now().state, "unavailable");
    }
}
