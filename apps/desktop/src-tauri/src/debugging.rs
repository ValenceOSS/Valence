//! Opening the app to a debugger, installed or not, for working on it.
//!
//! A development build always has the web inspector. Any other build has it only when it was
//! started asking for it, never by default: with `VALENCE_DEBUG_PORT` naming a port, as it did for
//! the Electron app, or with `VALENCE_DEVTOOLS=1` for the inspector alone. The inspector then opens
//! from the View menu's developer tools or their shortcut, and on macOS the webview may also be
//! inspected from Safari's Develop menu.
//!
//! The port opens the webview to a debugger elsewhere. On Windows the webview is Edge's, a
//! Chromium, and opens Chrome's remote debugging there, which is what the leak sweep drives. On
//! Linux `WebKitGTK` opens its own remote inspector: served over http on the port, for a browser to
//! open, and on the port after it for another `WebKit` inspector to connect to. macOS has no
//! remote inspector but Safari's. A port that is not one opens nothing.

/// The variable that names the port.
const DEBUG_PORT: &str = "VALENCE_DEBUG_PORT";

/// The variable that asks for the inspector without a port.
const DEVTOOLS: &str = "VALENCE_DEVTOOLS";

/// The variables `WebKitGTK` reads its remote inspector's addresses from: the one served over http,
/// and the one another `WebKit` inspector connects to.
#[cfg_attr(
    not(target_os = "linux"),
    allow(
        dead_code,
        reason = "only Linux's webview reads its inspector's address this way"
    )
)]
const INSPECTOR_VARIABLES: [&str; 2] = ["WEBKIT_INSPECTOR_HTTP_SERVER", "WEBKIT_INSPECTOR_SERVER"];

/// The lowest port that may be asked for, the first an ordinary user may open.
const LOWEST_PORT: u16 = 1024;

/// What Edge's webview is started with when nothing else is asked for, which Tauri would have
/// given it: no mini menu over selected words, and no Smart Screen checks on the app's own pages.
#[cfg_attr(
    not(windows),
    allow(dead_code, reason = "only Windows's webview takes arguments this way")
)]
const WEBVIEW_ARGUMENTS: &str = "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection";

/// The variable Edge's webview reads more arguments from when it starts.
#[cfg_attr(
    not(windows),
    allow(dead_code, reason = "only Windows's webview takes arguments this way")
)]
const WEBVIEW_ARGUMENTS_VARIABLE: &str = "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS";

/// The port `asked` names: a whole number from 1024 to 65535, or none.
#[must_use]
pub fn the_port(asked: Option<&str>) -> Option<u16> {
    asked?
        .trim()
        .parse::<u16>()
        .ok()
        .filter(|port| *port >= LOWEST_PORT)
}

/// The port asked for when the app was started, or none.
#[must_use]
pub fn the_asked_port() -> Option<u16> {
    the_port(std::env::var(DEBUG_PORT).ok().as_deref())
}

/// Whether `asked` turns the inspector on: `1` or `true`, in any case.
#[must_use]
pub fn is_on(asked: Option<&str>) -> bool {
    asked.is_some_and(|asked| matches!(asked.trim().to_ascii_lowercase().as_str(), "1" | "true"))
}

/// Whether the app may be inspected: always in a development build, and in any other only when it
/// was started with a debugging port or with the inspector asked for.
#[must_use]
pub fn may_be_inspected() -> bool {
    cfg!(debug_assertions)
        || the_asked_port().is_some()
        || is_on(std::env::var(DEVTOOLS).ok().as_deref())
}

/// The addresses `WebKitGTK`'s remote inspector listens on for `port`: over http on the port itself,
/// and for another `WebKit` inspector on the port after it, where there is one.
#[cfg_attr(
    not(target_os = "linux"),
    allow(
        dead_code,
        reason = "only Linux's webview reads its inspector's address this way"
    )
)]
#[must_use]
pub fn inspector_addresses(port: u16) -> Vec<String> {
    [Some(port), port.checked_add(1)]
        .into_iter()
        .flatten()
        .map(|port| format!("127.0.0.1:{port}"))
        .collect()
}

/// The arguments Edge's webview starts with to open remote debugging on `port`: those already
/// asked for, or else the ones Tauri would have given it, then the port.
#[cfg_attr(
    not(windows),
    allow(dead_code, reason = "only Windows's webview takes arguments this way")
)]
#[must_use]
pub fn webview_arguments(already: Option<&str>, port: u16) -> String {
    let already = already
        .map(str::trim)
        .filter(|already| !already.is_empty())
        .unwrap_or(WEBVIEW_ARGUMENTS);

    format!("{already} --remote-debugging-port={port}")
}

/// Opens remote debugging on the asked port: Chrome's on Windows, and `WebKitGTK`'s remote inspector
/// on Linux. It has to be called before any webview starts, since the webview reads its arguments
/// then.
pub fn open_the_debugging_port() {
    #[cfg(target_os = "linux")]
    if let Some(port) = the_asked_port() {
        for (variable, address) in INSPECTOR_VARIABLES.iter().zip(inspector_addresses(port)) {
            std::env::set_var(variable, address);
        }
    }

    #[cfg(windows)]
    if let Some(port) = the_asked_port() {
        let already = std::env::var(WEBVIEW_ARGUMENTS_VARIABLE).ok();

        std::env::set_var(
            WEBVIEW_ARGUMENTS_VARIABLE,
            webview_arguments(already.as_deref(), port),
        );
    }
}

#[cfg(test)]
mod tests {
    use super::{inspector_addresses, is_on, the_port, webview_arguments};

    #[test]
    fn turns_the_inspector_on_only_when_asked_plainly() {
        assert!(is_on(Some("1")));
        assert!(is_on(Some(" TRUE ")));
        assert!(!is_on(Some("0")));
        assert!(!is_on(Some("")));
        assert!(!is_on(Some("yes please")));
        assert!(!is_on(None));
    }

    #[test]
    fn serves_webkits_inspector_on_the_port_and_the_one_after() {
        assert_eq!(
            inspector_addresses(9222),
            vec!["127.0.0.1:9222".to_owned(), "127.0.0.1:9223".to_owned()]
        );
        assert_eq!(
            inspector_addresses(65535),
            vec!["127.0.0.1:65535".to_owned()]
        );
    }

    #[test]
    fn takes_a_port_an_ordinary_user_may_open() {
        assert_eq!(the_port(Some("9222")), Some(9222));
        assert_eq!(the_port(Some(" 9222 ")), Some(9222));
        assert_eq!(the_port(Some("1024")), Some(1024));
        assert_eq!(the_port(Some("65535")), Some(65535));
    }

    #[test]
    fn opens_nothing_for_what_is_not_a_port() {
        assert_eq!(the_port(None), None);
        assert_eq!(the_port(Some("")), None);
        assert_eq!(the_port(Some("80")), None);
        assert_eq!(the_port(Some("65536")), None);
        assert_eq!(the_port(Some("-1")), None);
        assert_eq!(the_port(Some("9222.5")), None);
        assert_eq!(the_port(Some("ninety")), None);
    }

    #[test]
    fn keeps_the_webviews_own_arguments_beside_the_port() {
        assert_eq!(
            webview_arguments(None, 9222),
            "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --remote-debugging-port=9222"
        );
        assert_eq!(
            webview_arguments(Some("  "), 9222),
            "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --remote-debugging-port=9222"
        );
        assert_eq!(
            webview_arguments(Some("--lang=fr"), 9333),
            "--lang=fr --remote-debugging-port=9333"
        );
    }
}
