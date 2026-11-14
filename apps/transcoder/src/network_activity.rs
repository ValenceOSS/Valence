//! How busy the network is: how many bytes a second the machine is receiving
//! and sending, summed over its real interfaces, from the kernel's own
//! counters.
//!
//! Loopback and the virtual interfaces containers, bridges, bonds, VLANs and
//! tunnels add are left out, because every byte through one of them is also
//! counted on the interface that carries it, and counting both would double
//! the figure.
//!
//! On Linux the counters come from `/proc/net/dev`, read whole or not at all,
//! so a failed read is an unknown figure rather than a run of zeroes that would
//! later read as a burst of traffic.
//!
//! Inside a container with a network of its own the interfaces are the
//! container's, so the figure is what that container moves rather than the
//! whole machine; on the host's network it is the machine's.

use std::collections::HashMap;
use std::time::{Duration, Instant};

use serde::Serialize;

/// Two readings closer together than this are too close to divide by.
const SHORTEST_GAP: Duration = Duration::from_millis(500);

/// Interfaces that carry traffic already counted on another one, by the
/// start of their name.
const VIRTUAL_PREFIXES: [&str; 18] = [
    "lo",
    "veth",
    "docker",
    "br",
    "bond",
    "team",
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
        && !name.contains('.')
        && !name.contains('@')
        && !VIRTUAL_PREFIXES
            .iter()
            .any(|prefix| name.starts_with(prefix))
}

/// The bytes each interface has received and sent since the machine
/// started, out of `/proc/net/dev`.
#[must_use]
pub fn parse_net_dev(text: &str) -> Counters {
    text.lines()
        .filter_map(|line| {
            let (name, figures) = line.split_once(':')?;
            let fields: Vec<&str> = figures.split_whitespace().collect();
            let received = fields.first()?.parse::<u64>().ok()?;
            let sent = fields.get(8)?.parse::<u64>().ok()?;

            Some((name.trim().to_owned(), (received, sent)))
        })
        .collect()
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
#[derive(Default)]
pub struct NetworkCounter {
    last: Option<(Instant, Counters)>,
    rate: Option<NetworkActivity>,
    #[cfg(not(target_os = "linux"))]
    networks: Option<sysinfo::Networks>,
}

impl NetworkCounter {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// The network's speed since the last reading, from counters already
    /// read; nothing where they could not be read, and nothing until there
    /// are two readings of at least one real interface to compare.
    pub fn take(&mut self, now: Instant, counters: Option<&Counters>) -> Option<NetworkActivity> {
        let real: Counters = counters
            .into_iter()
            .flatten()
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
        let counters = self.counters();

        self.take(Instant::now(), counters.as_ref())
    }

    /// Every interface's counters, or nothing where they could not be read.
    #[cfg(target_os = "linux")]
    #[allow(
        clippy::unused_self,
        reason = "the other platforms keep their reader on the counter"
    )]
    fn counters(&mut self) -> Option<Counters> {
        std::fs::read_to_string("/proc/net/dev")
            .ok()
            .map(|text| parse_net_dev(&text))
    }

    /// Every interface's counters, or nothing where they could not be read.
    #[cfg(not(target_os = "linux"))]
    #[allow(
        clippy::unnecessary_wraps,
        reason = "the Linux reader can fail, and both readers share one signature"
    )]
    fn counters(&mut self) -> Option<Counters> {
        let networks = self
            .networks
            .get_or_insert_with(sysinfo::Networks::new_with_refreshed_list);

        networks.refresh(true);

        Some(
            networks
                .list()
                .iter()
                .map(|(name, data)| {
                    (
                        name.clone(),
                        (data.total_received(), data.total_transmitted()),
                    )
                })
                .collect(),
        )
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

    fn rate(received: u64, sent: u64) -> NetworkActivity {
        NetworkActivity {
            received_bytes_per_second: received,
            sent_bytes_per_second: sent,
        }
    }

    #[test]
    fn tells_real_interfaces_from_virtual_ones() {
        for real in ["eth0", "enp3s0", "wlan0", "en0", "eno1"] {
            assert!(is_real(real), "{real} carries traffic of its own");
        }

        for copy in [
            "lo",
            "lo0",
            "docker0",
            "veth12ab",
            "br-5f2c",
            "br0",
            "bond0",
            "team0",
            "eth0.100",
            "vlan10@eth0",
            "tailscale0",
            "wg0",
            "",
        ] {
            assert!(!is_real(copy), "{copy} repeats traffic counted elsewhere");
        }
    }

    #[test]
    fn reads_what_each_interface_received_and_sent() {
        let text = "\
Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo:  123456     100    0    0    0     0          0         0   123456     100    0    0    0     0       0          0
  eth0: 9876543    5000    0    0    0     0          0        12  1234567    4000    0    0    0     0       0          0
 wlan0:0 0 0 0 0 0 0 0 42 0 0 0 0 0 0 0";
        let read = parse_net_dev(text);

        assert_eq!(read.len(), 3);
        assert_eq!(read.get("eth0"), Some(&(9_876_543, 1_234_567)));
        assert_eq!(read.get("lo"), Some(&(123_456, 123_456)));
        assert_eq!(read.get("wlan0"), Some(&(0, 42)));
    }

    #[test]
    fn says_nothing_on_the_first_reading() {
        let mut counter = NetworkCounter::new();
        let first = counters(&[("eth0", 100, 200)]);

        assert_eq!(counter.take(Instant::now(), Some(&first)), None);
    }

    #[test]
    fn sums_the_speed_of_every_real_interface_and_ignores_the_rest() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();
        let first = counters(&[
            ("eth0", 1_000, 2_000),
            ("wlan0", 0, 0),
            ("lo", 0, 0),
            ("bond0", 0, 0),
        ]);
        let second = counters(&[
            ("eth0", 5_000, 10_000),
            ("wlan0", 2_000, 0),
            ("lo", 1_000_000, 1_000_000),
            ("bond0", 7_000, 8_000),
        ]);

        counter.take(start, Some(&first));

        assert_eq!(
            counter.take(start + Duration::from_secs(2), Some(&second)),
            Some(rate(3_000, 4_000))
        );
    }

    #[test]
    fn keeps_the_last_speed_when_read_again_too_soon() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();
        let zero = counters(&[("eth0", 0, 0)]);
        let second = counters(&[("eth0", 1_000, 500)]);
        let third = counters(&[("eth0", 9_000, 9_000)]);

        counter.take(start, Some(&zero));
        let first = counter.take(start + Duration::from_secs(1), Some(&second));
        let again = counter.take(start + Duration::from_millis(1_100), Some(&third));

        assert_eq!(first, again);
    }

    #[test]
    fn counts_nothing_for_an_interface_whose_count_went_backwards() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();
        let before = counters(&[("eth0", 5_000, 5_000)]);
        let after = counters(&[("eth0", 100, 100)]);

        counter.take(start, Some(&before));

        assert_eq!(
            counter.take(start + Duration::from_secs(1), Some(&after)),
            Some(rate(0, 0))
        );
    }

    #[test]
    fn counts_nothing_for_an_interface_that_has_just_appeared() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();
        let before = counters(&[("eth0", 0, 0)]);
        let after = counters(&[("eth0", 10, 20), ("eth1", 1_000_000, 1_000_000)]);

        counter.take(start, Some(&before));

        assert_eq!(
            counter.take(start + Duration::from_secs(1), Some(&after)),
            Some(rate(10, 20))
        );
    }

    #[test]
    fn says_nothing_where_no_real_interface_can_be_read() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();
        let first = counters(&[("eth0", 0, 0)]);
        let second = counters(&[("eth0", 1, 1)]);
        let only_loopback = counters(&[("lo", 5, 5)]);

        counter.take(start, Some(&first));
        counter.take(start + Duration::from_secs(1), Some(&second));

        assert_eq!(
            counter.take(start + Duration::from_secs(2), Some(&only_loopback)),
            None
        );
        assert_eq!(
            counter.take(start + Duration::from_secs(3), Some(&Counters::new())),
            None
        );
    }

    #[test]
    fn starts_again_after_a_failed_read_rather_than_reporting_a_burst() {
        let mut counter = NetworkCounter::new();
        let start = Instant::now();
        let first = counters(&[("eth0", 1_000_000, 1_000_000)]);
        let second = counters(&[("eth0", 1_001_000, 1_002_000)]);
        let recovered = counters(&[("eth0", 1_003_000, 1_006_000)]);
        let later = counters(&[("eth0", 1_004_000, 1_008_000)]);

        counter.take(start, Some(&first));
        counter.take(start + Duration::from_secs(1), Some(&second));

        assert_eq!(counter.take(start + Duration::from_secs(2), None), None);
        assert_eq!(
            counter.take(start + Duration::from_secs(3), Some(&recovered)),
            None,
            "the first reading after a failure is a new starting point"
        );
        assert_eq!(
            counter.take(start + Duration::from_secs(4), Some(&later)),
            Some(rate(1_000, 2_000))
        );
    }
}
