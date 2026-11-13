//! How busy the network is: how many bytes a second the machine is receiving
//! and sending, summed over its real interfaces, from the kernel's own
//! counters.
//!
//! Loopback and the virtual interfaces containers, bridges and tunnels add are
//! left out, because every byte through one of them is also counted on the
//! interface that carries it, and counting both would double the figure.
//!
//! Inside a container with a network of its own the interfaces are the
//! container's, so the figure is what that container moves rather than the
//! whole machine; on the host's network it is the machine's.

use std::collections::HashMap;
use std::time::{Duration, Instant};

use serde::Serialize;
use sysinfo::Networks;

/// Two readings closer together than this are too close to divide by.
const SHORTEST_GAP: Duration = Duration::from_millis(500);

/// Interfaces that carry traffic already counted on another one, by the
/// start of their name.
const VIRTUAL_PREFIXES: [&str; 16] = [
    "lo",
    "veth",
    "docker",
    "br-",
    "virbr",
    "vnet",
    "cni",
    "flannel",
    "cali",
    "kube",
    "tun",
    "tap",
    "wg",
    "tailscale",
    "zt",
    "utun",
];

/// The bytes each interface has received and sent, by its name.
pub type Counters = HashMap<String, (u64, u64)>;

/// How fast the machine's network is moving data.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkActivity {
    pub received_bytes_per_second: u64,
    pub sent_bytes_per_second: u64,
}

/// Whether an interface carries traffic of its own rather than a copy of
/// traffic some other interface also counts.
#[must_use]
pub fn is_real(name: &str) -> bool {
    !name.is_empty()
        && !VIRTUAL_PREFIXES
            .iter()
            .any(|prefix| name.starts_with(prefix))
}

/// Bytes a second between two counts, nothing where the count went backwards.
fn per_second(now: u64, then: u64, seconds: f64) -> u64 {
    let moved = now.saturating_sub(then);

    #[allow(
        clippy::cast_possible_truncation,
        clippy::cast_sign_loss,
        clippy::cast_precision_loss,
        reason = "a byte count a second is far inside both ranges"
    )]
    let rate = (moved as f64 / seconds).round() as u64;

    rate
}

/// Keeps the last reading of the counters, since a speed is the difference
/// between two of them.
#[derive(Debug, Default)]
pub struct NetworkCounter {
    last: Option<(Instant, Counters)>,
    rate: Option<NetworkActivity>,
    networks: Option<Networks>,
}

impl NetworkCounter {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// The network's speed since the last reading, from counters already
    /// read; nothing until there are two readings of at least one real
    /// interface to compare.
    pub fn take(&mut self, now: Instant, counters: &Counters) -> Option<NetworkActivity> {
        let real: Counters = counters
            .iter()
            .filter(|(name, _)| is_real(name))
            .map(|(name, counts)| (name.clone(), *counts))
            .collect();

        if real.is_empty() {
            self.last = None;
            self.rate = None;

            return None;
        }

        match &self.last {
            Some((at, _)) if now.duration_since(*at) < SHORTEST_GAP => {}
            Some((at, before)) => {
                let seconds = now.duration_since(*at).as_secs_f64();
                let (received, sent) = real.iter().fold(
                    (0_u64, 0_u64),
                    |(received, sent), (name, (now_in, now_out))| {
                        let (then_in, then_out) =
                            before.get(name).copied().unwrap_or((*now_in, *now_out));

                        (
                            received.saturating_add(per_second(*now_in, then_in, seconds)),
                            sent.saturating_add(per_second(*now_out, then_out, seconds)),
                        )
                    },
                );

                self.rate = Some(NetworkActivity {
                    received_bytes_per_second: received,
                    sent_bytes_per_second: sent,
                });
                self.last = Some((now, real));
            }
            None => {
                self.last = Some((now, real));
            }
        }

        self.rate
    }

    /// The network's speed now, reading the machine's counters.
    pub fn read(&mut self) -> Option<NetworkActivity> {
        let networks = self
            .networks
            .get_or_insert_with(Networks::new_with_refreshed_list);

        networks.refresh(true);

        let counters: Counters = networks
            .list()
            .iter()
            .map(|(name, data)| {
                (
                    name.clone(),
                    (data.total_received(), data.total_transmitted()),
                )
            })
            .collect();

        self.take(Instant::now(), &counters)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn counters(entries: &[(&str, u64, u64)]) -> Counters {
        entries
            .iter()
            .map(|(name, received, sent)| ((*name).to_owned(), (*received, *sent)))
            .collect()
    }

    #[test]
    fn tells_real_interfaces_from_virtual_ones() {
        assert!(is_real("eth0"));
        assert!(is_real("enp3s0"));
        assert!(is_real("wlan0"));
        assert!(is_real("en0"));
        assert!(!is_real("lo"));
        assert!(!is_real("lo0"));
        assert!(!is_real("docker0"));
        assert!(!is_real("veth12ab"));
        assert!(!is_real("br-5f2c"));
        assert!(!is_real("tailscale0"));
        assert!(!is_real("wg0"));
        assert!(!is_real(""));
    }

    #[test]
    fn says_nothing_on_the_first_reading() {
        let mut counter = NetworkCounter::new();

        assert_eq!(
            counter.take(Instant::now(), &counters(&[("eth0", 100, 200)])),
            None
        );
    }

    #[test]
    fn sums_the_speed_of_every_real_interface_and_ignores_loopback() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();

        counter.take(
            start,
            &counters(&[("eth0", 1_000, 2_000), ("wlan0", 0, 0), ("lo", 0, 0)]),
        );

        let rate = counter.take(
            start + Duration::from_secs(2),
            &counters(&[
                ("eth0", 5_000, 10_000),
                ("wlan0", 2_000, 0),
                ("lo", 1_000_000, 1_000_000),
            ]),
        );

        assert_eq!(
            rate,
            Some(NetworkActivity {
                received_bytes_per_second: 3_000,
                sent_bytes_per_second: 4_000,
            })
        );
    }

    #[test]
    fn keeps_the_last_speed_when_read_again_too_soon() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();

        counter.take(start, &counters(&[("eth0", 0, 0)]));
        let first = counter.take(
            start + Duration::from_secs(1),
            &counters(&[("eth0", 1_000, 500)]),
        );
        let again = counter.take(
            start + Duration::from_millis(1_100),
            &counters(&[("eth0", 9_000, 9_000)]),
        );

        assert_eq!(first, again);
    }

    #[test]
    fn counts_nothing_for_an_interface_whose_count_went_backwards() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();

        counter.take(start, &counters(&[("eth0", 5_000, 5_000)]));

        let rate = counter.take(
            start + Duration::from_secs(1),
            &counters(&[("eth0", 100, 100)]),
        );

        assert_eq!(
            rate,
            Some(NetworkActivity {
                received_bytes_per_second: 0,
                sent_bytes_per_second: 0,
            })
        );
    }

    #[test]
    fn counts_nothing_for_an_interface_that_has_just_appeared() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();

        counter.take(start, &counters(&[("eth0", 0, 0)]));

        let rate = counter.take(
            start + Duration::from_secs(1),
            &counters(&[("eth0", 10, 20), ("eth1", 1_000_000, 1_000_000)]),
        );

        assert_eq!(
            rate,
            Some(NetworkActivity {
                received_bytes_per_second: 10,
                sent_bytes_per_second: 20,
            })
        );
    }

    #[test]
    fn says_nothing_where_no_real_interface_can_be_read() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();

        counter.take(start, &counters(&[("eth0", 0, 0)]));
        counter.take(start + Duration::from_secs(1), &counters(&[("eth0", 1, 1)]));

        assert_eq!(
            counter.take(start + Duration::from_secs(2), &counters(&[("lo", 5, 5)])),
            None
        );
        assert_eq!(
            counter.take(start + Duration::from_secs(3), &Counters::new()),
            None
        );
    }
}
