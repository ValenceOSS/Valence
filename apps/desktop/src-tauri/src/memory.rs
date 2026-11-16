//! Writing down how much memory the app holds.
//!
//! Every five minutes, from the moment it starts, the app writes one line to `memory.log` in its
//! own folder: the time, then each of its processes by kind and process number with the memory it
//! holds. A report of the app growing can then say which process grew and when, which decides
//! where a leak is looked for. The log starts again once it passes a megabyte, so it never grows
//! without limit itself. The line is the one the Electron app wrote, so logs from either read
//! alike.
//!
//! The processes are the app's own and every process started beneath it, which is the webview's
//! on Windows and Linux. On macOS the system starts the webview's processes itself, beneath none
//! of the app's, so only the app's own is written there.

use std::collections::{HashMap, HashSet};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;
use std::time::{Duration, SystemTime};

use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, System, UpdateKind};

/// How often memory is written down.
const EVERY: Duration = Duration::from_secs(5 * 60);

/// How large the log may grow before it starts again.
const LARGEST_BYTES: u64 = 1024 * 1024;

/// The log's name, in the app's folder.
const MEMORY_LOG: &str = "memory.log";

/// Bytes in a megabyte.
const MB: f64 = 1024.0 * 1024.0;

/// One process as it is read: its number, the number of the process that started it, what it is
/// called and what it was started with, and the bytes it holds.
#[derive(Clone, Debug)]
pub struct Process {
    /// Its process number.
    pub pid: u32,
    /// The process that started it, where there is one.
    pub parent: Option<u32>,
    /// Its name.
    pub name: String,
    /// What it was started with.
    pub command: Vec<String>,
    /// The memory it holds, in bytes.
    pub bytes: u64,
}

/// The kind of process this is, in the names Electron gave its processes: one of the webview's
/// by what it does, and anything else, the app's own process among them, the browser.
#[must_use]
pub fn kind_of(process: &Process) -> &'static str {
    let started_as = process
        .command
        .iter()
        .find_map(|argument| argument.strip_prefix("--type="));

    if let Some(started_as) = started_as {
        return match started_as {
            "renderer" => "Tab",
            "gpu-process" => "GPU",
            "utility" => "Utility",
            _ => "Unknown",
        };
    }

    let name = process.name.as_str();

    if name.contains("WebProcess") || name.contains("WebContent") {
        "Tab"
    } else if name.contains("GPU") {
        "GPU"
    } else if name.contains("NetworkProcess") || name.contains("Networking") {
        "Utility"
    } else {
        "Browser"
    }
}

/// The process numbered `root` and every process started beneath it, at any depth, the root
/// first and the rest in the order of their numbers.
#[must_use]
pub fn the_family(processes: &[Process], root: u32) -> Vec<&Process> {
    let mut children: HashMap<u32, Vec<&Process>> = HashMap::new();

    for process in processes {
        if let Some(parent) = process.parent.filter(|parent| *parent != process.pid) {
            children.entry(parent).or_default().push(process);
        }
    }

    let mut family: Vec<&Process> = processes
        .iter()
        .filter(|one| one.pid == root)
        .take(1)
        .collect();
    let mut seen: HashSet<u32> = family.iter().map(|one| one.pid).collect();
    let mut next = 0;

    while let Some(one) = family.get(next) {
        let mut beneath: Vec<&Process> = children
            .get(&one.pid)
            .into_iter()
            .flatten()
            .copied()
            .filter(|process| seen.insert(process.pid))
            .collect();

        beneath.sort_by_key(|process| process.pid);
        family.extend(beneath);
        next += 1;
    }

    family
}

/// One line of the log: the time, then each process by kind and number with the memory it holds,
/// in whole megabytes.
#[must_use]
pub fn a_reading(at: SystemTime, family: &[&Process]) -> String {
    let processes = family
        .iter()
        .map(|process| {
            #[allow(
                clippy::cast_precision_loss,
                reason = "a process's memory is far below the 2^53 bytes a float holds exactly"
            )]
            let megabytes = (process.bytes as f64 / MB).round();

            format!("{}:{}={megabytes}MB", kind_of(process), process.pid)
        })
        .collect::<Vec<_>>()
        .join(" ");

    format!(
        "{} {processes}\n",
        crate::updates::update_log::iso_timestamp(at)
    )
}

/// Appends `line` to the log at `file`, starting the log again first where it has grown past a
/// megabyte.
///
/// # Errors
///
/// When the log cannot be written.
pub fn write_down(file: &Path, line: &str) -> std::io::Result<()> {
    let is_too_large = std::fs::metadata(file).is_ok_and(|found| found.len() > LARGEST_BYTES);
    let mut log = OpenOptions::new()
        .create(true)
        .append(!is_too_large)
        .write(true)
        .truncate(is_too_large)
        .open(file)?;

    log.write_all(line.as_bytes())
}

/// Reads every process the system has now.
fn every_process(system: &mut System) -> Vec<Process> {
    system.refresh_processes_specifics(
        ProcessesToUpdate::All,
        true,
        ProcessRefreshKind::nothing()
            .with_memory()
            .with_cmd(UpdateKind::OnlyIfNotSet),
    );

    system
        .processes()
        .values()
        .map(|process| Process {
            pid: process.pid().as_u32(),
            parent: process.parent().map(Pid::as_u32),
            name: process.name().to_string_lossy().into_owned(),
            command: process
                .cmd()
                .iter()
                .map(|argument| argument.to_string_lossy().into_owned())
                .collect(),
            bytes: process.memory(),
        })
        .collect()
}

/// Writes down the memory the app holds now.
fn record(system: &mut System, file: &Path) {
    let processes = every_process(system);
    let family = the_family(&processes, std::process::id());
    let written = file
        .parent()
        .map_or(Ok(()), std::fs::create_dir_all)
        .and_then(|()| write_down(file, &a_reading(SystemTime::now(), &family)));

    if let Err(error) = written {
        eprintln!("Valence could not write down its memory: {error}");
    }
}

/// Gets this part of the app ready: writes down the memory the app holds now and every five
/// minutes after, on a thread of its own, for as long as the app runs.
///
/// # Errors
///
/// When the thread cannot be started.
pub fn setup() -> Result<(), Box<dyn std::error::Error>> {
    let file = crate::paths::user_data().join(MEMORY_LOG);

    std::thread::Builder::new()
        .name(String::from("valence-memory"))
        .spawn(move || {
            let mut system = System::new();

            loop {
                record(&mut system, &file);
                std::thread::sleep(EVERY);
            }
        })?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{a_reading, kind_of, the_family, write_down, Process};
    use std::time::{Duration, SystemTime};

    fn a_process(pid: u32, parent: Option<u32>, name: &str, command: &[&str]) -> Process {
        Process {
            pid,
            parent,
            name: name.to_owned(),
            command: command
                .iter()
                .map(|argument| (*argument).to_owned())
                .collect(),
            bytes: 0,
        }
    }

    #[test]
    fn names_a_chromiums_processes_by_what_they_do() {
        let started_as = |kind: &str| {
            kind_of(&a_process(
                2,
                Some(1),
                "msedgewebview2.exe",
                &["msedgewebview2.exe", kind],
            ))
        };

        assert_eq!(started_as("--type=renderer"), "Tab");
        assert_eq!(started_as("--type=gpu-process"), "GPU");
        assert_eq!(started_as("--type=utility"), "Utility");
        assert_eq!(started_as("--type=crashpad-handler"), "Unknown");
        assert_eq!(started_as("--embedded-browser-webview=1"), "Browser");
    }

    #[test]
    fn names_a_webkits_processes_by_what_they_do() {
        let named = |name: &str| kind_of(&a_process(2, Some(1), name, &[]));

        assert_eq!(named("WebKitWebProcess"), "Tab");
        assert_eq!(named("WebKitNetworkProcess"), "Utility");
        assert_eq!(named("WebKitGPUProcess"), "GPU");
        assert_eq!(named("valence-desktop"), "Browser");
    }

    #[test]
    fn finds_the_app_and_everything_beneath_it() {
        let processes = [
            a_process(1, None, "init", &[]),
            a_process(40, Some(1), "valence-desktop", &[]),
            a_process(52, Some(40), "WebKitNetworkProcess", &[]),
            a_process(41, Some(40), "WebKitWebProcess", &[]),
            a_process(60, Some(41), "helper", &[]),
            a_process(70, Some(1), "elsewhere", &[]),
        ];
        let family: Vec<u32> = the_family(&processes, 40)
            .iter()
            .map(|process| process.pid)
            .collect();

        assert_eq!(family, vec![40, 41, 52, 60]);
        assert!(the_family(&processes, 99).is_empty());
    }

    #[test]
    fn is_not_led_round_by_processes_that_name_each_other_their_parents() {
        let alone = [a_process(40, Some(40), "valence-desktop", &[])];
        let round = [
            a_process(40, Some(41), "valence-desktop", &[]),
            a_process(41, Some(40), "WebKitWebProcess", &[]),
        ];

        assert_eq!(the_family(&alone, 40).len(), 1);
        assert_eq!(the_family(&round, 40).len(), 2);
    }

    #[test]
    fn writes_each_process_in_whole_megabytes_after_the_time() {
        let mut app = a_process(40, None, "valence-desktop", &[]);
        let mut page = a_process(41, Some(40), "WebKitWebProcess", &[]);

        app.bytes = 150 * 1024 * 1024 + 600 * 1024;
        page.bytes = 300 * 1024 * 1024;

        let at = SystemTime::UNIX_EPOCH + Duration::from_millis(1_763_300_000_123);

        assert_eq!(
            a_reading(at, &[&app, &page]),
            "2025-11-16T13:33:20.123Z Browser:40=151MB Tab:41=300MB\n"
        );
    }

    #[test]
    fn starts_the_log_again_once_it_passes_a_megabyte() {
        let folder = tempfile::tempdir().unwrap();
        let file = folder.path().join("memory.log");

        write_down(&file, "first\n").unwrap();
        write_down(&file, "second\n").unwrap();
        assert_eq!(std::fs::read_to_string(&file).unwrap(), "first\nsecond\n");

        std::fs::write(&file, "x".repeat(1024 * 1024 + 1)).unwrap();
        write_down(&file, "third\n").unwrap();
        assert_eq!(std::fs::read_to_string(&file).unwrap(), "third\n");
    }
}
