//! What the machine is built from.
//!
//! The monitor says what the machine is doing; this says what it is. Somebody
//! looking at a busy processor wants to know whether it is a laptop chip or a
//! server one, and somebody looking at a full disk wants to know which drive
//! it is. None of it changes while the service runs, so it is read once.
//!
//! Inside a container most of it still reads true, because a container shares
//! the host's kernel and the kernel publishes the processor, the memory total
//! and every block device. What it will not publish without privileges is the
//! firmware table that names each memory stick, so that part is reported only
//! where it could be read, and left out rather than guessed where it could not.
//!
//! A virtual machine is the exception to all of it: Docker Desktop on a Mac or
//! on Windows runs every container inside one, and the processor, memory and
//! disk it sees are the ones it was handed. That is reported too, so nobody
//! mistakes a slice of their computer for the whole of it.

use std::path::Path;

use serde::Serialize;
use serde_json::Value;
use sysinfo::{CpuRefreshKind, System};
use tokio::sync::OnceCell;

/// Where the service is running, as far as the machine will say.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Surroundings {
    /// Straight on the machine.
    Host,
    /// In a container on the machine, sharing its kernel.
    Container,
    /// In a virtual machine, which may be holding a container of its own.
    VirtualMachine,
}

/// The processor.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Processor {
    /// The name the processor gives itself.
    pub model: String,
    /// Physical cores, where the platform will count them.
    pub cores: Option<usize>,
    /// Logical processors, which is cores times the threads each runs.
    pub threads: usize,
    /// The fastest clock it runs at, in megahertz, where it says.
    pub speed_mhz: Option<u64>,
    /// The cores, grouped by the kind each is, and each holding the logical
    /// processors that run on it. One group on a chip whose cores are all
    /// alike, and none where the platform would not say.
    pub groups: Vec<CoreGroup>,
}

/// What a group of cores is for.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CoreKind {
    Performance,
    Efficiency,
    Other,
}

/// Cores of one kind.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreGroup {
    pub kind: CoreKind,
    /// What the platform calls them, where it names them, as a Mac does.
    pub name: Option<String>,
    /// Each core, as the numbers of the logical processors running on it.
    pub cores: Vec<Vec<usize>>,
}

/// One memory stick, or the one package of memory on a system on a chip.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryModule {
    pub size_bytes: Option<u64>,
    /// The generation, such as `DDR5`.
    pub kind: Option<String>,
    /// Transfers a second, in millions, which is the number on the box.
    pub speed_mts: Option<u64>,
    pub manufacturer: Option<String>,
    /// Which slot it sits in.
    pub slot: Option<String>,
}

/// The memory.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Memory {
    pub total_bytes: u64,
    /// Every stick that could be read, which is none where the firmware table
    /// is closed to the service.
    pub modules: Vec<MemoryModule>,
}

/// What a drive stores on.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DriveKind {
    Ssd,
    Hdd,
    Unknown,
}

/// One physical drive.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Drive {
    /// What the operating system calls it, such as `sda` or `nvme0n1`.
    pub name: String,
    /// The name the drive gives itself.
    pub model: Option<String>,
    pub kind: DriveKind,
    /// How it is attached, such as `NVMe`, `SATA` or `USB`.
    pub connection: Option<String>,
    pub total_bytes: u64,
}

/// Everything the machine is built from that could be read.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Hardware {
    pub surroundings: Surroundings,
    pub processor: Option<Processor>,
    pub memory: Memory,
    pub drives: Vec<Drive>,
}

static HARDWARE: OnceCell<Hardware> = OnceCell::const_new();

/// What the machine is built from, read on the first ask and kept.
pub async fn read_hardware() -> Hardware {
    HARDWARE
        .get_or_init(|| async {
            tokio::task::spawn_blocking(read_now)
                .await
                .unwrap_or_else(|_| Hardware {
                    surroundings: Surroundings::Host,
                    processor: None,
                    memory: Memory {
                        total_bytes: 0,
                        modules: Vec::new(),
                    },
                    drives: Vec::new(),
                })
        })
        .await
        .clone()
}

/// Reads everything, blocking, which is why it runs off the async threads.
fn read_now() -> Hardware {
    let mut system = System::new();

    system.refresh_cpu_list(CpuRefreshKind::nothing().with_frequency());
    system.refresh_memory();

    let processor = system.cpus().first().map(|first| Processor {
        model: first.brand().trim().to_owned(),
        cores: System::physical_core_count(),
        threads: system.cpus().len(),
        speed_mhz: highest_clock_mhz().or(Some(first.frequency()).filter(|mhz| *mhz > 0)),
        groups: core_groups(),
    });

    let profile = system_profile();
    let firmware_modules = std::fs::read("/sys/firmware/dmi/tables/DMI")
        .map(|table| memory_modules_from_smbios(&table))
        .unwrap_or_default();
    let block_drives = linux_drives(Path::new("/sys/block"));

    Hardware {
        surroundings: surroundings(),
        processor,
        memory: Memory {
            total_bytes: system.total_memory(),
            modules: match &profile {
                Some(profile) if firmware_modules.is_empty() => mac_memory_modules(profile),
                _ => firmware_modules,
            },
        },
        drives: match &profile {
            Some(profile) if block_drives.is_empty() => mac_drives(profile),
            _ => block_drives,
        },
    }
}

/// The cores, grouped by kind, from whichever the platform will say.
fn core_groups() -> Vec<CoreGroup> {
    if cfg!(target_os = "macos") {
        return std::process::Command::new("sysctl")
            .arg("hw")
            .output()
            .map(|output| mac_core_groups(&String::from_utf8_lossy(&output.stdout)))
            .unwrap_or_default();
    }

    linux_core_groups(Path::new("/sys/devices"))
}

/// The cores a Mac describes, one group per performance level.
///
/// A Mac numbers its logical processors from the least capable level up, so
/// the levels are handed processors in that order, level zero last, and then
/// listed fastest first.
fn mac_core_groups(sysctl: &str) -> Vec<CoreGroup> {
    let mut levels: Vec<(usize, Option<String>, usize, usize)> = Vec::new();

    for line in sysctl.lines() {
        let Some(rest) = line.strip_prefix("hw.perflevel") else {
            continue;
        };
        let Some((key, value)) = rest.split_once(": ") else {
            continue;
        };
        let Some((level, field)) = key.split_once('.') else {
            continue;
        };
        let Ok(level) = level.parse::<usize>() else {
            continue;
        };

        let index = if let Some(index) = levels.iter().position(|known| known.0 == level) {
            index
        } else {
            levels.push((level, None, 0, 0));
            levels.len() - 1
        };

        match field {
            "name" => levels[index].1 = Some(value.trim().to_owned()),
            "physicalcpu" => levels[index].2 = value.trim().parse().unwrap_or(0),
            "logicalcpu" => levels[index].3 = value.trim().parse().unwrap_or(0),
            _ => {}
        }
    }

    levels.sort_by_key(|level| std::cmp::Reverse(level.0));

    let mut next = 0;
    let mut groups: Vec<CoreGroup> = levels
        .into_iter()
        .filter(|(_, _, physical, logical)| *physical > 0 && *logical >= *physical)
        .map(|(_, name, physical, logical)| {
            let each = logical / physical;
            let cores = (0..physical)
                .map(|_| {
                    let core: Vec<usize> = (next..next + each).collect();

                    next += each;

                    core
                })
                .collect();

            CoreGroup {
                kind: kind_named(name.as_deref()),
                name,
                cores,
            }
        })
        .collect();

    groups.reverse();

    groups
}

/// The kind of core a Mac's name for a level stands for.
fn kind_named(name: Option<&str>) -> CoreKind {
    match name.map(str::to_lowercase).as_deref() {
        Some(said) if said.contains("efficien") => CoreKind::Efficiency,
        Some(said) if said.contains("perform") || said.contains("super") => CoreKind::Performance,
        _ => CoreKind::Other,
    }
}

/// The cores Linux describes.
///
/// Which logical processors share a core comes from each one's thread
/// siblings, so the pairing is the kernel's rather than a guess from the
/// numbering. Which kind each core is comes from Intel's two processor
/// devices on a hybrid chip, or from each core's capacity on an ARM one.
fn linux_core_groups(devices: &Path) -> Vec<CoreGroup> {
    let processors = devices.join("system/cpu");
    let Ok(entries) = std::fs::read_dir(&processors) else {
        return Vec::new();
    };

    let mut numbers: Vec<usize> = entries
        .filter_map(Result::ok)
        .filter_map(|entry| {
            entry
                .file_name()
                .to_string_lossy()
                .strip_prefix("cpu")
                .and_then(|number| number.parse::<usize>().ok())
        })
        .collect();

    numbers.sort_unstable();

    let read = |path: std::path::PathBuf| {
        std::fs::read_to_string(path)
            .ok()
            .map(|text| text.trim().to_owned())
    };

    let mut cores: Vec<Vec<usize>> = Vec::new();

    for number in &numbers {
        if cores.iter().any(|core| core.contains(number)) {
            continue;
        }

        let siblings = read(processors.join(format!("cpu{number}/topology/thread_siblings_list")))
            .map(|list| parse_cpu_list(&list))
            .filter(|list| list.contains(number))
            .unwrap_or_else(|| vec![*number]);

        cores.push(siblings);
    }

    let hybrid = (
        read(devices.join("cpu_core/cpus")).map(|list| parse_cpu_list(&list)),
        read(devices.join("cpu_atom/cpus")).map(|list| parse_cpu_list(&list)),
    );

    if let (Some(performance), Some(efficiency)) = hybrid {
        let within = |list: &[usize]| -> Vec<Vec<usize>> {
            cores
                .iter()
                .filter(|core| core.iter().any(|cpu| list.contains(cpu)))
                .cloned()
                .collect()
        };

        return vec![
            CoreGroup {
                kind: CoreKind::Performance,
                name: None,
                cores: within(&performance),
            },
            CoreGroup {
                kind: CoreKind::Efficiency,
                name: None,
                cores: within(&efficiency),
            },
        ];
    }

    let capacity = |core: &Vec<usize>| {
        core.first()
            .and_then(|cpu| read(processors.join(format!("cpu{cpu}/cpu_capacity"))))
            .and_then(|said| said.parse::<u32>().ok())
            .unwrap_or(0)
    };

    let mut capacities: Vec<u32> = cores.iter().map(capacity).collect();

    capacities.sort_unstable_by(|one, other| other.cmp(one));
    capacities.dedup();

    if capacities.len() < 2 {
        return if cores.is_empty() {
            Vec::new()
        } else {
            vec![CoreGroup {
                kind: CoreKind::Other,
                name: None,
                cores,
            }]
        };
    }

    let last = capacities.len() - 1;

    capacities
        .iter()
        .enumerate()
        .map(|(rank, level)| CoreGroup {
            kind: match rank {
                0 => CoreKind::Performance,
                _ if rank == last => CoreKind::Efficiency,
                _ => CoreKind::Other,
            },
            name: None,
            cores: cores
                .iter()
                .filter(|core| capacity(core) == *level)
                .cloned()
                .collect(),
        })
        .collect()
}

/// The processors in a kernel CPU list, such as `0-3,8,10-11`.
fn parse_cpu_list(list: &str) -> Vec<usize> {
    list.split(',')
        .filter_map(|part| {
            let part = part.trim();

            match part.split_once('-') {
                Some((from, to)) => Some((from.parse().ok()?..=to.parse().ok()?).collect()),
                None => part.parse().ok().map(|one| vec![one]),
            }
        })
        .flatten()
        .collect()
}

/// The fastest the first processor is allowed to clock, from the kernel's
/// frequency scaling, which knows the ceiling rather than the moment.
fn highest_clock_mhz() -> Option<u64> {
    std::fs::read_to_string("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq")
        .ok()?
        .trim()
        .parse::<u64>()
        .ok()
        .map(|khz| khz / 1000)
}

/// Whether this is a container, a virtual machine, or the machine itself.
///
/// A virtual machine is told apart by the processor flag every hypervisor
/// sets, and by the kernels Docker Desktop and WSL ship, which say so in their
/// release string. A container leaves a marker file at the root.
fn surroundings() -> Surroundings {
    let release = std::fs::read_to_string("/proc/sys/kernel/osrelease").unwrap_or_default();
    let cpuinfo = std::fs::read_to_string("/proc/cpuinfo").unwrap_or_default();

    if is_virtual(&release, &cpuinfo) {
        return Surroundings::VirtualMachine;
    }

    let cgroup = std::fs::read_to_string("/proc/1/cgroup").unwrap_or_default();

    if Path::new("/.dockerenv").exists()
        || Path::new("/run/.containerenv").exists()
        || ["docker", "containerd", "kubepods", "libpod"]
            .iter()
            .any(|word| cgroup.contains(word))
    {
        return Surroundings::Container;
    }

    Surroundings::Host
}

/// Whether a kernel release and processor description belong to a virtual
/// machine.
fn is_virtual(release: &str, cpuinfo: &str) -> bool {
    let release = release.to_lowercase();

    release.contains("linuxkit")
        || release.contains("microsoft")
        || cpuinfo
            .lines()
            .filter(|line| line.starts_with("flags"))
            .any(|line| line.split_whitespace().any(|flag| flag == "hypervisor"))
}

/// Every physical drive the kernel lists, skipping the devices that are not
/// one: loopback files, memory disks, optical drives and the volumes built on
/// top of real drives.
fn linux_drives(root: &Path) -> Vec<Drive> {
    let Ok(entries) = std::fs::read_dir(root) else {
        return Vec::new();
    };

    let mut drives: Vec<Drive> = entries
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let name = entry.file_name().to_string_lossy().into_owned();

            if ["loop", "ram", "zram", "dm-", "md", "sr", "fd", "nbd", "zd"]
                .iter()
                .any(|prefix| name.starts_with(prefix))
            {
                return None;
            }

            let place = entry.path();
            let read = |file: &str| {
                std::fs::read_to_string(place.join(file))
                    .ok()
                    .map(|text| text.trim().to_owned())
                    .filter(|text| !text.is_empty())
            };
            let sectors = read("size")?.parse::<u64>().ok().filter(|size| *size > 0)?;
            let wired = std::fs::canonicalize(&place)
                .map(|path| path.to_string_lossy().into_owned())
                .unwrap_or_default();

            Some(Drive {
                connection: connection_of(&name, &wired),
                model: read("device/model"),
                kind: match read("queue/rotational").as_deref() {
                    Some("1") => DriveKind::Hdd,
                    Some("0") => DriveKind::Ssd,
                    _ => DriveKind::Unknown,
                },
                total_bytes: sectors.saturating_mul(512),
                name,
            })
        })
        .collect();

    drives.sort_by(|one, other| one.name.cmp(&other.name));

    drives
}

/// How a drive is attached, read from its name and where the kernel wired it.
fn connection_of(name: &str, wired: &str) -> Option<String> {
    let said = if name.starts_with("nvme") {
        "NVMe"
    } else if wired.contains("/usb") {
        "USB"
    } else if wired.contains("/virtio") || name.starts_with("vd") {
        "Virtual"
    } else if wired.contains("/ata") {
        "SATA"
    } else if name.starts_with("mmcblk") {
        "SD"
    } else {
        return None;
    };

    Some(said.to_owned())
}

/// Every memory stick described in an SMBIOS table, skipping empty slots.
///
/// Read straight from the table rather than through `dmidecode`, which the
/// image would otherwise have to carry for one call. Each structure is a type,
/// a length and a handle, then that many bytes, then its strings, each ended by
/// a zero and the set ended by another. Type 17 is a memory device.
fn memory_modules_from_smbios(table: &[u8]) -> Vec<MemoryModule> {
    let mut modules = Vec::new();
    let mut at = 0;

    while at + 4 <= table.len() {
        let kind = table[at];
        let length = usize::from(table[at + 1]);

        if length < 4 || at + length > table.len() {
            break;
        }

        let formatted = &table[at..at + length];
        let mut end = at + length;

        while end + 1 < table.len() && !(table[end] == 0 && table[end + 1] == 0) {
            end += 1;
        }

        let strings: Vec<String> = table[at + length..end]
            .split(|byte| *byte == 0)
            .filter(|part| !part.is_empty())
            .map(|part| String::from_utf8_lossy(part).trim().to_owned())
            .collect();

        if kind == 127 {
            break;
        }

        if kind == 17 {
            if let Some(module) = memory_device(formatted, &strings) {
                modules.push(module);
            }
        }

        at = end + 2;
    }

    modules
}

/// One memory device structure, or nothing for an empty slot.
fn memory_device(formatted: &[u8], strings: &[String]) -> Option<MemoryModule> {
    let word = |offset: usize| {
        formatted
            .get(offset..offset + 2)
            .map(|bytes| u16::from_le_bytes([bytes[0], bytes[1]]))
    };
    let text = |offset: usize| {
        let index = usize::from(*formatted.get(offset)?);

        strings
            .get(index.checked_sub(1)?)
            .filter(|said| !is_placeholder(said))
            .cloned()
    };

    let size = word(0x0C)?;

    if size == 0 {
        return None;
    }

    let size_bytes = match size {
        0xFFFF => None,
        0x7FFF => formatted
            .get(0x1C..0x20)
            .map(|bytes| u64::from(u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])))
            .map(|megabytes| megabytes * 1024 * 1024),
        _ if size & 0x8000 != 0 => Some(u64::from(size & 0x7FFF) * 1024),
        _ => Some(u64::from(size) * 1024 * 1024),
    };

    let speed = word(0x20)
        .filter(|speed| *speed != 0 && *speed != 0xFFFF)
        .or_else(|| word(0x15).filter(|speed| *speed != 0 && *speed != 0xFFFF));

    Some(MemoryModule {
        size_bytes,
        kind: formatted.get(0x12).and_then(|kind| memory_kind(*kind)),
        speed_mts: speed.map(u64::from),
        manufacturer: text(0x17),
        slot: text(0x10),
    })
}

/// The generation an SMBIOS memory type number stands for.
fn memory_kind(number: u8) -> Option<String> {
    let said = match number {
        0x12 => "DDR",
        0x13 => "DDR2",
        0x18 => "DDR3",
        0x1A => "DDR4",
        0x1B => "LPDDR",
        0x1C => "LPDDR2",
        0x1D => "LPDDR3",
        0x1E => "LPDDR4",
        0x22 => "DDR5",
        0x23 => "LPDDR5",
        _ => return None,
    };

    Some(said.to_owned())
}

/// Whether firmware wrote a stand-in where a real value belongs, which many
/// boards do for every field they were not bothered to fill.
fn is_placeholder(said: &str) -> bool {
    let lower = said.to_lowercase();

    said.is_empty()
        || lower == "unknown"
        || lower.contains("not specified")
        || lower.contains("to be filled")
        || lower.starts_with("manufacturer")
        || said.chars().all(|letter| letter == '0' || letter == ' ')
}

/// What `system_profiler` says about memory and storage, in one call because
/// each call starts the whole tool.
fn system_profile() -> Option<Value> {
    if !cfg!(target_os = "macos") {
        return None;
    }

    let output = std::process::Command::new("system_profiler")
        .args(["SPMemoryDataType", "SPStorageDataType", "-json"])
        .output()
        .ok()?;

    serde_json::from_slice(&output.stdout).ok()
}

/// The memory a Mac describes: a stick per slot on an Intel Mac, and one
/// package with no slots on Apple silicon.
fn mac_memory_modules(profile: &Value) -> Vec<MemoryModule> {
    let Some(entries) = profile.get("SPMemoryDataType").and_then(Value::as_array) else {
        return Vec::new();
    };

    let describe = |entry: &Value, size_key: &str| {
        let text = |key: &str| {
            entry
                .get(key)
                .and_then(Value::as_str)
                .map(str::to_owned)
                .filter(|said| !is_placeholder(said) && said != "Empty")
        };

        MemoryModule {
            size_bytes: text(size_key).and_then(|said| bytes_from_words(&said)),
            kind: text("dimm_type"),
            speed_mts: text("dimm_speed").and_then(|said| {
                said.split_whitespace()
                    .next()
                    .and_then(|number| number.parse::<u64>().ok())
            }),
            manufacturer: text("dimm_manufacturer"),
            slot: entry
                .get("_items")
                .is_none()
                .then(|| text("_name"))
                .flatten(),
        }
    };

    entries
        .iter()
        .flat_map(
            |entry| match entry.get("_items").and_then(Value::as_array) {
                Some(sticks) => sticks
                    .iter()
                    .filter(|stick| stick.get("dimm_size").and_then(Value::as_str) != Some("Empty"))
                    .map(|stick| describe(stick, "dimm_size"))
                    .collect::<Vec<_>>(),
                None => vec![describe(entry, "SPMemoryDataType")],
            },
        )
        .collect()
}

/// The whole disk a volume's BSD name belongs to, so `disk3s1s1` is `disk3`.
fn whole_disk(bsd: &str) -> String {
    let rest = bsd.strip_prefix("disk").unwrap_or(bsd);
    let number: String = rest.chars().take_while(char::is_ascii_digit).collect();

    format!("disk{number}")
}

/// A size written out the way `system_profiler` writes it, such as `16 GB`.
fn bytes_from_words(said: &str) -> Option<u64> {
    let mut words = said.split_whitespace();
    let number = words.next()?.parse::<u64>().ok()?;
    let unit = match words.next()? {
        "TB" => 1024 * 1024 * 1024 * 1024,
        "GB" => 1024 * 1024 * 1024,
        "MB" => 1024 * 1024,
        _ => return None,
    };

    Some(number * unit)
}

/// The drives a Mac describes, one per physical drive however many volumes
/// it holds.
fn mac_drives(profile: &Value) -> Vec<Drive> {
    let Some(volumes) = profile.get("SPStorageDataType").and_then(Value::as_array) else {
        return Vec::new();
    };

    let mut drives: Vec<Drive> = Vec::new();

    for volume in volumes {
        let Some(physical) = volume.get("physical_drive") else {
            continue;
        };

        let text = |key: &str| physical.get(key).and_then(Value::as_str).map(str::to_owned);
        let Some(model) = text("device_name") else {
            continue;
        };

        if text("protocol").as_deref() == Some("Disk Image") {
            continue;
        }
        let size = volume
            .get("size_in_bytes")
            .and_then(Value::as_u64)
            .unwrap_or(0);

        if let Some(known) = drives
            .iter_mut()
            .find(|drive| drive.model.as_deref() == Some(&model))
        {
            known.total_bytes = known.total_bytes.max(size);

            continue;
        }

        drives.push(Drive {
            name: volume
                .get("bsd_name")
                .and_then(Value::as_str)
                .map_or_else(|| model.clone(), whole_disk),
            kind: match text("medium_type").as_deref() {
                Some("ssd") => DriveKind::Ssd,
                Some("rotational") => DriveKind::Hdd,
                _ => DriveKind::Unknown,
            },
            connection: text("protocol"),
            total_bytes: size,
            model: Some(model),
        });
    }

    drives
}

#[cfg(test)]
mod tests {
    use super::*;

    fn structure(kind: u8, formatted: &[u8], strings: &[&str]) -> Vec<u8> {
        let mut bytes = vec![kind, u8::try_from(formatted.len() + 4).unwrap(), 0, 0];

        bytes.extend_from_slice(formatted);

        for said in strings {
            bytes.extend_from_slice(said.as_bytes());
            bytes.push(0);
        }

        if strings.is_empty() {
            bytes.push(0);
        }

        bytes.push(0);

        bytes
    }

    fn memory_device_bytes(size_mb: u16, kind: u8, speed: u16) -> Vec<u8> {
        let mut formatted = vec![0u8; 0x28 - 4];
        let put = |formatted: &mut Vec<u8>, offset: usize, value: u16| {
            formatted[offset - 4..offset - 2].copy_from_slice(&value.to_le_bytes());
        };

        put(&mut formatted, 0x0C, size_mb);
        formatted[0x10 - 4] = 1;
        formatted[0x12 - 4] = kind;
        put(&mut formatted, 0x15, speed);
        formatted[0x17 - 4] = 2;
        put(&mut formatted, 0x20, speed);

        structure(17, &formatted, &["DIMM A1", "Kingston"])
    }

    #[test]
    fn reads_memory_sticks_and_skips_empty_slots() {
        let mut table = structure(0, &[0; 20], &["Vendor"]);

        table.extend(memory_device_bytes(16384, 0x22, 5600));
        table.extend(memory_device_bytes(0, 0x02, 0));
        table.extend(structure(127, &[], &[]));

        assert_eq!(
            memory_modules_from_smbios(&table),
            vec![MemoryModule {
                size_bytes: Some(16 * 1024 * 1024 * 1024),
                kind: Some("DDR5".to_owned()),
                speed_mts: Some(5600),
                manufacturer: Some("Kingston".to_owned()),
                slot: Some("DIMM A1".to_owned()),
            }]
        );
    }

    #[test]
    fn reads_a_macs_performance_levels_fastest_first() {
        let sysctl = "hw.nperflevels: 2\nhw.perflevel0.physicalcpu: 2\nhw.perflevel0.logicalcpu: 2\nhw.perflevel0.name: Super\nhw.perflevel1.physicalcpu: 3\nhw.perflevel1.logicalcpu: 3\nhw.perflevel1.name: Performance\n";

        assert_eq!(
            mac_core_groups(sysctl),
            vec![
                CoreGroup {
                    kind: CoreKind::Performance,
                    name: Some("Super".to_owned()),
                    cores: vec![vec![3], vec![4]],
                },
                CoreGroup {
                    kind: CoreKind::Performance,
                    name: Some("Performance".to_owned()),
                    cores: vec![vec![0], vec![1], vec![2]],
                },
            ]
        );
    }

    #[test]
    fn reads_a_kernel_cpu_list() {
        assert_eq!(parse_cpu_list("0-2,8,10-11"), vec![0, 1, 2, 8, 10, 11]);
    }

    #[test]
    fn a_broken_table_reads_as_nothing() {
        assert_eq!(memory_modules_from_smbios(&[17, 2, 0]), Vec::new());
    }

    #[test]
    fn tells_a_virtual_machine_apart() {
        assert!(is_virtual("6.10.14-linuxkit", ""));
        assert!(is_virtual("5.15.0-microsoft-standard-WSL2", ""));
        assert!(is_virtual("6.1.0", "flags\t\t: fpu vme hypervisor"));
        assert!(!is_virtual(
            "6.6.44-production+truenas",
            "flags\t\t: fpu vme"
        ));
    }

    #[test]
    fn says_how_a_drive_is_attached() {
        assert_eq!(connection_of("nvme0n1", "").as_deref(), Some("NVMe"));
        assert_eq!(
            connection_of("sda", "/sys/devices/pci0000:00/0000:00:17.0/ata1/host0").as_deref(),
            Some("SATA")
        );
        assert_eq!(
            connection_of("sdb", "/sys/devices/pci0000:00/usb2/2-1").as_deref(),
            Some("USB")
        );
        assert_eq!(connection_of("sdc", "/sys/devices/platform"), None);
    }

    #[test]
    fn reads_a_mac_with_apple_silicon() {
        let profile = serde_json::json!({
            "SPMemoryDataType": [{
                "SPMemoryDataType": "48 GB",
                "dimm_manufacturer": "Micron",
                "dimm_type": "LPDDR5"
            }],
            "SPStorageDataType": [
                {
                    "_name": "Macintosh HD",
                    "bsd_name": "disk3s1s1",
                    "size_in_bytes": 994_662_584_320_u64,
                    "physical_drive": {
                        "device_name": "APPLE SSD AP1024Z",
                        "medium_type": "ssd",
                        "protocol": "Apple Fabric"
                    }
                },
                {
                    "_name": "Data",
                    "bsd_name": "disk3s5",
                    "size_in_bytes": 994_662_584_320_u64,
                    "physical_drive": {
                        "device_name": "APPLE SSD AP1024Z",
                        "medium_type": "ssd",
                        "protocol": "Apple Fabric"
                    }
                }
            ]
        });

        assert_eq!(
            mac_memory_modules(&profile),
            vec![MemoryModule {
                size_bytes: Some(48 * 1024 * 1024 * 1024),
                kind: Some("LPDDR5".to_owned()),
                speed_mts: None,
                manufacturer: Some("Micron".to_owned()),
                slot: None,
            }]
        );
        assert_eq!(
            mac_drives(&profile),
            vec![Drive {
                name: "disk3".to_owned(),
                model: Some("APPLE SSD AP1024Z".to_owned()),
                kind: DriveKind::Ssd,
                connection: Some("Apple Fabric".to_owned()),
                total_bytes: 994_662_584_320,
            }]
        );
    }
}
