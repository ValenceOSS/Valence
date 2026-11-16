//! Hearing the Cast devices on the network: each announces itself over mDNS as `_googlecast._tcp`,
//! saying in its TXT records what it is called (`fn`), what it is (`md`), its id (`id`) and what it
//! can do (`ca`).

use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::Serialize;
use std::net::{IpAddr, SocketAddr};

use crate::discovery::listen::where_it_answers;

/// The service Cast devices announce themselves as.
pub const CAST_SERVICE: &str = "_googlecast._tcp.local.";

const VIDEO_OUT: u64 = 1;

/// A Cast device on the network.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CastDevice {
    /// What the device calls itself on the network, which is what it is known by here.
    pub id: String,
    /// The name its owner gave it.
    pub name: String,
    /// What kind of device it is, where it says.
    pub model: Option<String>,
    /// Where it answers.
    #[serde(skip)]
    pub address: SocketAddr,
}

/// Reads a device from what it announced, or nothing where it cannot show a picture or cannot be
/// reached.
///
/// `property` reads one of its TXT records.
#[must_use]
pub fn device_from(
    fullname: &str,
    property: impl Fn(&str) -> Option<String>,
    addresses: &[IpAddr],
    port: u16,
) -> Option<CastDevice> {
    let can_show_pictures = property("ca")
        .and_then(|capabilities| capabilities.trim().parse::<u64>().ok())
        .is_none_or(|capabilities| capabilities & VIDEO_OUT != 0);

    if !can_show_pictures {
        return None;
    }

    let address = where_it_answers(addresses)?;
    let instance = fullname
        .strip_suffix(CAST_SERVICE)
        .and_then(|name| name.strip_suffix('.'))
        .unwrap_or(fullname);
    let name = property("fn")
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| instance.to_owned());

    Some(CastDevice {
        id: fullname.to_owned(),
        name,
        model: property("md").filter(|model| !model.trim().is_empty()),
        address: SocketAddr::new(IpAddr::V4(address), port),
    })
}

/// The devices heard so far, kept in the order of their names.
#[derive(Debug, Default)]
pub struct HeardDevices(Vec<CastDevice>);

impl HeardDevices {
    /// Notes a device arriving, or announcing itself again; whether the list changed.
    pub fn arrived(&mut self, device: CastDevice) -> bool {
        if let Some(known) = self.0.iter_mut().find(|known| known.id == device.id) {
            if *known == device {
                return false;
            }

            *known = device;
        } else {
            self.0.push(device);
        }

        self.0.sort_by_key(|device| device.name.to_lowercase());
        true
    }

    /// Notes a device leaving; whether the list changed.
    pub fn left(&mut self, fullname: &str) -> bool {
        let before = self.0.len();

        self.0.retain(|device| device.id != fullname);
        self.0.len() != before
    }

    /// The devices, as they stand.
    #[must_use]
    pub fn all(&self) -> Vec<CastDevice> {
        self.0.clone()
    }
}

/// Reads a resolved service as a device.
fn device_of(info: &ServiceInfo) -> Option<CastDevice> {
    let addresses: Vec<IpAddr> = info.get_addresses().iter().copied().collect();

    device_from(
        info.get_fullname(),
        |key| info.get_property_val_str(key).map(str::to_owned),
        &addresses,
        info.get_port(),
    )
}

/// Starts hearing Cast devices, on a thread of its own for as long as the app runs, telling
/// `on_change` the whole list each time it changes; a network that drops multicast leaves the list
/// empty rather than stopping the app.
pub fn browse_for_cast_devices(on_change: impl Fn(Vec<CastDevice>) + Send + 'static) {
    let Ok(daemon) = ServiceDaemon::new() else {
        return;
    };

    let Ok(events) = daemon.browse(CAST_SERVICE) else {
        return;
    };

    let _ = std::thread::Builder::new()
        .name(String::from("valence-cast-mdns"))
        .spawn(move || {
            let _hearing = daemon;
            let mut heard = HeardDevices::default();

            while let Ok(event) = events.recv() {
                let changed = match event {
                    ServiceEvent::ServiceResolved(info) => match device_of(&info) {
                        Some(device) => heard.arrived(device),
                        None => heard.left(info.get_fullname()),
                    },
                    ServiceEvent::ServiceRemoved(_, fullname) => heard.left(&fullname),
                    _ => false,
                };

                if changed {
                    on_change(heard.all());
                }
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    const LIVING_ROOM: &str = "Chromecast-Ultra-0f1e2d._googlecast._tcp.local.";

    fn records(pairs: &[(&str, &str)]) -> impl Fn(&str) -> Option<String> {
        let held: HashMap<String, String> = pairs
            .iter()
            .map(|(key, value)| ((*key).to_owned(), (*value).to_owned()))
            .collect();

        move |key| held.get(key).cloned()
    }

    fn living_room() -> CastDevice {
        device_from(
            LIVING_ROOM,
            records(&[
                ("fn", "Living Room TV"),
                ("md", "Chromecast Ultra"),
                ("ca", "4101"),
            ]),
            &["fe80::1".parse().unwrap(), "192.168.1.31".parse().unwrap()],
            8009,
        )
        .unwrap()
    }

    #[test]
    fn reads_the_name_and_the_model_the_device_announced() {
        assert_eq!(
            living_room(),
            CastDevice {
                id: String::from(LIVING_ROOM),
                name: String::from("Living Room TV"),
                model: Some(String::from("Chromecast Ultra")),
                address: "192.168.1.31:8009".parse().unwrap(),
            }
        );
    }

    #[test]
    fn falls_back_on_the_instance_name_where_the_device_gives_none() {
        let device = device_from(
            LIVING_ROOM,
            records(&[]),
            &["192.168.1.31".parse().unwrap()],
            8009,
        )
        .unwrap();

        assert_eq!(device.name, "Chromecast-Ultra-0f1e2d");
        assert_eq!(device.model, None);
    }

    #[test]
    fn passes_over_a_speaker_that_cannot_show_a_film() {
        assert_eq!(
            device_from(
                "Kitchen-speaker._googlecast._tcp.local.",
                records(&[("fn", "Kitchen"), ("ca", "2052")]),
                &["192.168.1.40".parse().unwrap()],
                8009,
            ),
            None
        );
    }

    #[test]
    fn passes_over_a_device_with_no_address_it_can_be_reached_at() {
        assert_eq!(
            device_from(
                LIVING_ROOM,
                records(&[("fn", "Living Room TV")]),
                &["169.254.0.9".parse().unwrap()],
                8009
            ),
            None
        );
    }

    #[test]
    fn keeps_the_devices_in_the_order_of_their_names() {
        let mut heard = HeardDevices::default();
        let bedroom = CastDevice {
            id: String::from("Bedroom._googlecast._tcp.local."),
            name: String::from("bedroom"),
            ..living_room()
        };

        assert!(heard.arrived(living_room()));
        assert!(heard.arrived(bedroom.clone()));
        assert_eq!(heard.all(), vec![bedroom, living_room()]);
    }

    #[test]
    fn says_nothing_changed_when_a_device_announces_itself_again() {
        let mut heard = HeardDevices::default();

        heard.arrived(living_room());

        assert!(!heard.arrived(living_room()));
    }

    #[test]
    fn takes_a_device_off_once_it_says_goodbye() {
        let mut heard = HeardDevices::default();

        heard.arrived(living_room());

        assert!(heard.left(LIVING_ROOM));
        assert!(heard.all().is_empty());
        assert!(!heard.left(LIVING_ROOM));
    }
}
