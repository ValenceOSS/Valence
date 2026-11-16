//! Keeps the loopback server to this app's own window.
//!
//! Any website open in the person's browser can send requests to a port on their computer, and a
//! site that renames itself to `127.0.0.1` can read the answers. So everything but the renderer's
//! own files needs a key the window was handed when it opened, in a cookie no other site can send,
//! and every request has to be addressed to this server by its own name.

use std::fmt::Write;

use axum::extract::{Query, Request, State};
use axum::http::header::{CACHE_CONTROL, COOKIE, HOST, LOCATION, SET_COOKIE};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use reqwest::Url;
use serde::Deserialize;

use super::Served;

/// The cookie the key is carried in.
pub const KEY_COOKIE: &str = "valence-key";

/// A new key: 32 random bytes, written as hex.
#[must_use]
pub fn a_key() -> String {
    rand::random::<[u8; 32]>()
        .iter()
        .fold(String::with_capacity(64), |mut key, byte| {
            let _ = write!(key, "{byte:02x}");
            key
        })
}

/// Whether `given` is `key`, taking as long to say no whichever byte differs.
#[must_use]
pub fn is_the_key(given: &str, key: &str) -> bool {
    given.len() == key.len()
        && given
            .bytes()
            .zip(key.bytes())
            .fold(0_u8, |differs, (a, b)| differs | (a ^ b))
            == 0
}

/// Whether the cookies in `headers` carry `key`.
#[must_use]
pub fn carries_the_key(headers: &HeaderMap, key: &str) -> bool {
    headers
        .get_all(COOKIE)
        .iter()
        .filter_map(|value| value.to_str().ok())
        .flat_map(|cookies| cookies.split(';'))
        .filter_map(|cookie| cookie.trim().split_once('='))
        .any(|(name, value)| name == KEY_COOKIE && is_the_key(value, key))
}

/// Whether `headers` address the request to `host`, which is this server's own name.
#[must_use]
pub fn is_addressed_to(headers: &HeaderMap, host: &str) -> bool {
    headers
        .get(HOST)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|asked| asked.eq_ignore_ascii_case(host))
}

/// Where `/enter` may send the window on to: a path on this server, and nowhere else.
#[must_use]
pub fn a_way_in(origin: &str, to: Option<&str>) -> Option<String> {
    let to = to.unwrap_or("/");

    if !to.starts_with('/') || to.starts_with("//") || to.contains('\\') {
        return None;
    }

    let own = Url::parse(origin).ok()?;
    let there = own.join(to).ok()?;

    if there.origin() != own.origin() {
        return None;
    }

    let mut path = there.path().to_owned();

    if let Some(query) = there.query() {
        path.push('?');
        path.push_str(query);
    }

    Some(path)
}

/// What `/enter` is asked with.
#[derive(Deserialize)]
pub struct Entering {
    key: Option<String>,
    to: Option<String>,
}

/// Turns away a request not addressed to this server by its own name.
pub async fn on_this_host(State(served): State<Served>, request: Request, next: Next) -> Response {
    if is_addressed_to(request.headers(), &served.host) {
        next.run(request).await
    } else {
        StatusCode::FORBIDDEN.into_response()
    }
}

/// Turns away a request that does not carry the key.
pub async fn with_the_key(State(served): State<Served>, request: Request, next: Next) -> Response {
    if carries_the_key(request.headers(), &served.key) {
        next.run(request).await
    } else {
        StatusCode::FORBIDDEN.into_response()
    }
}

/// Hands the window the key, in a cookie only this server's own pages send, and sends it on.
pub async fn enter(State(served): State<Served>, Query(entering): Query<Entering>) -> Response {
    let is_known = entering
        .key
        .as_deref()
        .is_some_and(|given| is_the_key(given, &served.key));
    let way_in = a_way_in(&format!("http://{}", served.host), entering.to.as_deref());

    let (true, Some(way_in)) = (is_known, way_in) else {
        return StatusCode::FORBIDDEN.into_response();
    };
    let cookie = format!(
        "{KEY_COOKIE}={}; HttpOnly; SameSite=Strict; Path=/",
        served.key
    );

    match (
        HeaderValue::from_str(&cookie),
        HeaderValue::from_str(&way_in),
    ) {
        (Ok(cookie), Ok(way_in)) => (
            StatusCode::SEE_OTHER,
            [
                (SET_COOKIE, cookie),
                (LOCATION, way_in),
                (CACHE_CONTROL, HeaderValue::from_static("no-store")),
            ],
        )
            .into_response(),
        _ => StatusCode::FORBIDDEN.into_response(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn with(name: &'static str, value: &'static str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.append(name, HeaderValue::from_static(value));
        headers
    }

    #[test]
    fn a_key_is_64_hex_digits_and_new_each_time() {
        let key = a_key();

        assert_eq!(key.len(), 64);
        assert!(key.chars().all(|c| c.is_ascii_hexdigit()));
        assert_ne!(key, a_key());
    }

    #[test]
    fn knows_the_key_and_nothing_like_it() {
        assert!(is_the_key("abcd", "abcd"));
        assert!(!is_the_key("abce", "abcd"));
        assert!(!is_the_key("abc", "abcd"));
        assert!(!is_the_key("", "abcd"));
    }

    #[test]
    fn finds_the_key_among_other_cookies() {
        assert!(carries_the_key(
            &with("cookie", "a=1; valence-key=k; b=2"),
            "k"
        ));
        assert!(!carries_the_key(&with("cookie", "a=1; valence-key=x"), "k"));
        assert!(!carries_the_key(
            &with("cookie", "other-valence-key=k"),
            "k"
        ));
        assert!(!carries_the_key(&HeaderMap::new(), "k"));
    }

    #[test]
    fn insists_on_this_servers_own_name() {
        assert!(is_addressed_to(
            &with("host", "127.0.0.1:41847"),
            "127.0.0.1:41847"
        ));
        assert!(!is_addressed_to(
            &with("host", "evil.example:41847"),
            "127.0.0.1:41847"
        ));
        assert!(!is_addressed_to(
            &with("host", "localhost:41847"),
            "127.0.0.1:41847"
        ));
        assert!(!is_addressed_to(&HeaderMap::new(), "127.0.0.1:41847"));
    }

    #[test]
    fn sends_the_window_on_only_within_this_server() {
        let origin = "http://127.0.0.1:41847";

        assert_eq!(a_way_in(origin, None).as_deref(), Some("/"));
        assert_eq!(
            a_way_in(origin, Some("/update.html?step=installing&version=1.2.0")).as_deref(),
            Some("/update.html?step=installing&version=1.2.0")
        );
        assert_eq!(a_way_in(origin, Some("//evil.example/")), None);
        assert_eq!(a_way_in(origin, Some("/\\evil.example")), None);
        assert_eq!(a_way_in(origin, Some("https://evil.example/")), None);
        assert_eq!(a_way_in(origin, Some("javascript:alert(1)")), None);
    }
}
