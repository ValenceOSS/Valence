//! What Valence itself is putting through the video engine.
//!
//! The kernel keeps a per-client account of how long each graphics engine
//! spent on that client's work, and publishes it beside every open file on a
//! render node. Adding up the clients Valence opened gives how hard it is
//! working the block that encodes and decodes video — without a vendor tool,
//! without a capability, and without the `perf` interface a container refuses
//! to hand out anyway.
//!
//! It is not the whole card. Nothing here can see another container's
//! transcodes or a desktop session sharing the same silicon, because the
//! kernel will not attribute those to us without privileges Valence has
//! decided not to ask for. What it measures is Valence's own load, which is
//! the figure that decides whether the next stream will keep up, and it is
//! reported as that rather than passed off as the card.
//!
//! On Intel the video engine both encodes and decodes, so a library being
//! remuxed and a library being converted show up in the same number.
//!
//! Requires Linux 5.19 for `i915`. An older kernel publishes no engine times,
//! which reads here as no figure rather than as an idle one.

use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Instant;

use tokio::fs;

use serde::Serialize;

use crate::pci_names::CardId;

/// The engines whose time is kept, by the name the kernel gives each: 3D
/// work, copies between buffers, video encoding and decoding, and the
/// scaling and colour work beside it.
const ENGINES: [&str; 4] = ["render", "copy", "video", "video-enhance"];

/// The engine the video work runs on.
const VIDEO: &str = "video";

/// The prefix of every line saying how much memory a client holds in one
/// region, resident rather than merely reserved.
const RESIDENT: &str = "drm-resident-";

/// The kernel's own handle for one open file on a render node.
const CLIENT: &str = "drm-client-id:";

/// The number in a `0x`-prefixed sysfs attribute.
fn hex_attribute(text: &str) -> Option<u16> {
    u16::from_str_radix(text.trim().trim_start_matches("0x"), 16).ok()
}

/// The first card on this machine that can be given work.
///
/// Render nodes rather than cards, because a render node is exactly the thing
/// a transcode opens: a device that does offscreen work. A card with no render
/// node beside it drives a display and nothing else, and is not what any of
/// this is about.
pub async fn card() -> Option<CardId> {
    let mut nodes = fs::read_dir("/sys/class/drm").await.ok()?;

    while let Ok(Some(node)) = nodes.next_entry().await {
        if !node.file_name().to_string_lossy().starts_with("renderD") {
            continue;
        }

        let device = node.path().join("device");

        let (Ok(vendor), Ok(id)) = (
            fs::read_to_string(device.join("vendor")).await,
            fs::read_to_string(device.join("device")).await,
        ) else {
            continue;
        };

        let (Some(vendor), Some(id)) = (hex_attribute(&vendor), hex_attribute(&id)) else {
            continue;
        };

        return Some(CardId { vendor, device: id });
    }

    None
}

/// Every open file on a render node, wherever in this container it is held.
///
/// Nothing is assumed about which processes matter. Valence's transcodes are
/// its own children today, but a plugin driving `FFmpeg` for itself is doing
/// work on the same engine and should be counted with the rest. Anything the
/// kernel will not let this read is passed over: a process that exits mid-walk
/// is ordinary, not a fault.
async fn open_render_files() -> Vec<PathBuf> {
    let mut found = Vec::new();

    let Ok(mut processes) = fs::read_dir("/proc").await else {
        return found;
    };

    while let Ok(Some(process)) = processes.next_entry().await {
        if process
            .file_name()
            .to_string_lossy()
            .parse::<u32>()
            .is_err()
        {
            continue;
        }

        let Ok(mut handles) = fs::read_dir(process.path().join("fd")).await else {
            continue;
        };

        while let Ok(Some(handle)) = handles.next_entry().await {
            let Ok(target) = fs::read_link(handle.path()).await else {
                continue;
            };

            if target.starts_with("/dev/dri/") {
                found.push(process.path().join("fdinfo").join(handle.file_name()));
            }
        }
    }

    found
}

/// The digits straight after a key, however much whitespace follows it.
fn number_after(text: &str, key: &str) -> Option<u64> {
    text.lines()
        .find_map(|line| line.strip_prefix(key))
        .and_then(|rest| rest.split_whitespace().next())
        .and_then(|digits| digits.parse().ok())
}

/// What every client on the machine had used when this was taken.
#[derive(Default)]
struct Snapshot {
    busy: HashMap<&'static str, HashMap<u64, u64>>,
    capacity: HashMap<&'static str, u64>,
    memory: HashMap<u64, u64>,
    clients: usize,
}

/// A size the kernel wrote with its unit, in bytes.
fn bytes_of(text: &str) -> Option<u64> {
    let mut parts = text.split_whitespace();
    let amount: u64 = parts.next()?.parse().ok()?;
    let scale = match parts.next() {
        None => 1,
        Some("KiB") => 1 << 10,
        Some("MiB") => 1 << 20,
        Some("GiB") => 1 << 30,
        Some(_) => return None,
    };

    amount.checked_mul(scale)
}

/// How much memory one client holds across every region it has memory in.
fn resident_bytes(fdinfo: &str) -> Option<u64> {
    let sizes: Vec<u64> = fdinfo
        .lines()
        .filter_map(|line| line.strip_prefix(RESIDENT))
        .filter_map(|rest| rest.split_once(':'))
        .filter_map(|(_, size)| bytes_of(size))
        .collect();

    (!sizes.is_empty()).then(|| sizes.iter().sum())
}

/// Adds one client's books to a snapshot.
fn absorb(snapshot: &mut Snapshot, fdinfo: &str) {
    let Some(client) = number_after(fdinfo, CLIENT) else {
        return;
    };

    snapshot.clients += 1;

    if let Some(bytes) = resident_bytes(fdinfo) {
        snapshot.memory.insert(client, bytes);
    }

    for engine in ENGINES {
        let Some(busy) = number_after(fdinfo, &format!("drm-engine-{engine}:")) else {
            continue;
        };

        snapshot
            .busy
            .entry(engine)
            .or_default()
            .insert(client, busy);

        let capacity = number_after(fdinfo, &format!("drm-engine-capacity-{engine}:")).unwrap_or(1);
        let held = snapshot.capacity.entry(engine).or_insert(1);

        *held = (*held).max(capacity);
    }
}

async fn snapshot() -> Snapshot {
    let mut snapshot = Snapshot::default();

    for path in open_render_files().await {
        if let Ok(fdinfo) = fs::read_to_string(path).await {
            absorb(&mut snapshot, &fdinfo);
        }
    }

    snapshot
}

/// The share of the elapsed time the engine spent on work Valence asked for.
///
/// Only clients present in both readings are counted. A client that has since
/// exited took its books with it, and one that has only just opened has been
/// running for less than the interval, so counting either would report time
/// that did not pass where this says it did. A stream loses at most one
/// interval at its start, and nothing after that.
fn share(then: &Snapshot, now: &Snapshot, elapsed: u64) -> Option<f32> {
    share_of(VIDEO, then, now, elapsed)
}

/// The share of the elapsed time one engine spent on work Valence asked for,
/// or nothing where the driver keeps no time for that engine. With no clients
/// open at all nothing is using any engine, which is an idle reading rather
/// than a missing one.
fn share_of(engine: &str, then: &Snapshot, now: &Snapshot, elapsed: u64) -> Option<f32> {
    if now.clients == 0 {
        return Some(0.0);
    }

    let capacity = now.capacity.get(engine).copied().unwrap_or(1).max(1);
    let empty = HashMap::new();
    let before = then.busy.get(engine).unwrap_or(&empty);
    let spent: u64 = now
        .busy
        .get(engine)?
        .iter()
        .filter_map(|(client, busy)| Some(busy.saturating_sub(*before.get(client)?)))
        .sum();

    let basis = spent
        .checked_mul(10_000)?
        .checked_div(elapsed.checked_mul(capacity)?)?;

    Some(f32::from(u16::try_from(basis.min(10_000)).ok()?) / 100.0)
}

/// What each engine spent on Valence's work over the last interval, and how
/// much memory Valence's work holds on the card.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineUse {
    pub render: Option<f32>,
    pub copy: Option<f32>,
    pub video: Option<f32>,
    pub video_enhance: Option<f32>,
    pub memory_bytes: Option<u64>,
}

/// The running account of what the video engine has been doing.
///
/// Engine times are totals since a client opened, so a figure only exists once
/// there are two readings to put either side of an interval.
#[derive(Default)]
pub struct VideoEngine {
    previous: Option<(Snapshot, Instant)>,
}

impl VideoEngine {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Takes a reading, or says the kernel here does not keep these books.
    ///
    /// A machine with no clients open reports nothing in use, which is what is
    /// true: no transcode is running. A machine whose clients are open but
    /// carry no engine times reports no figure at all, because a driver that
    /// does not answer must never read as an idle one.
    pub async fn read(&mut self) -> Option<EngineUse> {
        let now = snapshot().await;
        let taken = Instant::now();

        if now.clients > 0 && now.busy.is_empty() {
            self.previous = None;

            return None;
        }

        let elapsed = self
            .previous
            .as_ref()
            .and_then(|(_, at)| u64::try_from(taken.duration_since(*at).as_nanos()).ok())
            .filter(|elapsed| *elapsed > 0);

        let reading = match (&self.previous, elapsed) {
            (Some((then, _)), Some(elapsed)) => Some(EngineUse {
                render: share_of("render", then, &now, elapsed),
                copy: share_of("copy", then, &now, elapsed),
                video: share(then, &now, elapsed),
                video_enhance: share_of("video-enhance", then, &now, elapsed),
                memory_bytes: (now.clients == 0 || !now.memory.is_empty())
                    .then(|| now.memory.values().sum()),
            }),
            _ => None,
        };

        self.previous = Some((now, taken));

        reading
    }
}

#[cfg(test)]
mod tests {
    use super::{
        absorb, bytes_of, hex_attribute, number_after, resident_bytes, share, share_of, Snapshot,
        VideoEngine,
    };

    const FDINFO: &str = "\
pos:\t0
flags:\t02100002
drm-driver:\ti915
drm-pdev:\t0000:00:02.0
drm-client-id:\t42
drm-engine-render:\t120000 ns
drm-engine-video:\t1500000000 ns
drm-engine-capacity-video:\t2
drm-engine-video-enhance:\t40000 ns
";

    fn taken(fdinfo: &str) -> Snapshot {
        let mut snapshot = Snapshot::default();

        absorb(&mut snapshot, fdinfo);

        snapshot
    }

    #[test]
    fn reads_the_engine_the_video_work_runs_on() {
        assert_eq!(
            number_after(FDINFO, "drm-engine-video:"),
            Some(1_500_000_000)
        );
    }

    #[test]
    fn never_reads_one_engines_time_as_another_engines() {
        assert_eq!(number_after(FDINFO, "drm-engine-render:"), Some(120_000));
    }

    #[test]
    fn says_nothing_about_a_key_that_is_not_there() {
        assert_eq!(number_after(FDINFO, "drm-cycles-video:"), None);
    }

    #[test]
    fn reads_a_sysfs_attribute_written_the_way_sysfs_writes_it() {
        assert_eq!(hex_attribute("0x8086\n"), Some(0x8086));
    }

    #[test]
    fn counts_a_client_whose_driver_keeps_no_engine_times() {
        let snapshot = taken("drm-driver:\txe\ndrm-client-id:\t7\n");

        assert_eq!(snapshot.clients, 1);
        assert!(
            snapshot.busy.is_empty(),
            "a driver that reports no time must leave nothing behind to average"
        );
    }

    #[test]
    fn takes_the_share_of_the_interval_the_engine_was_busy() {
        let then = taken("drm-client-id:\t1\ndrm-engine-video:\t0 ns\n");
        let now = taken("drm-client-id:\t1\ndrm-engine-video:\t500000000 ns\n");

        assert_eq!(share(&then, &now, 1_000_000_000), Some(50.0));
    }

    #[test]
    fn divides_by_the_engines_a_chip_actually_has() {
        let then =
            taken("drm-client-id:\t1\ndrm-engine-video:\t0 ns\ndrm-engine-capacity-video:\t2\n");
        let now = taken(
            "drm-client-id:\t1\ndrm-engine-video:\t1000000000 ns\ndrm-engine-capacity-video:\t2\n",
        );

        assert_eq!(
            share(&then, &now, 1_000_000_000),
            Some(50.0),
            "two engines busy half the time each is half the block, not all of it"
        );
    }

    #[test]
    fn never_counts_a_client_that_was_not_there_before() {
        let then = Snapshot::default();
        let now = taken("drm-client-id:\t1\ndrm-engine-video:\t900000000 ns\n");

        assert_eq!(
            share(&then, &now, 1_000_000_000),
            Some(0.0),
            "a stream that has only just started has not been running for the whole interval"
        );
    }

    #[test]
    fn forgets_a_client_that_has_since_exited_rather_than_going_backwards() {
        let then = taken("drm-client-id:\t9\ndrm-engine-video:\t900000000 ns\n");
        let now = Snapshot::default();

        assert_eq!(share(&then, &now, 1_000_000_000), Some(0.0));
    }

    #[test]
    fn keeps_a_counter_that_has_gone_backwards_from_reading_as_enormous() {
        let then = taken("drm-client-id:\t1\ndrm-engine-video:\t900000000 ns\n");
        let now = taken("drm-client-id:\t1\ndrm-engine-video:\t5 ns\n");

        assert_eq!(share(&then, &now, 1_000_000_000), Some(0.0));
    }

    #[test]
    fn never_reports_more_of_the_engine_than_there_is() {
        let then = taken("drm-client-id:\t1\ndrm-engine-video:\t0 ns\n");
        let now = taken("drm-client-id:\t1\ndrm-engine-video:\t9000000000 ns\n");

        assert_eq!(share(&then, &now, 1_000_000_000), Some(100.0));
    }

    #[tokio::test]
    async fn gives_no_figure_until_there_are_two_readings_to_compare() {
        let mut engine = VideoEngine::new();

        assert_eq!(engine.read().await, None);
    }

    #[test]
    fn reads_every_engine_as_idle_when_nothing_is_open() {
        let idle = Snapshot::default();

        assert_eq!(share_of("render", &idle, &idle, 1_000_000_000), Some(0.0));
        assert_eq!(
            share_of("video-enhance", &idle, &idle, 1_000_000_000),
            Some(0.0)
        );
    }

    #[test]
    fn keeps_each_engines_time_apart() {
        let then = taken("drm-client-id:\t1\ndrm-engine-render:\t0 ns\ndrm-engine-copy:\t0 ns\n");
        let now = taken(
            "drm-client-id:\t1\ndrm-engine-render:\t250000000 ns\ndrm-engine-copy:\t750000000 ns\n",
        );

        assert_eq!(share_of("render", &then, &now, 1_000_000_000), Some(25.0));
        assert_eq!(share_of("copy", &then, &now, 1_000_000_000), Some(75.0));
        assert_eq!(
            share_of("video", &then, &now, 1_000_000_000),
            None,
            "an engine the driver keeps no time for has no figure, not an idle one"
        );
    }

    #[test]
    fn reads_sizes_in_the_units_the_kernel_writes() {
        assert_eq!(bytes_of(" 12 KiB"), Some(12 * 1024));
        assert_eq!(bytes_of("3 MiB"), Some(3 * 1024 * 1024));
        assert_eq!(bytes_of("4096"), Some(4096));
        assert_eq!(bytes_of("2 parsecs"), None);
    }

    #[test]
    fn adds_up_the_memory_a_client_holds_in_every_region() {
        assert_eq!(
            resident_bytes("drm-resident-system0:\t8 KiB\ndrm-resident-local0:\t2 MiB\ndrm-total-system0:\t99 MiB\n"),
            Some(8 * 1024 + 2 * 1024 * 1024),
            "memory merely reserved is not memory in use"
        );
        assert_eq!(resident_bytes(FDINFO), None);
    }
}
