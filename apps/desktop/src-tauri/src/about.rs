//! What this build is and what it runs on.

use serde::Serialize;
use tauri::{AppHandle, Manager};

const DEV_VERSION: &str = "-dev";

/// What this build is and what it runs on, as the page's About section says it.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct About {
    /// The version this app was built as.
    pub version: String,
    /// Whether this is a build still being worked on rather than a release.
    pub is_a_dev_build: bool,
    /// What this computer is called, the way its owner named it.
    pub computer_name: Option<String>,
    /// The code revision this app was built from, or nothing where the build did not say.
    pub commit: String,
    /// The processor this app runs on, as Node names it.
    pub arch: String,
    /// The system this app runs on, as Node names it.
    pub platform: String,
    /// The webview the page is drawn by, and its version.
    pub webview: String,
    /// The version of Tauri this app is built with.
    pub tauri: String,
}

/// Whether a build is still being worked on rather than a release: run from source, a test build
/// of a branch (`0.0.0-dev`), or the dev channel built from every merge (`1.4.0-dev.12`).
#[must_use]
pub fn is_a_dev_build(is_packaged: bool, version: &str) -> bool {
    !is_packaged || version.contains(DEV_VERSION)
}

/// The system's name as Node's `process.platform` says it, which is what the page expects.
#[must_use]
pub fn platform_named(os: &str) -> String {
    match os {
        "macos" => "darwin",
        "windows" => "win32",
        other => other,
    }
    .to_owned()
}

/// The processor's name as Node's `process.arch` says it.
#[must_use]
pub fn arch_named(arch: &str) -> String {
    match arch {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        "x86" => "ia32",
        other => other,
    }
    .to_owned()
}

/// The webview this system draws pages with, named with its version.
#[must_use]
pub fn webview_named(os: &str, version: Option<&str>) -> String {
    let engine = match os {
        "windows" => "WebView2",
        "macos" => "WKWebView",
        _ => "WebKitGTK",
    };

    match version {
        Some(version) if !version.is_empty() => format!("{engine} {version}"),
        _ => engine.to_owned(),
    }
}

/// A computer's name with the `.local` its network adds taken off, or nothing where it is empty.
#[must_use]
pub fn named_by_its_owner(host: &str) -> Option<String> {
    let host = host.trim();
    let host = host.strip_suffix(".local").unwrap_or(host).trim();

    if host.is_empty() {
        None
    } else {
        Some(host.to_owned())
    }
}

/// Asks a Mac for the name in its sharing settings, giving it two seconds to say.
#[cfg(target_os = "macos")]
fn asked_of_the_mac() -> Option<String> {
    let (said, heard) = std::sync::mpsc::channel();

    std::thread::spawn(move || {
        let answer = std::process::Command::new("scutil")
            .args(["--get", "ComputerName"])
            .output()
            .ok()
            .filter(|output| output.status.success())
            .map(|output| String::from_utf8_lossy(&output.stdout).trim().to_owned());
        let _ = said.send(answer);
    });

    heard
        .recv_timeout(std::time::Duration::from_secs(2))
        .ok()
        .flatten()
        .filter(|name| !name.is_empty())
}

/// What this computer is called: on a Mac the name in its sharing settings, and elsewhere the name
/// the system gives it on the network.
#[must_use]
pub fn computer_name() -> Option<String> {
    #[cfg(target_os = "macos")]
    if let Some(named) = asked_of_the_mac() {
        return Some(named);
    }

    hostname::get()
        .ok()
        .and_then(|host| named_by_its_owner(&host.to_string_lossy()))
}

/// What this build is and what it runs on.
#[must_use]
pub fn about(app: &AppHandle) -> About {
    if let Some(known) = app.try_state::<About>() {
        return known.inner().clone();
    }

    let version = app.package_info().version.to_string();

    About {
        is_a_dev_build: is_a_dev_build(!cfg!(debug_assertions), &version),
        version,
        computer_name: computer_name(),
        commit: option_env!("VALENCE_COMMIT").unwrap_or_default().to_owned(),
        arch: arch_named(std::env::consts::ARCH),
        platform: platform_named(std::env::consts::OS),
        webview: webview_named(
            std::env::consts::OS,
            tauri::webview_version().ok().as_deref(),
        ),
        tauri: tauri::VERSION.to_owned(),
    }
}

/// Works out what this build is once, at the start, as Electron did.
pub fn setup(app: &tauri::App) {
    let known = about(app.handle());

    app.manage(known);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_dev_build_is_one_run_from_source_or_versioned_as_dev() {
        assert!(is_a_dev_build(false, "1.4.0"));
        assert!(is_a_dev_build(true, "1.4.0-dev.12"));
        assert!(is_a_dev_build(true, "0.0.0-dev"));
        assert!(!is_a_dev_build(true, "1.4.0"));
    }

    #[test]
    fn names_the_system_as_node_does() {
        assert_eq!(platform_named("macos"), "darwin");
        assert_eq!(platform_named("windows"), "win32");
        assert_eq!(platform_named("linux"), "linux");
        assert_eq!(arch_named("x86_64"), "x64");
        assert_eq!(arch_named("aarch64"), "arm64");
        assert_eq!(arch_named("x86"), "ia32");
        assert_eq!(arch_named("riscv64"), "riscv64");
    }

    #[test]
    fn names_the_webview_with_its_version() {
        assert_eq!(webview_named("linux", Some("2.48.1")), "WebKitGTK 2.48.1");
        assert_eq!(webview_named("windows", Some("131.0")), "WebView2 131.0");
        assert_eq!(webview_named("macos", None), "WKWebView");
        assert_eq!(webview_named("macos", Some("")), "WKWebView");
    }

    #[test]
    fn takes_the_network_suffix_off_a_computers_name() {
        assert_eq!(
            named_by_its_owner("studio.local").as_deref(),
            Some("studio")
        );
        assert_eq!(named_by_its_owner(" den \n").as_deref(), Some("den"));
        assert_eq!(named_by_its_owner(".local"), None);
        assert_eq!(named_by_its_owner(""), None);
    }

    #[test]
    fn says_its_fields_as_the_page_reads_them() {
        let said = serde_json::to_value(About {
            version: "1.0.0".to_owned(),
            is_a_dev_build: false,
            computer_name: None,
            commit: String::new(),
            arch: "x64".to_owned(),
            platform: "linux".to_owned(),
            webview: "WebKitGTK".to_owned(),
            tauri: "2".to_owned(),
        })
        .expect("JSON");

        assert_eq!(said["isADevBuild"], false);
        assert_eq!(said["computerName"], serde_json::Value::Null);
        assert!(said.get("tauri").is_some());
    }
}
