//! Where the window may go.
//!
//! The window holds the application and nothing else, since everything the app hands a page is
//! handed to whatever page the window holds. A web page or calendar subscription it is sent to
//! opens in the system's own app instead. A page of the server's own, such as where a plugin
//! connects somebody's account elsewhere, opens in their browser too, since it may go on to a site
//! this window cannot follow. The one thing a page may hold in a frame is the video host's player.

use reqwest::Url;

use crate::serve::renderer::VIDEO_HOSTS;
use crate::upstream::on_the_server;

/// Where the window goes when it is sent to an address.
#[derive(Debug, PartialEq, Eq)]
pub enum Going {
    /// It goes there: the address is the application's own.
    Stays,
    /// It stays where it is, and the address opens in the system's own app.
    Outside(String),
    /// It stays where it is, and the address opens nowhere.
    Nowhere,
}

/// Whether an address is handed to the system: a web page, which opens in the default browser, or
/// a calendar subscription, which opens in the calendar app.
#[must_use]
pub fn opens_outside(url: &str) -> bool {
    ["http://", "https://", "webcal://"]
        .iter()
        .any(|scheme| url.starts_with(scheme))
}

/// Whether `url` is one of the application's own pages, served from `origin`.
#[must_use]
pub fn stays_in_the_application(url: &Url, origin: &str) -> bool {
    Url::parse(origin).is_ok_and(|own| own.origin() == url.origin())
}

/// Where on the server a page the window was sent to really is, when it is one of the server's own
/// pages rather than the application, or nothing where it is not or no server has been chosen.
#[must_use]
pub fn a_server_page_for(url: &Url, origin: &str, server: Option<&str>) -> Option<String> {
    let server = server?;

    if !stays_in_the_application(url, origin) || !url.path().starts_with("/api/") {
        return None;
    }

    let mut path = url.path().to_owned();

    if let Some(query) = url.query() {
        path.push('?');
        path.push_str(query);
    }

    on_the_server(server, &path).map(String::from)
}

/// Whether `url` is something a page may hold in a frame: the video host's player, or a blank
/// frame.
#[must_use]
pub fn may_be_framed(url: &Url) -> bool {
    match url.scheme() {
        "about" => matches!(url.path(), "blank" | "srcdoc"),
        "https" => {
            url.host_str()
                .is_some_and(|host| VIDEO_HOSTS.contains(&host))
                && url.path().starts_with("/embed/")
        }
        _ => false,
    }
}

/// Where the window goes when it is sent to `url`, while the application is served from `origin`
/// and `server` is the chosen server.
#[must_use]
pub fn going(url: &Url, origin: &str, server: Option<&str>) -> Going {
    if let Some(page) = a_server_page_for(url, origin, server) {
        return Going::Outside(page);
    }

    if stays_in_the_application(url, origin) || may_be_framed(url) {
        return Going::Stays;
    }

    if opens_outside(url.as_str()) {
        Going::Outside(url.to_string())
    } else {
        Going::Nowhere
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const ORIGIN: &str = "http://127.0.0.1:41847";

    fn url(text: &str) -> Url {
        Url::parse(text).expect("an address")
    }

    #[test]
    fn hands_web_pages_and_calendars_to_the_system() {
        assert!(opens_outside("https://docs.example/"));
        assert!(opens_outside("http://docs.example/"));
        assert!(opens_outside("webcal://nas/calendar.ics"));
        assert!(!opens_outside("file:///etc/passwd"));
        assert!(!opens_outside("javascript:alert(1)"));
        assert!(!opens_outside("mailto:a@b.c"));
    }

    #[test]
    fn stays_on_its_own_pages() {
        assert_eq!(
            going(&url("http://127.0.0.1:41847/library"), ORIGIN, None),
            Going::Stays
        );
        assert_eq!(
            going(
                &url("http://127.0.0.1:41847/enter?key=k&to=%2F"),
                ORIGIN,
                None
            ),
            Going::Stays
        );
    }

    #[test]
    fn sends_another_port_or_host_outside() {
        assert_eq!(
            going(&url("http://127.0.0.1:9999/"), ORIGIN, None),
            Going::Outside("http://127.0.0.1:9999/".to_owned())
        );
        assert_eq!(
            going(&url("https://evil.example/"), ORIGIN, None),
            Going::Outside("https://evil.example/".to_owned())
        );
        assert_eq!(
            going(&url("file:///etc/passwd"), ORIGIN, None),
            Going::Nowhere
        );
    }

    #[test]
    fn opens_the_servers_own_pages_in_the_browser() {
        assert_eq!(
            going(
                &url("http://127.0.0.1:41847/api/plugins/x/connect?state=1"),
                ORIGIN,
                Some("https://nas.example:8443")
            ),
            Going::Outside("https://nas.example:8443/api/plugins/x/connect?state=1".to_owned())
        );
        assert_eq!(
            going(
                &url("http://127.0.0.1:41847/api/plugins/x/connect"),
                ORIGIN,
                None
            ),
            Going::Stays
        );
    }

    #[test]
    fn lets_a_trailer_be_framed_and_nothing_else_from_its_host() {
        assert_eq!(
            going(
                &url("https://www.youtube-nocookie.com/embed/abc"),
                ORIGIN,
                None
            ),
            Going::Stays
        );
        assert_eq!(going(&url("about:blank"), ORIGIN, None), Going::Stays);
        assert_eq!(
            going(&url("https://www.youtube.com/watch?v=abc"), ORIGIN, None),
            Going::Outside("https://www.youtube.com/watch?v=abc".to_owned())
        );
    }
}
