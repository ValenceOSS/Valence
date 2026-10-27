//! A film played straight from a remote file service, read as though it were a local one.
//!
//! The server names a remote input by a key and tells this service where the
//! file is now: a link a plugin handed it, which may expire and be replaced at
//! any moment by a fresh one. Everything here that names an input names a path,
//! so each remote input is given one: a small file in this service's cache,
//! which caches and indexes are filed under. ffmpeg and ffprobe are handed, in
//! its place, an address on a relay this service runs on the loopback interface.
//!
//! The relay is what ffmpeg and ffprobe actually reach. It answers each request,
//! ranges and all, by fetching the same stretch from wherever the file is now —
//! so a fresh link takes effect on the next read without the run reading it
//! noticing — and it holds every fetch to the rules a plugin's own requests are
//! held to in the server: HTTPS on the standard port, only to the hosts the
//! plugin listed, every address the name resolves to on the public internet,
//! and every redirect checked the same way. ffmpeg is never handed the remote
//! address itself, since it would follow whatever redirect it was given.
//!
//! A dropped connection is picked up again from where it stopped, so a
//! long film survives a service that closes connections after a while.

use std::collections::HashMap;
use std::fmt::Write as _;
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Duration;

use axum::body::{Body, Bytes};
use axum::extract::{Path as RoutePath, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use sha2::{Digest, Sha256};

/// The folder, under the transcode cache, that remote inputs' lists are written into.
pub const FOLDER_NAME: &str = "remote";

/// The extension every remote input's list ends in.
pub const EXTENSION: &str = "ffconcat";

/// What ffmpeg and ffprobe are told before the relay's address: that they may open it, and that
/// a connection to it that drops is to be opened again.
pub const RELAY_INPUT: [&str; 8] = [
    "-protocol_whitelist",
    "http,tcp",
    "-reconnect",
    "1",
    "-reconnect_on_network_error",
    "1",
    "-reconnect_delay_max",
    "5",
];

/// The variable that points a public name at a local stand-in, on a developer's machine.
pub const DEV_HOSTS_VARIABLE: &str = "VALENCE_DEV_HOSTS";

const MOST_REDIRECTS: usize = 3;

const MOST_RESUMES: usize = 5;

/// Where a remote input is now, and what may be fetched for it.
#[derive(Debug, Clone, PartialEq, Eq, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Remote {
    /// Where the file is now.
    pub url: String,
    /// The hosts its links may come from, `*.` patterns among them.
    pub hosts: Vec<String>,
    /// How large the file is.
    pub size_bytes: u64,
}

/// What a remote input is registered as.
#[derive(Debug, Clone)]
struct Entry {
    token: String,
    remote: Remote,
    expired: bool,
}

/// Everything the relay and the lists need, set up once at startup.
struct Installed {
    folder: PathBuf,
    relay: SocketAddr,
    client: reqwest::Client,
    dev_hosts: HashMap<String, SocketAddr>,
    entries: Mutex<HashMap<String, Entry>>,
}

static INSTALLED: OnceLock<Arc<Installed>> = OnceLock::new();

/// Whether an address is somewhere on the public internet, rather than this
/// machine, its network, a cloud's metadata service or a range kept for
/// documentation — the only kind of address a remote file may be fetched from,
/// whatever name led to it.
#[must_use]
pub fn is_public(address: IpAddr) -> bool {
    match address {
        IpAddr::V4(v4) => is_public_v4(v4),
        IpAddr::V6(v6) => v6
            .to_ipv4_mapped()
            .map_or_else(|| is_public_v6(v6), is_public_v4),
    }
}

fn is_public_v4(address: Ipv4Addr) -> bool {
    let [first, second, third, _] = address.octets();

    !(first == 0
        || first == 10
        || first == 127
        || (first == 100 && (64..=127).contains(&second))
        || (first == 169 && second == 254)
        || (first == 172 && (16..=31).contains(&second))
        || (first == 192 && second == 0 && third == 0)
        || (first == 192 && second == 0 && third == 2)
        || (first == 192 && second == 88 && third == 99)
        || (first == 192 && second == 168)
        || (first == 198 && (18..=19).contains(&second))
        || (first == 198 && second == 51 && third == 100)
        || (first == 203 && second == 0 && third == 113)
        || first >= 224)
}

fn is_public_v6(address: Ipv6Addr) -> bool {
    let segments = address.segments();
    let first = segments[0];

    !(address.is_unspecified()
        || address.is_loopback()
        || (segments[0] == 0x64 && segments[1] == 0xff9b && segments[2..6] == [0; 4])
        || (segments[0] == 0x100 && segments[1..4] == [0; 3])
        || (first == 0x2001 && segments[1] == 0x0db8)
        || (first & 0xfe00) == 0xfc00
        || (first & 0xffc0) == 0xfe80
        || (first & 0xff00) == 0xff00)
}

/// Whether a host is one of those listed, where `*.` stands for every host under a name but not
/// the name itself.
#[must_use]
pub fn is_host_allowed(host: &str, listed: &[String]) -> bool {
    let host = host.trim_end_matches('.').to_ascii_lowercase();

    listed.iter().any(|entry| {
        let entry = entry.to_ascii_lowercase();

        entry.strip_prefix('*').map_or(host == entry, |suffix| {
            suffix.starts_with('.') && host.ends_with(suffix)
        })
    })
}

/// Reads `VALENCE_DEV_HOSTS`, which points a public name at a local stand-in reached over plain
/// HTTP: `files.example.test=127.0.0.1:8443`, separated by commas.
///
/// # Errors
///
/// Where it is set in production, or an entry is not `host=address:port`.
pub fn read_dev_hosts(
    value: &str,
    environment: Option<&str>,
) -> Result<HashMap<String, SocketAddr>, String> {
    let entries: Vec<&str> = value
        .split(',')
        .map(str::trim)
        .filter(|entry| !entry.is_empty())
        .collect();

    if entries.is_empty() {
        return Ok(HashMap::new());
    }

    if environment == Some("production") {
        return Err(format!(
            "{DEV_HOSTS_VARIABLE} is for development and is refused in production"
        ));
    }

    entries
        .into_iter()
        .map(|entry| {
            let (host, address) = entry.split_once('=').ok_or_else(|| {
                format!("{DEV_HOSTS_VARIABLE} has {entry}, which is not host=address:port")
            })?;
            let address: SocketAddr = address.parse().map_err(|_| {
                format!("{DEV_HOSTS_VARIABLE} has {entry}, which is not host=address:port")
            })?;

            Ok((host.to_ascii_lowercase(), address))
        })
        .collect()
}

/// Resolves a name only to public addresses, refusing a name that resolves anywhere else at all.
struct PublicOnly;

impl reqwest::dns::Resolve for PublicOnly {
    fn resolve(&self, name: reqwest::dns::Name) -> reqwest::dns::Resolving {
        let host = name.as_str().to_owned();

        Box::pin(async move {
            let found: Vec<SocketAddr> =
                tokio::net::lookup_host((host.as_str(), 0)).await?.collect();

            if found.is_empty() || !found.iter().all(|address| is_public(address.ip())) {
                return Err(format!(
                    "{host} resolves somewhere a remote file may not be fetched from"
                )
                .into());
            }

            let addresses: reqwest::dns::Addrs = Box::new(found.into_iter());

            Ok(addresses)
        })
    }
}

/// Starts the relay on the loopback interface and remembers where lists are written.
///
/// Called once, at startup, before anything is listening.
///
/// # Errors
///
/// Where the relay cannot bind or its client cannot be built.
pub async fn install<Hashing: std::hash::BuildHasher>(
    folder: PathBuf,
    dev_hosts: HashMap<String, SocketAddr, Hashing>,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .dns_resolver(Arc::new(PublicOnly))
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(15))
        .read_timeout(Duration::from_secs(60))
        .user_agent("Valence-Transcoder")
        .build()
        .map_err(|failure| failure.to_string())?;
    let listener = tokio::net::TcpListener::bind((Ipv4Addr::LOCALHOST, 0))
        .await
        .map_err(|failure| failure.to_string())?;
    let relay = listener
        .local_addr()
        .map_err(|failure| failure.to_string())?;
    let installed = Arc::new(Installed {
        folder,
        relay,
        client,
        dev_hosts: dev_hosts.into_iter().collect(),
        entries: Mutex::new(HashMap::new()),
    });

    if INSTALLED.set(installed.clone()).is_err() {
        return Ok(());
    }

    let router = Router::new()
        .route("/r/{token}", get(relay_file))
        .with_state(installed);

    tokio::spawn(async move {
        if let Err(failure) = axum::serve(listener, router).await {
            tracing::error!(target: "remote", %failure, "the relay for remote files stopped");
        }
    });

    Ok(())
}

/// Whether a key is one a server may name a remote input by: letters, digits and dashes.
fn is_key(key: &str) -> bool {
    !key.is_empty()
        && key.len() <= 120
        && key
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
}

/// The list a key's input is read through.
fn list_path(folder: &Path, key: &str) -> PathBuf {
    folder.join(format!("{key}.{EXTENSION}"))
}

/// Registers where a remote input is now, or tells this service where it has moved to, and
/// answers the path every reader of it is to read.
///
/// The list is written only when the key is new, so a fresh link changes nothing a session has
/// cached and a run already reading carries on through the relay.
///
/// # Errors
///
/// Where the relay was never installed, the key or address is not one this accepts, or the list
/// cannot be written.
pub fn register(key: &str, remote: Remote) -> Result<String, String> {
    let installed = INSTALLED
        .get()
        .ok_or_else(|| "remote inputs are not set up".to_owned())?;

    if !is_key(key) {
        return Err(format!("{key} is not a key a remote input is named by"));
    }

    if !reqwest::Url::parse(&remote.url).is_ok_and(|url| url.scheme() == "https") {
        return Err("a remote input is fetched over https".to_owned());
    }

    let list = list_path(&installed.folder, key);
    let token = {
        let mut entries = installed
            .entries
            .lock()
            .map_err(|_| "the remote inputs could not be read".to_owned())?;
        let token = entries
            .get(key)
            .map_or_else(new_token, |entry| entry.token.clone());

        entries.insert(
            key.to_owned(),
            Entry {
                token: token.clone(),
                remote,
                expired: false,
            },
        );

        token
    };
    let body = format!(
        "ffconcat version 1.0\nfile 'http://{}/r/{token}'\n",
        installed.relay
    );

    if std::fs::read_to_string(&list).ok().as_deref() != Some(body.as_str()) {
        std::fs::create_dir_all(&installed.folder).map_err(|failure| failure.to_string())?;

        let written = list.with_extension(format!("{}.partial", std::process::id()));

        std::fs::write(&written, body).map_err(|failure| failure.to_string())?;
        std::fs::rename(&written, &list).map_err(|failure| failure.to_string())?;
    }

    Ok(list.to_string_lossy().into_owned())
}

/// A token nobody could guess, naming one remote input on the relay: two hashes keyed by the
/// random keys the standard library draws for this process.
fn new_token() -> String {
    use std::hash::{BuildHasher, Hasher};

    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |since| since.as_nanos());
    let mut token = String::with_capacity(32);

    for round in 0..2u8 {
        let mut hasher = std::collections::hash_map::RandomState::new().build_hasher();

        hasher.write_u8(round);
        hasher.write_u128(nanos);
        let _ = write!(token, "{:016x}", hasher.finish());
    }

    token
}

/// The list a registered remote input is read through.
///
/// # Errors
///
/// Where the key is not registered, which leaves the server to register it again — after this
/// service restarted, say.
pub fn path_of(key: &str) -> Result<String, String> {
    let installed = INSTALLED
        .get()
        .ok_or_else(|| "remote inputs are not set up".to_owned())?;
    let registered = installed
        .entries
        .lock()
        .is_ok_and(|entries| entries.contains_key(key));

    if !registered {
        return Err(format!("no remote input is registered as {key}"));
    }

    Ok(list_path(&installed.folder, key)
        .to_string_lossy()
        .into_owned())
}

/// The key a list was written for, where a path is a remote input's list this service wrote.
#[must_use]
pub fn key_of(path: &str) -> Option<String> {
    let installed = INSTALLED.get()?;
    let path = Path::new(path);

    if path.parent() != Some(installed.folder.as_path())
        || path
            .extension()
            .is_none_or(|extension| extension != EXTENSION)
    {
        return None;
    }

    let key = path.file_stem()?.to_str()?;

    is_key(key).then(|| key.to_owned())
}

/// Whether a path is a remote input's list this service wrote.
#[must_use]
pub fn is_remote(path: &str) -> bool {
    key_of(path).is_some()
}

/// Whether a remote input's list may be read: where its key is registered now.
#[must_use]
pub fn is_registered(path: &str) -> bool {
    let Some(installed) = INSTALLED.get() else {
        return false;
    };

    key_of(path).is_some_and(|key| {
        installed
            .entries
            .lock()
            .is_ok_and(|entries| entries.contains_key(&key))
    })
}

/// Whether the link a remote input was last given has stopped working, so the server should ask
/// its plugin for a fresh one.
#[must_use]
pub fn has_expired(key: &str) -> bool {
    INSTALLED.get().is_some_and(|installed| {
        installed
            .entries
            .lock()
            .is_ok_and(|entries| entries.get(key).is_some_and(|entry| entry.expired))
    })
}

/// The relay's address for a remote input, which ffmpeg and ffprobe read in place of its path.
#[must_use]
pub fn relay_address_of(path: &str) -> Option<String> {
    let installed = INSTALLED.get()?;
    let key = key_of(path)?;
    let token = installed.entries.lock().ok()?.get(&key)?.token.clone();

    Some(format!("http://{}/r/{token}", installed.relay))
}

/// What a remote input's kept answers are filed under: its key and size, which a fresh link to
/// the same file does not change, rather than the list's path and when it was written.
#[must_use]
pub fn address_of(path: &Path) -> Option<String> {
    let installed = INSTALLED.get()?;
    let key = key_of(path.to_str()?)?;
    let size = installed.entries.lock().ok()?.get(&key)?.remote.size_bytes;
    let mut hasher = Sha256::new();

    hasher.update(b"remote\0");
    hasher.update(key.as_bytes());
    hasher.update([0]);
    hasher.update(size.to_be_bytes());

    let mut address = String::with_capacity(32);

    for byte in hasher.finalize().iter().take(16) {
        let _ = write!(address, "{byte:02x}");
    }

    Some(address)
}

/// Why a fetch was not made.
#[derive(Debug, thiserror::Error)]
pub enum FetchFailure {
    /// The address broke the rules every fetch is held to.
    #[error("{0}")]
    Refused(String),
    /// The service could not be reached, or stopped answering.
    #[error(transparent)]
    Network(#[from] reqwest::Error),
}

/// Opens a fetch of a remote file, following redirects by hand and holding each hop to the rules,
/// an address written as numbers among them, which no resolver is asked about.
async fn open(
    installed: &Installed,
    address: &str,
    hosts: &[String],
    range: Option<&str>,
) -> Result<reqwest::Response, FetchFailure> {
    let mut url = reqwest::Url::parse(address)
        .map_err(|_| FetchFailure::Refused(format!("{address} is not an address")))?;

    for _ in 0..=MOST_REDIRECTS {
        let host = url.host_str().unwrap_or_default().to_ascii_lowercase();

        if url.scheme() != "https"
            || url.port().is_some_and(|port| port != 443)
            || !url.username().is_empty()
            || url.password().is_some()
            || !is_host_allowed(&host, hosts)
        {
            return Err(FetchFailure::Refused(format!(
                "a remote file may not be fetched from {url}"
            )));
        }

        let literal = host
            .trim_start_matches('[')
            .trim_end_matches(']')
            .parse::<IpAddr>()
            .ok();

        if literal.is_some_and(|address| !is_public(address)) {
            return Err(FetchFailure::Refused(format!(
                "{url} is an address a remote file may not come from"
            )));
        }

        let reached = match installed.dev_hosts.get(&host) {
            Some(stand_in) => {
                let mut local = url.clone();

                let _ = local.set_scheme("http");
                let _ = local.set_ip_host(stand_in.ip());
                let _ = local.set_port(Some(stand_in.port()));

                local
            }
            None => url.clone(),
        };
        let mut asked = installed.client.get(reached);

        if let Some(range) = range {
            asked = asked.header(header::RANGE, range);
        }

        let answer = asked.send().await?;

        if !answer.status().is_redirection() {
            return Ok(answer);
        }

        let Some(next) = answer
            .headers()
            .get(header::LOCATION)
            .and_then(|location| location.to_str().ok())
            .and_then(|location| url.join(location).ok())
        else {
            return Ok(answer);
        };

        url = next;
    }

    Err(FetchFailure::Refused(
        "a remote file was redirected too many times".to_owned(),
    ))
}

/// The headers of a remote file's answer that ffmpeg is passed on: its length, the range it
/// holds and its type, and that it takes ranges.
fn relayed_headers(answer: &reqwest::Response) -> HeaderMap {
    let mut headers = HeaderMap::new();

    for name in [
        header::CONTENT_LENGTH,
        header::CONTENT_RANGE,
        header::CONTENT_TYPE,
    ] {
        if let Some(value) = answer.headers().get(&name) {
            headers.insert(name, value.clone());
        }
    }

    headers.insert(header::ACCEPT_RANGES, HeaderValue::from_static("bytes"));

    headers
}

/// Whether a partial answer starts at the byte it was asked from, as its `Content-Range` says.
fn starts_at(answer: &reqwest::Response, from: u64) -> bool {
    answer
        .headers()
        .get(header::CONTENT_RANGE)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("bytes "))
        .and_then(|value| value.split_once('-'))
        .and_then(|(first, _)| first.parse::<u64>().ok())
        == Some(from)
}

/// The first byte a range asks for, and the last where it says.
fn range_of(range: &str) -> Option<(u64, Option<u64>)> {
    let (from, to) = range.strip_prefix("bytes=")?.split_once('-')?;

    Some((from.parse().ok()?, to.parse().ok()))
}

/// Reads a stretch of a registered remote input, for what reads part of a file rather than
/// streaming it, such as its cues.
pub async fn read_stretch(key: &str, from: u64, length: u64) -> Option<Vec<u8>> {
    let installed = INSTALLED.get()?;
    let entry = installed.entries.lock().ok()?.get(key)?.clone();
    let last = from
        .checked_add(length)?
        .min(entry.remote.size_bytes)
        .checked_sub(1)?;
    let mut answer = open(
        installed,
        &entry.remote.url,
        &entry.remote.hosts,
        Some(&format!("bytes={from}-{last}")),
    )
    .await
    .ok()?;

    if answer.status() != reqwest::StatusCode::PARTIAL_CONTENT {
        return None;
    }

    let mut read = Vec::new();

    while let Some(chunk) = answer.chunk().await.ok()? {
        read.extend_from_slice(&chunk);

        if read.len() as u64 > length {
            return None;
        }
    }

    Some(read)
}

/// Marks a remote input's link as no longer working.
fn mark_expired(installed: &Installed, token: &str) {
    if let Ok(mut entries) = installed.entries.lock() {
        for entry in entries.values_mut() {
            if entry.token == token {
                entry.expired = true;
            }
        }
    }
}

/// Answers ffmpeg's or ffprobe's request for a remote input, by fetching the same stretch from
/// wherever it is now and passing it on, picking a dropped connection up from where it stopped.
async fn relay_file(
    State(installed): State<Arc<Installed>>,
    RoutePath(token): RoutePath<String>,
    asked: HeaderMap,
) -> Response {
    let Some(entry) = installed
        .entries
        .lock()
        .ok()
        .and_then(|entries| entries.values().find(|entry| entry.token == token).cloned())
    else {
        return StatusCode::NOT_FOUND.into_response();
    };

    let range = asked
        .get(header::RANGE)
        .and_then(|range| range.to_str().ok())
        .map(str::to_owned);
    let answer = match open(
        &installed,
        &entry.remote.url,
        &entry.remote.hosts,
        range.as_deref(),
    )
    .await
    {
        Ok(answer) => answer,
        Err(failure) => {
            tracing::warn!(target: "remote", %failure, "could not fetch a remote file");

            return StatusCode::BAD_GATEWAY.into_response();
        }
    };
    let status = answer.status();

    if matches!(status.as_u16(), 401 | 403 | 404 | 410) {
        mark_expired(&installed, &token);
        tracing::warn!(target: "remote", "a remote file's link answered {status}; it has expired");

        return StatusCode::SERVICE_UNAVAILABLE.into_response();
    }

    if !status.is_success() {
        return StatusCode::BAD_GATEWAY.into_response();
    }

    let headers = relayed_headers(&answer);

    let start = if status == reqwest::StatusCode::PARTIAL_CONTENT {
        range
            .as_deref()
            .and_then(range_of)
            .map_or(0, |(from, _)| from)
    } else {
        0
    };
    let expected = answer.content_length();
    let end = if status == reqwest::StatusCode::PARTIAL_CONTENT {
        range.as_deref().and_then(range_of).and_then(|(_, to)| to)
    } else {
        None
    };
    let relayed = Arc::clone(&installed);
    let body = Body::from_stream(async_stream::stream! {
        let mut answer = answer;
        let mut sent: u64 = 0;
        let mut resumes = 0;

        loop {
            match answer.chunk().await {
                Ok(Some(chunk)) => {
                    sent += chunk.len() as u64;
                    yield Ok::<Bytes, std::io::Error>(chunk);
                }
                Ok(None) => break,
                Err(failure) => {
                    if expected.is_some_and(|expected| sent >= expected) || resumes >= MOST_RESUMES {
                        yield Err(std::io::Error::other(failure));
                        break;
                    }

                    resumes += 1;

                    let Some(from) = start.checked_add(sent) else {
                        yield Err(std::io::Error::other(failure));
                        break;
                    };
                    let again = end.map_or_else(|| format!("bytes={from}-"), |to| format!("bytes={from}-{to}"));
                    let current = relayed
                        .entries
                        .lock()
                        .ok()
                        .and_then(|entries| entries.values().find(|entry| entry.token == token).cloned());
                    let Some(current) = current else {
                        yield Err(std::io::Error::other(failure));
                        break;
                    };

                    match open(&relayed, &current.remote.url, &current.remote.hosts, Some(&again)).await {
                        Ok(picked_up) if picked_up.status() == reqwest::StatusCode::PARTIAL_CONTENT
                            && starts_at(&picked_up, from) => {
                            answer = picked_up;
                        }
                        _ => {
                            yield Err(std::io::Error::other(failure));
                            break;
                        }
                    }
                }
            }
        }
    });

    (status, headers, body).into_response()
}

/// The one folder and relay every test in this crate installs, since both can be installed only
/// once and the tests run side by side.
#[cfg(test)]
pub async fn test_install() -> PathBuf {
    let folder = std::env::temp_dir().join("valence-remote-input-tests");

    let _ = install(folder.clone(), HashMap::new()).await;

    folder
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_only_public_addresses() {
        for public in ["93.184.216.34", "1.1.1.1", "2606:4700:4700::1111"] {
            assert!(is_public(public.parse().expect("an address")), "{public}");
        }

        for private in [
            "127.0.0.1",
            "10.1.2.3",
            "172.20.0.1",
            "192.168.1.222",
            "169.254.169.254",
            "100.64.0.1",
            "0.0.0.0",
            "224.0.0.1",
            "::1",
            "::",
            "fe80::1",
            "fd00::1",
            "::ffff:127.0.0.1",
            "::ffff:169.254.169.254",
        ] {
            assert!(
                !is_public(private.parse().expect("an address")),
                "{private}"
            );
        }
    }

    #[test]
    fn matches_hosts_and_patterns() {
        let listed = vec![
            "api.example.com".to_owned(),
            "*.files.example.com".to_owned(),
        ];

        assert!(is_host_allowed("API.example.com", &listed));
        assert!(is_host_allowed("eu1.files.example.com", &listed));
        assert!(!is_host_allowed("files.example.com", &listed));
        assert!(!is_host_allowed("evilfiles.example.com", &listed));
        assert!(!is_host_allowed("evil-api.example.com", &listed));
    }

    #[test]
    fn reads_a_developers_stand_in_hosts_and_refuses_them_in_production() {
        let read = read_dev_hosts("Files.Example.test=127.0.0.1:8443", None).expect("reads");

        assert_eq!(
            read.get("files.example.test"),
            Some(&"127.0.0.1:8443".parse().expect("an address"))
        );
        assert!(read_dev_hosts("files.example.test=127.0.0.1:8443", Some("production")).is_err());
        assert!(read_dev_hosts("files.example.test", None).is_err());
        assert!(read_dev_hosts("", Some("production"))
            .expect("reads")
            .is_empty());
    }

    #[tokio::test]
    async fn names_a_registered_input_by_a_list_that_lasts_through_a_fresh_link() {
        let folder = test_install().await;
        let remote = |url: &str| Remote {
            url: url.to_owned(),
            hosts: vec!["*.files.example.test".to_owned()],
            size_bytes: 10,
        };
        let path =
            register("media-1-a", remote("https://eu1.files.example.test/a")).expect("registers");
        let written = std::fs::read_to_string(&path).expect("reads the list");

        assert!(Path::new(&path).starts_with(&folder));
        assert!(is_remote(&path));
        assert!(is_registered(&path));
        assert_eq!(
            register("media-1-a", remote("https://eu2.files.example.test/b")).expect("registers"),
            path
        );
        assert_eq!(
            std::fs::read_to_string(&path).expect("reads the list"),
            written
        );
        assert!(address_of(Path::new(&path)).is_some());
        assert!(!is_remote("/media/film.mkv"));
        assert!(register("Not A Key", remote("https://eu1.files.example.test/a")).is_err());
        assert!(register("media-1-b", remote("http://eu1.files.example.test/a")).is_err());
    }
}
