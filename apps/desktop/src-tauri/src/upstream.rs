//! Asking the chosen server, with the session this app holds for it.
//!
//! One HTTP client and one cookie jar serve every request this app makes of the server, so the
//! session the person signed in with goes with all of them, and the page never sees it. The jar is
//! kept beside the app's other files, sealed with a key the system keeps (see [`crate::jar`]). On
//! the first start, before this app has kept a jar of its own, it starts from the session the
//! Electron app held for the chosen server.
//!
//! Reading the jar asks the system for its key, which can wait on the person to unlock it, so it is
//! read on a thread of its own once the app has started. Until it has been, everything that carries
//! the session waits for it, and nothing is written over the jar on disk.

use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard, OnceLock, PoisonError};
use std::time::Duration;

use reqwest::header::{HeaderMap, HeaderName, HeaderValue, ORIGIN, SET_COOKIE};
use reqwest::{Client, Method, RequestBuilder, Response, Url};
use reqwest_cookie_store::{CookieStore, CookieStoreMutex};
use tauri::{AppHandle, Manager};
use tokio::sync::watch;

use crate::jar::{Jar, Kept, Keychain, SystemKeychain};
use crate::preferences::Preferences;

/// The header that says which kind of app is asking.
pub const CLIENT_KIND_HEADER: &str = "x-valence-client-kind";

/// The header that says which device is asking.
pub const DEVICE_HEADER: &str = "x-valence-device";

/// The kind of app this is, as the server knows it.
pub const CLIENT_KIND: &str = "desktop";

/// How long a server has to answer a connection before it is taken to be out of reach, rather than
/// left to the system, which can wait minutes on an address that drops what is sent to it.
pub const LONGEST_TO_CONNECT: Duration = Duration::from_secs(10);

const CARRIED: [&str; 6] = [
    "accept",
    "content-type",
    "range",
    "authorization",
    DEVICE_HEADER,
    "user-agent",
];

/// The client every request to the server goes out through, and the session it carries.
#[derive(Clone)]
pub struct Upstream {
    client: Client,
    jar: Arc<CookieStoreMutex>,
    jar_file: Arc<OnceLock<Jar>>,
    loaded: Loaded,
    saving: Arc<Mutex<()>>,
    preferences: Preferences,
}

/// Whether the session has been read from the disk yet, and a way to wait until it has.
#[derive(Clone)]
pub struct Loaded(Arc<watch::Sender<bool>>);

impl Loaded {
    /// Not loaded yet.
    fn not_yet() -> Self {
        Self(Arc::new(watch::Sender::new(false)))
    }

    /// Says the session has been loaded, letting everything waiting on it go.
    fn finish(&self) {
        self.0.send_replace(true);
    }

    /// Whether the session has been loaded.
    #[must_use]
    pub fn is_loaded(&self) -> bool {
        *self.0.borrow()
    }

    /// Waits until the session has been loaded.
    pub async fn wait(&self) {
        let mut watching = self.0.subscribe();

        drop(watching.wait_for(|is_loaded| *is_loaded).await);
    }
}

impl Upstream {
    /// Makes the client, with the cookies kept in `jar_file` where there is one, read now.
    ///
    /// # Errors
    ///
    /// When the HTTP client cannot be made.
    #[cfg(test)]
    pub fn new(preferences: Preferences, jar_file: Option<Jar>) -> Result<Self, reqwest::Error> {
        let upstream = Self::loading(preferences)?;
        let store = match jar_file.as_ref().map(Jar::load) {
            Some(Kept::Cookies(store)) => store,
            _ => CookieStore::default(),
        };

        upstream.fill(store, jar_file);
        Ok(upstream)
    }

    /// Makes the client with no cookies yet, holding back everything that carries the session
    /// until [`Upstream::fill`] gives it them.
    ///
    /// # Errors
    ///
    /// When the HTTP client cannot be made.
    pub fn loading(preferences: Preferences) -> Result<Self, reqwest::Error> {
        let jar = Arc::new(CookieStoreMutex::new(CookieStore::default()));
        let client = crate::tls::a_client(
            Client::builder().cookie_provider(Arc::clone(&jar)),
            LONGEST_TO_CONNECT,
        )?;

        Ok(Self {
            client,
            jar,
            jar_file: Arc::new(OnceLock::new()),
            loaded: Loaded::not_yet(),
            saving: Arc::new(Mutex::new(())),
            preferences,
        })
    }

    /// Fills the session with `store`, read from `jar_file` where there is one and kept there from
    /// now on, and lets everything waiting on it go. Only the first fill counts.
    pub fn fill(&self, store: CookieStore, jar_file: Option<Jar>) {
        if self.loaded.is_loaded() {
            return;
        }

        *lock_jar(&self.jar) = store;

        if let Some(jar_file) = jar_file {
            drop(self.jar_file.set(jar_file));
        }

        self.loaded.finish();
    }

    /// Whether the session has been read from the disk yet, and a way to wait until it has.
    #[must_use]
    pub fn loaded(&self) -> Loaded {
        self.loaded.clone()
    }

    /// The HTTP client. It carries the session's cookies only once they are loaded: wait on
    /// [`Upstream::loaded`] before asking anything that needs them.
    #[must_use]
    pub fn client(&self) -> &Client {
        &self.client
    }

    /// Where the chosen server is, or nothing before anybody has said.
    #[must_use]
    pub fn server_address(&self) -> Option<String> {
        self.preferences.server_address()
    }

    /// The address of `path_and_query` on the chosen server, or nothing where no server has been
    /// chosen or its address is not one.
    #[must_use]
    pub fn url_for(&self, path_and_query: &str) -> Option<Url> {
        self.server_address()
            .and_then(|server| on_the_server(&server, path_and_query))
    }

    /// A request to `path_and_query` on the chosen server, saying where it comes from and which
    /// kind of app is asking, or nothing where no server has been chosen.
    #[must_use]
    pub fn request(&self, method: Method, path_and_query: &str) -> Option<RequestBuilder> {
        let url = self.url_for(path_and_query)?;
        let headers = added(&origin_of(&url));

        Some(self.client.request(method, url).headers(headers))
    }

    /// Sends `request` once the session is loaded, keeping any cookies the answer sets.
    ///
    /// # Errors
    ///
    /// When the server cannot be asked.
    pub async fn send(&self, request: RequestBuilder) -> Result<Response, reqwest::Error> {
        self.loaded.wait().await;

        let answer = request.send().await?;

        self.keep_cookies_from(answer.headers());

        Ok(answer)
    }

    /// Keeps the jar on disk where `headers` set a cookie, once the session is loaded: off the
    /// runtime's own threads where there is a runtime, since writing it waits on the disk.
    pub fn keep_cookies_from(&self, headers: &HeaderMap) {
        if !headers.contains_key(SET_COOKIE) {
            return;
        }

        match tokio::runtime::Handle::try_current() {
            Ok(runtime) => {
                let keeping = self.clone();

                runtime.spawn(async move {
                    keeping.loaded.wait().await;
                    drop(tokio::task::spawn_blocking(move || keeping.keep_cookies()).await);
                });
            }
            Err(_) => self.keep_cookies(),
        }
    }

    /// Keeps the jar on disk, as it is now, unless the session has not been loaded yet, so what is
    /// on disk is never written over before it has been read.
    pub fn keep_cookies(&self) {
        if !self.loaded.is_loaded() {
            return;
        }

        let Some(file) = self.jar_file.get() else {
            return;
        };
        let _saving = lock(&self.saving);

        if let Err(error) = file.save(&lock_jar(&self.jar)) {
            eprintln!("Valence could not keep its session: {error}");
        }
    }

    /// The `Cookie` header the session sends to `url`, once it is loaded, or nothing where it
    /// sends none.
    pub async fn cookie_header_for(&self, url: &Url) -> Option<HeaderValue> {
        self.loaded.wait().await;

        let jar = lock_jar(&self.jar);
        let carried = jar
            .get_request_values(url)
            .map(|(name, value)| format!("{name}={value}"))
            .collect::<Vec<_>>()
            .join("; ");

        if carried.is_empty() {
            None
        } else {
            HeaderValue::from_str(&carried).ok()
        }
    }
}

/// Locks `mutex`, carrying on with what it holds even where a thread panicked holding it.
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

/// Locks the cookie jar, carrying on even where a thread panicked holding it.
fn lock_jar(jar: &CookieStoreMutex) -> MutexGuard<'_, CookieStore> {
    jar.lock().unwrap_or_else(PoisonError::into_inner)
}

/// Writes `bytes` to `file` through a file beside it that only this user may read.
///
/// # Errors
///
/// When the file cannot be written.
pub fn write_privately(file: &Path, bytes: &[u8]) -> io::Result<()> {
    if let Some(folder) = file.parent() {
        fs::create_dir_all(folder)?;
    }

    let mut beside = file.as_os_str().to_owned();
    beside.push(".writing");
    let beside = PathBuf::from(beside);
    let mut options = fs::OpenOptions::new();

    options.write(true).create(true).truncate(true);

    #[cfg(unix)]
    std::os::unix::fs::OpenOptionsExt::mode(&mut options, 0o600);

    let mut writing = options.open(&beside)?;

    writing.write_all(bytes)?;
    writing.sync_all()?;
    drop(writing);
    fs::rename(&beside, file)
}

/// The address of `path_and_query` on `server`, keeping the server's scheme, host and port and
/// nothing of any path it was given with, or nothing where it would name another server, as
/// `//elsewhere/` does.
#[must_use]
pub fn on_the_server(server: &str, path_and_query: &str) -> Option<Url> {
    let server = Url::parse(server).ok()?;

    if !matches!(server.scheme(), "http" | "https") || !path_and_query.starts_with('/') {
        return None;
    }

    server
        .join(path_and_query)
        .ok()
        .filter(|onward| onward.origin() == server.origin())
}

/// The origin of `url`, as an `Origin` header says it.
#[must_use]
pub fn origin_of(url: &Url) -> String {
    url.origin().ascii_serialization()
}

/// The headers from the page worth passing on: what it will accept, what it sends, which part of a
/// file it wants, how it signs in, which device is watching, and which browser it is.
#[must_use]
pub fn carried(from: &HeaderMap) -> HeaderMap {
    let mut kept = HeaderMap::new();

    for name in CARRIED {
        for value in from.get_all(name) {
            kept.append(HeaderName::from_static(name), value.clone());
        }
    }

    kept
}

/// The headers this app adds to everything it asks of the server: that it comes from the server's
/// own origin, which the server needs before it changes a session, and that the desktop app is
/// asking, so a server that has turned it off can say so.
#[must_use]
pub fn added(origin: &str) -> HeaderMap {
    let mut adding = HeaderMap::new();

    if let Ok(origin) = HeaderValue::from_str(origin) {
        adding.insert(ORIGIN, origin);
    }

    adding.insert(
        HeaderName::from_static(CLIENT_KIND_HEADER),
        HeaderValue::from_static(CLIENT_KIND),
    );
    adding
}

/// The headers to send the server for a request the page made: the ones worth carrying, and the
/// ones this app adds.
#[must_use]
pub fn asking_as(from: &HeaderMap, origin: &str) -> HeaderMap {
    let mut asking = carried(from);

    asking.extend(added(origin));
    asking
}

/// The upstream client, where it has been set up.
#[must_use]
pub fn upstream(app: &AppHandle) -> Option<Upstream> {
    app.try_state::<Upstream>()
        .map(|upstream| upstream.inner().clone())
}

/// The cookies to start from: those kept in `jar`, or, where this app has never kept a jar, the
/// session the Electron app held for the chosen server, which is kept in `jar` straight away. Where
/// the Electron app held none, nothing is kept, so a later start looks again.
fn starting_cookies(jar: &Jar, preferences: &Preferences, user_data: &Path) -> CookieStore {
    match jar.load() {
        Kept::Cookies(store) => store,
        Kept::Unopenable => CookieStore::default(),
        Kept::Nothing => {
            let carried = preferences
                .server_address()
                .and_then(|server| crate::carry_over::session(user_data, &server));

            match carried {
                Some(store) => {
                    if let Err(error) = jar.save(&store) {
                        eprintln!("Valence could not keep the session it carried over: {error}");
                    }

                    store
                }
                None => CookieStore::default(),
            }
        }
    }
}

/// Reads the jar in `user_data`, sealed with the key `keychain` keeps, on a blocking thread, and
/// fills `upstream`'s session with what it held, or with what the Electron app held where it held
/// nothing. Where reading it fails outright, the session starts empty and is kept nowhere.
fn start_loading(
    upstream: &Upstream,
    user_data: PathBuf,
    keychain: impl Keychain + Send + 'static,
) {
    let filling = upstream.clone();
    let reading = crate::runtime::handle().spawn_blocking(move || {
        let jar = Jar::in_folder(&user_data, &keychain);
        let store = starting_cookies(&jar, &filling.preferences, &user_data);

        filling.fill(store, Some(jar));
    });
    let settling = upstream.clone();

    crate::runtime::spawn(async move {
        if let Err(error) = reading.await {
            eprintln!("Valence could not read its session: {error}");
            settling.fill(CookieStore::default(), None);
        }
    });
}

/// Makes the client, and starts reading its cookie jar in the background.
///
/// # Errors
///
/// When the HTTP client cannot be made, or preferences were not set up first.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let preferences = app
        .try_state::<Preferences>()
        .ok_or("the preferences were not set up first")?
        .inner()
        .clone();
    let upstream = Upstream::loading(preferences)?;

    app.manage(upstream.clone());
    start_loading(&upstream, crate::paths::user_data(), SystemKeychain);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn headers(pairs: &[(&'static str, &'static str)]) -> HeaderMap {
        let mut made = HeaderMap::new();

        for (name, value) in pairs {
            made.append(*name, HeaderValue::from_static(value));
        }

        made
    }

    #[test]
    fn carries_only_what_the_page_meant() {
        let from = headers(&[
            ("accept", "application/json"),
            ("range", "bytes=0-"),
            ("x-valence-device", "abc"),
            ("user-agent", "WebKit"),
            ("cookie", "valence-key=secret"),
            ("origin", "http://127.0.0.1:41847"),
            ("host", "127.0.0.1:41847"),
            ("accept-encoding", "gzip"),
        ]);

        let kept = carried(&from);

        assert_eq!(kept.len(), 4);
        assert!(kept.get("cookie").is_none());
        assert!(kept.get("origin").is_none());
        assert!(kept.get("accept-encoding").is_none());
        assert_eq!(
            kept.get("range").and_then(|v| v.to_str().ok()),
            Some("bytes=0-")
        );
    }

    #[test]
    fn says_it_comes_from_the_server_and_is_the_desktop_app() {
        let from = headers(&[
            ("origin", "http://127.0.0.1:41847"),
            ("authorization", "Bearer x"),
        ]);

        let asking = asking_as(&from, "https://nas.example");

        assert_eq!(
            asking.get("origin").and_then(|v| v.to_str().ok()),
            Some("https://nas.example")
        );
        assert_eq!(
            asking.get(CLIENT_KIND_HEADER).and_then(|v| v.to_str().ok()),
            Some("desktop")
        );
        assert_eq!(
            asking.get("authorization").and_then(|v| v.to_str().ok()),
            Some("Bearer x")
        );
    }

    #[test]
    fn puts_a_path_on_the_server_and_nothing_of_its_own_path() {
        assert_eq!(
            on_the_server("http://nas:8420/some/where", "/api/health?x=1").map(String::from),
            Some("http://nas:8420/api/health?x=1".to_owned())
        );
        assert_eq!(on_the_server("ftp://nas", "/api/health"), None);
        assert_eq!(on_the_server("not an address", "/api/health"), None);
        assert_eq!(on_the_server("http://nas", "api/health"), None);
        assert_eq!(on_the_server("http://nas:8420", "//evil.example/api"), None);
        assert_eq!(
            on_the_server("http://nas:8420", "/\\evil.example/api"),
            None
        );
        assert_eq!(
            on_the_server("http://nas:8420", "/api/../../health").map(String::from),
            Some("http://nas:8420/health".to_owned())
        );
    }

    #[test]
    fn names_an_origin_as_a_header_does() {
        let url = Url::parse("https://nas.example:8443/api/x").expect("an address");

        assert_eq!(origin_of(&url), "https://nas.example:8443");
    }

    #[tokio::test]
    async fn keeps_the_session_between_launches() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let jar = folder.path().join("cookies.json");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let server = Url::parse("http://nas:8420/api/x").expect("an address");
        let first =
            Upstream::new(preferences.clone(), Some(Jar::plain(jar.clone()))).expect("a client");

        lock_jar(&first.jar)
            .parse("session=abc; Path=/; Max-Age=3600; HttpOnly", &server)
            .expect("a cookie");
        first.keep_cookies();

        let second = Upstream::new(preferences, Some(Jar::plain(jar.clone()))).expect("a client");

        assert_eq!(
            second
                .cookie_header_for(&server)
                .await
                .and_then(|v| v.to_str().ok().map(str::to_owned)),
            Some("session=abc".to_owned())
        );

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = fs::metadata(&jar).expect("the jar").permissions().mode();
            assert_eq!(mode & 0o777, 0o600);
        }
    }

    #[tokio::test]
    async fn keeps_a_cookie_an_answer_set_off_the_runtimes_threads() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let jar = folder.path().join("cookies.json");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let server = Url::parse("http://nas:8420/api/x").expect("an address");
        let upstream =
            Upstream::new(preferences.clone(), Some(Jar::plain(jar.clone()))).expect("a client");

        lock_jar(&upstream.jar)
            .parse("session=abc; Path=/; Max-Age=3600", &server)
            .expect("a cookie");
        upstream.keep_cookies_from(&HeaderMap::new());

        assert!(!jar.exists());

        upstream.keep_cookies_from(&headers(&[("set-cookie", "session=abc")]));

        for _ in 0..100 {
            if jar.exists() {
                break;
            }

            tokio::time::sleep(std::time::Duration::from_millis(10)).await;
        }

        let kept = Upstream::new(preferences, Some(Jar::plain(jar))).expect("a client");

        assert!(kept.cookie_header_for(&server).await.is_some());
    }

    #[test]
    fn starts_from_the_jar_this_app_kept() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let server = Url::parse("http://nas:8420/api/x").expect("an address");
        let jar = Jar::plain(folder.path().join("cookies.json"));
        let mut kept = CookieStore::default();

        kept.parse("session=abc; Path=/; Max-Age=3600", &server)
            .expect("a cookie");
        jar.save(&kept).expect("kept");

        let starting = starting_cookies(&jar, &preferences, folder.path());

        assert_eq!(starting.get_request_values(&server).count(), 1);
    }

    #[test]
    fn starts_empty_and_keeps_nothing_where_the_electron_app_left_no_session() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let jar = Jar::plain(folder.path().join("cookies.json"));

        preferences
            .write(crate::preferences::SERVER_ADDRESS, "http://nas:8420")
            .expect("written");

        let starting = starting_cookies(&jar, &preferences, folder.path());

        assert_eq!(starting.iter_any().count(), 0);
        assert!(!folder.path().join("cookies.json").exists());
    }

    struct Gated(Mutex<std::sync::mpsc::Receiver<()>>);

    impl Keychain for Gated {
        fn read(&self) -> Result<Option<[u8; 32]>, crate::jar::Unavailable> {
            lock(&self.0).recv().ok();
            Err(crate::jar::Unavailable)
        }

        fn write(&self, _key: &[u8; 32]) -> Result<(), crate::jar::Unavailable> {
            Err(crate::jar::Unavailable)
        }
    }

    struct Slow(Duration);

    impl Keychain for Slow {
        fn read(&self) -> Result<Option<[u8; 32]>, crate::jar::Unavailable> {
            std::thread::sleep(self.0);
            Err(crate::jar::Unavailable)
        }

        fn write(&self, _key: &[u8; 32]) -> Result<(), crate::jar::Unavailable> {
            Err(crate::jar::Unavailable)
        }
    }

    fn a_kept_session(folder: &Path, server: &str) {
        let server = Url::parse(server).expect("an address");
        let mut kept = CookieStore::default();

        kept.parse("session=abc; Path=/; Max-Age=3600", &server)
            .expect("a cookie");
        Jar::plain(folder.join("cookies.json"))
            .save(&kept)
            .expect("kept");
    }

    #[tokio::test]
    async fn holds_a_request_until_the_jar_is_read_then_sends_the_session() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let asked = Arc::new(Mutex::new(Vec::new()));
        let hearing = Arc::clone(&asked);
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("a port");
        let address = listener.local_addr().expect("an address");
        let router = axum::Router::new().route(
            "/api/me",
            axum::routing::get(move |headers: HeaderMap| {
                let cookie = headers
                    .get("cookie")
                    .and_then(|value| value.to_str().ok())
                    .unwrap_or_default()
                    .to_owned();

                lock(&hearing).push(cookie.clone());
                async move { cookie }
            }),
        );

        tokio::spawn(async move { axum::serve(listener, router).await });
        a_kept_session(folder.path(), &format!("http://{address}/"));
        preferences
            .write(
                crate::preferences::SERVER_ADDRESS,
                &format!("http://{address}"),
            )
            .expect("written");

        let upstream = Upstream::loading(preferences).expect("a client");
        let (unlock, unlocked) = std::sync::mpsc::channel();

        start_loading(
            &upstream,
            folder.path().to_path_buf(),
            Gated(Mutex::new(unlocked)),
        );

        let asking = upstream.request(Method::GET, "/api/me").expect("a request");
        let sending = upstream.clone();
        let answer = tokio::spawn(async move { sending.send(asking).await });

        tokio::time::sleep(Duration::from_millis(100)).await;

        assert!(!answer.is_finished());
        assert!(lock(&asked).is_empty());

        unlock.send(()).expect("unlocked");

        let said = answer
            .await
            .expect("sent")
            .expect("answered")
            .text()
            .await
            .expect("a body");

        assert_eq!(said, "session=abc");
        assert_eq!(*lock(&asked), ["session=abc"]);
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn a_slow_keychain_does_not_hold_up_starting() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let server = Url::parse("http://nas:8420/api/x").expect("an address");
        let upstream = Upstream::loading(preferences).expect("a client");
        let started = std::time::Instant::now();

        a_kept_session(folder.path(), "http://nas:8420/");
        start_loading(
            &upstream,
            folder.path().to_path_buf(),
            Slow(Duration::from_millis(500)),
        );

        assert!(started.elapsed() < Duration::from_millis(250));
        assert!(!upstream.loaded().is_loaded());

        let carried = upstream.cookie_header_for(&server).await;

        assert!(started.elapsed() >= Duration::from_millis(500));
        assert_eq!(
            carried.and_then(|v| v.to_str().ok().map(str::to_owned)),
            Some("session=abc".to_owned())
        );
    }

    #[test]
    fn writes_nothing_over_the_jar_before_it_has_been_read() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let server = Url::parse("http://nas:8420/api/x").expect("an address");
        let jar = Jar::plain(folder.path().join("cookies.json"));
        let upstream = Upstream::loading(preferences).expect("a client");

        a_kept_session(folder.path(), "http://nas:8420/");
        lock_jar(&upstream.jar)
            .parse("other=1; Path=/; Max-Age=3600", &server)
            .expect("a cookie");
        upstream.keep_cookies_from(&headers(&[("set-cookie", "other=1")]));
        upstream.keep_cookies();

        let Kept::Cookies(on_disk) = jar.load() else {
            panic!("the jar was not kept");
        };

        assert_eq!(on_disk.iter_any().count(), 1);

        let Kept::Cookies(store) = jar.load() else {
            panic!("the jar was not kept");
        };

        upstream.fill(store, Some(jar.clone()));
        upstream.keep_cookies();

        let Kept::Cookies(on_disk) = jar.load() else {
            panic!("the jar was not kept");
        };
        let names = on_disk
            .iter_any()
            .map(|cookie| cookie.name().to_owned())
            .collect::<Vec<_>>();

        assert_eq!(names, ["session"]);
    }

    #[test]
    fn asks_nothing_before_a_server_is_chosen() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let upstream = Upstream::new(preferences.clone(), None).expect("a client");

        assert!(upstream.request(Method::GET, "/api/health").is_none());

        preferences
            .write(crate::preferences::SERVER_ADDRESS, "http://nas:8420")
            .expect("written");

        assert_eq!(
            upstream.url_for("/api/health").map(String::from),
            Some("http://nas:8420/api/health".to_owned())
        );
    }
}
