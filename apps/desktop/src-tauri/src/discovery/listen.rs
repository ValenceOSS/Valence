//! Hearing the Valence servers that announce themselves on the network over mDNS, as
//! `listenForValences` did: nothing here goes looking, it only hears what servers chose to say.

use super::nearby::NearbyValences;
use mdns_sd::{ServiceDaemon, ServiceEvent};
use std::collections::HashSet;
use std::net::{IpAddr, Ipv4Addr};
use std::sync::Arc;

/// The service Valence servers announce themselves as.
pub const VALENCE_SERVICE: &str = "_valence._tcp.local.";

/// A server that announced itself.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Announced {
    pub(crate) name: String,
    pub(crate) port: u16,
    pub(crate) addresses: Vec<IpAddr>,
}

/// What hearing a server needs: the list to put it on, who to tell of one on this computer, and
/// the addresses this computer holds.
pub struct Listening {
    pub(crate) nearby: Arc<NearbyValences>,
    pub(crate) on_this_machine: Arc<dyn Fn(String) + Send + Sync>,
    pub(crate) own_addresses: Arc<dyn Fn() -> HashSet<IpAddr> + Send + Sync>,
}

impl Listening {
    /// Hears a server arrive: asks it where it answers, and offers it as this computer's own at
    /// `localhost` or as one on the network.
    pub fn up(&self, service: &Announced) {
        let Some(where_it_is) = where_it_answers(&service.addresses) else {
            return;
        };

        let is_this_machine = (self.own_addresses)().contains(&IpAddr::V4(where_it_is));
        let address = if is_this_machine {
            format!("http://localhost:{}", service.port)
        } else {
            format!("http://{where_it_is}:{}", service.port)
        };

        let asking = self
            .nearby
            .arrived(&service.name, &address, !is_this_machine);
        let on_this_machine = Arc::clone(&self.on_this_machine);

        crate::runtime::spawn(async move {
            if asking.await && is_this_machine {
                on_this_machine(address);
            }
        });
    }

    /// Hears a server say goodbye.
    pub fn down(&self, name: &str) {
        self.nearby.left(name);
    }
}

/// Which of a server's addresses this client can reach it on: the first IPv4 address that is not
/// one a machine gave itself for want of a network.
#[must_use]
pub fn where_it_answers(addresses: &[IpAddr]) -> Option<Ipv4Addr> {
    let mut usable: Vec<Ipv4Addr> = addresses
        .iter()
        .filter_map(|address| match address {
            IpAddr::V4(address) if !address.is_link_local() => Some(*address),
            _ => None,
        })
        .collect();

    usable.sort_unstable();
    usable.first().copied()
}

/// Every address this computer holds, for telling its own announcements from the network's.
#[must_use]
pub fn these_machines_addresses() -> HashSet<IpAddr> {
    if_addrs::get_if_addrs()
        .map(|interfaces| {
            interfaces
                .into_iter()
                .map(|interface| interface.ip())
                .collect()
        })
        .unwrap_or_default()
}

/// The instance name of a service from its full name, as the server announced it.
fn instance_name(fullname: &str, service_type: &str) -> String {
    fullname
        .strip_suffix(service_type)
        .and_then(|name| name.strip_suffix('.'))
        .unwrap_or(fullname)
        .to_owned()
}

/// Starts hearing Valence servers on the network, on a thread of its own for as long as the app
/// runs; a network that drops multicast leaves things as they were rather than stopping the app.
pub fn browse_for_valences(listening: Listening) {
    let Ok(daemon) = ServiceDaemon::new() else {
        return;
    };

    let Ok(events) = daemon.browse(VALENCE_SERVICE) else {
        return;
    };

    let _ = std::thread::Builder::new()
        .name(String::from("valence-mdns"))
        .spawn(move || {
            let _hearing = daemon;

            while let Ok(event) = events.recv() {
                match event {
                    ServiceEvent::ServiceResolved(info) => listening.up(&Announced {
                        name: instance_name(info.get_fullname(), info.get_type()),
                        port: info.get_port(),
                        addresses: info.get_addresses().iter().copied().collect(),
                    }),
                    ServiceEvent::ServiceRemoved(service_type, fullname) => {
                        listening.down(&instance_name(&fullname, &service_type));
                    }
                    _ => {}
                }
            }
        });
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    reason = "a test that cannot set up should fail loudly"
)]
mod tests {
    use super::{instance_name, where_it_answers, Announced, Listening};
    use crate::discovery::look::Reach;
    use crate::discovery::nearby::{NearbyValence, NearbyValences};
    use futures_util::FutureExt;
    use std::collections::HashSet;
    use std::net::IpAddr;
    use std::sync::{Arc, Mutex};
    use std::time::Duration;

    const THIS_MACHINE: &str = "192.168.1.10";

    struct Heard {
        listening: Listening,
        told: Arc<Mutex<Vec<Vec<NearbyValence>>>>,
        here: Arc<Mutex<Vec<String>>>,
    }

    fn listening(reach: Reach) -> Heard {
        let told = Arc::new(Mutex::new(Vec::new()));
        let here = Arc::new(Mutex::new(Vec::new()));
        let telling = told.clone();
        let finding = here.clone();

        let listening = Listening {
            nearby: Arc::new(NearbyValences::new(reach, move |nearby| {
                telling.lock().unwrap().push(nearby);
            })),
            on_this_machine: Arc::new(move |address| finding.lock().unwrap().push(address)),
            own_addresses: Arc::new(|| {
                HashSet::from([
                    THIS_MACHINE.parse::<IpAddr>().unwrap(),
                    "127.0.0.1".parse().unwrap(),
                ])
            }),
        };

        Heard {
            listening,
            told,
            here,
        }
    }

    fn answering(answer: bool) -> Reach {
        Arc::new(move |_| async move { answer }.boxed())
    }

    fn across_the_room() -> Announced {
        Announced {
            name: String::from("Valence on media-box"),
            port: 8420,
            addresses: vec!["fe80::1".parse().unwrap(), "192.168.1.224".parse().unwrap()],
        }
    }

    async fn settled() {
        tokio::time::sleep(Duration::from_millis(20)).await;
    }

    #[test]
    fn passes_over_an_ipv6_address_nobody_would_type() {
        assert_eq!(
            where_it_answers(&across_the_room().addresses),
            "192.168.1.224".parse().ok()
        );
    }

    #[test]
    fn passes_over_an_address_a_machine_gave_itself_for_want_of_a_network() {
        assert_eq!(where_it_answers(&["169.254.3.4".parse().unwrap()]), None);
    }

    #[test]
    fn reads_the_name_the_server_announced() {
        assert_eq!(
            instance_name(
                "Valence on media-box._valence._tcp.local.",
                "_valence._tcp.local."
            ),
            "Valence on media-box"
        );
    }

    #[tokio::test]
    async fn offers_a_server_announced_elsewhere_once_it_has_answered() {
        let heard = listening(answering(true));

        heard.listening.up(&across_the_room());
        settled().await;

        assert_eq!(
            heard.told.lock().unwrap().last(),
            Some(&vec![NearbyValence {
                address: String::from("http://192.168.1.224:8420"),
                name: String::from("Valence on media-box"),
            }])
        );
    }

    #[tokio::test]
    async fn offers_nothing_that_announced_itself_but_does_not_answer() {
        let heard = listening(answering(false));

        heard.listening.up(&across_the_room());
        settled().await;

        assert!(heard.told.lock().unwrap().is_empty());
    }

    #[tokio::test]
    async fn takes_a_server_off_once_it_says_goodbye() {
        let heard = listening(answering(true));

        heard.listening.up(&across_the_room());
        settled().await;
        heard.listening.down("Valence on media-box");

        assert_eq!(heard.told.lock().unwrap().last(), Some(&Vec::new()));
    }

    #[tokio::test]
    async fn does_not_offer_a_server_that_left_while_it_was_still_being_asked_about() {
        let (answer, answered) = tokio::sync::oneshot::channel::<bool>();
        let answered = Arc::new(Mutex::new(Some(answered)));
        let reach: Reach = Arc::new(move |_| {
            let waiting = answered.lock().unwrap().take();
            async move {
                match waiting {
                    Some(waiting) => waiting.await.unwrap_or(false),
                    None => false,
                }
            }
            .boxed()
        });
        let heard = listening(reach);

        heard.listening.up(&across_the_room());
        heard.listening.down("Valence on media-box");
        answer.send(true).unwrap();
        settled().await;

        assert!(heard.told.lock().unwrap().is_empty());
    }

    #[tokio::test]
    async fn offers_a_server_this_machine_announced_as_its_own_at_localhost() {
        let asked = Arc::new(Mutex::new(Vec::new()));
        let asking = asked.clone();
        let heard = listening(Arc::new(move |address| {
            asking.lock().unwrap().push(address);
            async { true }.boxed()
        }));

        heard.listening.up(&Announced {
            name: String::from("Valence on this-mac"),
            port: 9000,
            addresses: vec![THIS_MACHINE.parse().unwrap()],
        });
        settled().await;

        assert_eq!(*heard.here.lock().unwrap(), vec!["http://localhost:9000"]);
        assert_eq!(*asked.lock().unwrap(), vec!["http://localhost:9000"]);
        assert!(heard.told.lock().unwrap().is_empty());
    }
}
