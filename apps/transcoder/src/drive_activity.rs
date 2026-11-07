//! How busy each drive is: how many bytes a second it is reading and writing,
//! from the kernel's own counters, and how much of it is used, where a
//! filesystem on it is one this service can see.
//!
//! The counters are the machine's, not the container's, so every drive is
//! measured whether or not anything on it is mounted here. Room is another
//! matter: only a filesystem mounted in this service's view can be asked how
//! full it is.

use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};

use serde::Serialize;

/// The kernel counts in sectors of this many bytes, whatever the drive's own.
const SECTOR_BYTES: u64 = 512;

/// Two readings closer together than this are too close to divide by.
const SHORTEST_GAP: Duration = Duration::from_millis(500);

/// The bytes each whole drive has read and written, by its name.
pub type Counters = HashMap<String, (u64, u64)>;

/// One drive's activity and fill.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveActivity {
    /// What the operating system calls it, such as `sda` or `nvme0n1`.
    pub name: String,
    pub read_bytes_per_second: u64,
    pub written_bytes_per_second: u64,
    /// What the filesystems on it that this service can see are using.
    pub used_bytes: Option<u64>,
    /// How big those filesystems are, together.
    pub filesystem_bytes: Option<u64>,
}

/// One mounted filesystem, as the monitor measured it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Filesystem {
    /// The device it is on, such as `/dev/sda1`.
    pub device: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
}

/// The whole drive a device name belongs to: `sda` for `sda1`, `nvme0n1`
/// for `nvme0n1p2`. Nothing for anything that is not a physical drive or a
/// partition of one, such as a loop device, a RAID set or an overlay.
#[must_use]
pub fn drive_of(device: &str) -> Option<String> {
    let name = device.strip_prefix("/dev/").unwrap_or(device);
    let has_numbered_parts = name.starts_with("nvme") || name.starts_with("mmcblk");

    if has_numbered_parts {
        let whole = match name.rfind('p') {
            Some(at)
                if at > 0
                    && name[at + 1..].chars().all(|letter| letter.is_ascii_digit())
                    && !name[at + 1..].is_empty()
                    && name[..at]
                        .chars()
                        .last()
                        .is_some_and(|letter| letter.is_ascii_digit()) =>
            {
                &name[..at]
            }
            _ => name,
        };

        return Some(whole.to_owned());
    }

    let is_lettered = ["sd", "vd", "hd", "xvd"]
        .iter()
        .any(|prefix| name.starts_with(prefix));

    if !is_lettered {
        return None;
    }

    let whole = name.trim_end_matches(|letter: char| letter.is_ascii_digit());

    (whole.len() > 2).then(|| whole.to_owned())
}

/// The bytes each whole drive has read and written since the machine started,
/// out of `/proc/diskstats`.
#[must_use]
pub fn parse_diskstats(text: &str) -> Counters {
    text.lines()
        .filter_map(|line| {
            let fields: Vec<&str> = line.split_whitespace().collect();
            let name = (*fields.get(2)?).to_owned();
            let read = fields.get(5)?.parse::<u64>().ok()?;
            let written = fields.get(9)?.parse::<u64>().ok()?;

            (drive_of(&name).as_deref() == Some(name.as_str()))
                .then_some((name, (read * SECTOR_BYTES, written * SECTOR_BYTES)))
        })
        .collect()
}

/// What each drive's filesystems that can be seen use and hold, counting a
/// filesystem mounted in more than one place once.
fn fill_of(filesystems: &[Filesystem]) -> HashMap<String, (u64, u64)> {
    let mut seen = HashSet::new();
    let mut fill: HashMap<String, (u64, u64)> = HashMap::new();

    for filesystem in filesystems {
        if !seen.insert(filesystem.device.clone()) {
            continue;
        }

        let Some(drive) = drive_of(&filesystem.device) else {
            continue;
        };
        let entry = fill.entry(drive).or_default();

        entry.0 += filesystem
            .total_bytes
            .saturating_sub(filesystem.available_bytes);
        entry.1 += filesystem.total_bytes;
    }

    fill
}

/// Keeps the last reading of the counters, since a speed is the difference
/// between two of them.
#[derive(Debug, Default)]
pub struct DriveCounter {
    last: Option<(Instant, Counters)>,
    rates: Counters,
}

impl DriveCounter {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Each drive's activity since the last reading, with how full the
    /// filesystems on it are, from counters already read.
    pub fn take(
        &mut self,
        now: Instant,
        counters: &Counters,
        filesystems: &[Filesystem],
    ) -> Vec<DriveActivity> {
        match &self.last {
            Some((at, _)) if now.duration_since(*at) < SHORTEST_GAP => {}
            Some((at, before)) => {
                let seconds = now.duration_since(*at).as_secs_f64();

                self.rates = counters
                    .iter()
                    .map(|(name, (read, written))| {
                        let (read_before, written_before) =
                            before.get(name).copied().unwrap_or((*read, *written));
                        let per_second = |now: u64, then: u64| {
                            let moved = now.saturating_sub(then);

                            #[allow(
                                clippy::cast_possible_truncation,
                                clippy::cast_sign_loss,
                                clippy::cast_precision_loss,
                                reason = "a byte count a second is far inside both ranges"
                            )]
                            let rate = (moved as f64 / seconds).round() as u64;

                            rate
                        };

                        (
                            name.clone(),
                            (
                                per_second(*read, read_before),
                                per_second(*written, written_before),
                            ),
                        )
                    })
                    .collect();
                self.last = Some((now, counters.clone()));
            }
            None => {
                self.last = Some((now, counters.clone()));
            }
        }

        let fill = fill_of(filesystems);
        let mut drives: Vec<DriveActivity> = counters
            .keys()
            .map(|name| {
                let (read, written) = self.rates.get(name).copied().unwrap_or_default();
                let filled = fill.get(name);

                DriveActivity {
                    name: name.clone(),
                    read_bytes_per_second: read,
                    written_bytes_per_second: written,
                    used_bytes: filled.map(|(used, _)| *used),
                    filesystem_bytes: filled.map(|(_, total)| *total),
                }
            })
            .collect();

        drives.sort_by(|left, right| left.name.cmp(&right.name));

        drives
    }

    /// Each drive's activity now, reading the machine's counters.
    pub fn read(&mut self, filesystems: &[Filesystem]) -> Vec<DriveActivity> {
        let counters = std::fs::read_to_string("/proc/diskstats")
            .map(|text| parse_diskstats(&text))
            .unwrap_or_default();

        self.take(Instant::now(), &counters, filesystems)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_the_whole_drive_of_a_partition() {
        assert_eq!(drive_of("/dev/sda1").as_deref(), Some("sda"));
        assert_eq!(drive_of("sdb").as_deref(), Some("sdb"));
        assert_eq!(drive_of("/dev/nvme0n1p2").as_deref(), Some("nvme0n1"));
        assert_eq!(drive_of("nvme1n1").as_deref(), Some("nvme1n1"));
        assert_eq!(drive_of("mmcblk0p1").as_deref(), Some("mmcblk0"));
        assert_eq!(drive_of("loop3"), None);
        assert_eq!(drive_of("overlay"), None);
        assert_eq!(drive_of("md127"), None);
    }

    #[test]
    fn reads_only_whole_drives_from_the_counters() {
        let text = "\
 259       0 nvme0n1 100 0 2000 0 50 0 4000 0 0 0 0
 259       1 nvme0n1p1 100 0 2000 0 50 0 4000 0 0 0 0
   8       0 sda 10 0 8 0 5 0 16 0 0 0 0
   7       0 loop0 1 0 2 0 0 0 0 0 0 0 0";
        let counters = parse_diskstats(text);

        assert_eq!(counters.len(), 2);
        assert_eq!(counters.get("nvme0n1"), Some(&(2000 * 512, 4000 * 512)));
        assert_eq!(counters.get("sda"), Some(&(8 * 512, 16 * 512)));
    }

    #[test]
    fn says_how_fast_each_drive_moved_since_the_last_reading() {
        let mut counter = DriveCounter::new();
        let start = Instant::now();
        let first = HashMap::from([("sda".to_owned(), (1_000, 2_000))]);
        let second = HashMap::from([("sda".to_owned(), (3_000, 6_000))]);

        counter.take(start, &first, &[]);

        let drives = counter.take(start + Duration::from_secs(2), &second, &[]);

        assert_eq!(drives[0].read_bytes_per_second, 1_000);
        assert_eq!(drives[0].written_bytes_per_second, 2_000);
    }

    #[test]
    fn counts_a_filesystem_mounted_twice_once() {
        let mut counter = DriveCounter::new();
        let filesystem = Filesystem {
            device: "/dev/sda1".to_owned(),
            total_bytes: 100,
            available_bytes: 40,
        };
        let drives = counter.take(
            Instant::now(),
            &HashMap::from([("sda".to_owned(), (0, 0))]),
            &[filesystem.clone(), filesystem],
        );

        assert_eq!(drives[0].used_bytes, Some(60));
        assert_eq!(drives[0].filesystem_bytes, Some(100));
    }
}
