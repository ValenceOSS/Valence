//! Whether the chosen server can be reached now.
//!
//! Every request the page makes passes through this app on its way to the server, so a connection
//! that could not be made is seen here first, for what it is. A refusal is not a miss: a server
//! that answers at all is reachable, whatever it says. A request left waiting can ask for a check,
//! which gives the server a few seconds to answer before it is counted gone; what a check finds is
//! set aside where something newer was heard while it was out, or the server it asked is no longer
//! the one chosen. While the server is out of reach it is asked again on a timer, since offline
//! mode stops the page making the requests that would notice it coming back. While it is
//! reachable nothing is polled.

use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};
use tokio::task::JoinHandle;

use crate::upstream::Upstream;

/// How often to ask again while the server cannot be reached.
pub const ASK_AGAIN_EVERY: Duration = Duration::from_secs(15);

/// How long the server has to answer a check.
pub const ANSWERS_WITHIN: Duration = Duration::from_secs(5);

/// The event the page hears when reach changes.
pub const REACH_CHANGED: &str = "valence:reach-changed";

type Listener = Arc<dyn Fn(bool) + Send + Sync>;

/// What is known about whether the server can be reached, and the ways to tell it more.
#[derive(Clone)]
pub struct Reach(Arc<Inner>);

struct Inner {
    upstream: Upstream,
    every: Duration,
    within: Duration,
    state: Mutex<State>,
    listeners: Mutex<Vec<Listener>>,
}

struct State {
    is_reachable: bool,
    is_checking: bool,
    heard_since: u64,
    asking: Option<JoinHandle<()>>,
}

impl Reach {
    /// Starts out reachable, asking through `upstream`: every `every` while out of reach, giving
    /// the server `within` to answer.
    #[must_use]
    pub fn new(upstream: Upstream, every: Duration, within: Duration) -> Self {
        Self(Arc::new(Inner {
            upstream,
            every,
            within,
            state: Mutex::new(State {
                is_reachable: true,
                is_checking: false,
                heard_since: 0,
                asking: None,
            }),
            listeners: Mutex::new(Vec::new()),
        }))
    }

    /// Whether the server could be reached when last heard from.
    #[must_use]
    pub fn is_reachable(&self) -> bool {
        self.state().is_reachable
    }

    /// Notes that the server answered.
    pub fn note_reached(&self) {
        self.state().heard_since += 1;
        self.settle(true);
    }

    /// Notes that the server could not be reached.
    pub fn note_missed(&self) {
        self.state().heard_since += 1;
        self.settle(false);
    }

    /// Asks the server whether it is there, where it is thought reachable and nothing is asking
    /// already, and believes the answer unless something newer was heard meanwhile.
    pub fn check_now(&self) {
        let Some(server) = self.0.upstream.server_address() else {
            return;
        };
        let heard_before = {
            let mut state = self.state();

            if !state.is_reachable || state.is_checking {
                return;
            }

            state.is_checking = true;
            state.heard_since
        };
        let reach = self.clone();

        crate::runtime::spawn(async move {
            let is_there = reach.is_answering(&server).await;
            let is_current = {
                let mut state = reach.state();

                state.is_checking = false;
                state.heard_since == heard_before
            };

            if is_current && reach.0.upstream.server_address().as_deref() == Some(server.as_str()) {
                reach.settle(is_there);
            }
        });
    }

    /// Calls `listener` with whether the server is reachable, each time that changes.
    pub fn when_changed(&self, listener: impl Fn(bool) + Send + Sync + 'static) {
        self.listeners().push(Arc::new(listener));
    }

    /// Stops asking on a timer.
    pub fn stop(&self) {
        if let Some(asking) = self.state().asking.take() {
            asking.abort();
        }
    }

    /// Settles on whether the server is reachable, telling listeners where that changed, and
    /// asking on a timer while it is not.
    fn settle(&self, now_reachable: bool) {
        {
            let mut state = self.state();

            if state.is_reachable == now_reachable {
                return;
            }

            state.is_reachable = now_reachable;
        }

        let listeners = self.listeners().clone();

        for listener in listeners {
            listener(now_reachable);
        }

        if now_reachable {
            self.stop();
        } else {
            self.keep_asking();
        }
    }

    /// Asks whether the server is back every so often, until it is.
    fn keep_asking(&self) {
        self.stop();

        let reach = self.clone();
        let asking = crate::runtime::spawn(async move {
            loop {
                tokio::time::sleep(reach.0.every).await;

                let Some(server) = reach.0.upstream.server_address() else {
                    continue;
                };

                if reach.is_answering(&server).await {
                    reach.state().asking = None;
                    reach.settle(true);
                    return;
                }
            }
        });

        self.state().asking = Some(asking);
    }

    /// Whether `server` answers its health check in time, whatever it says.
    async fn is_answering(&self, server: &str) -> bool {
        let Some(url) = crate::upstream::on_the_server(server, "/api/health") else {
            return false;
        };

        self.0
            .upstream
            .client()
            .get(url)
            .timeout(self.0.within)
            .send()
            .await
            .is_ok()
    }

    /// What is known, even where a thread panicked holding it.
    fn state(&self) -> MutexGuard<'_, State> {
        self.0.state.lock().unwrap_or_else(PoisonError::into_inner)
    }

    /// Who is listening, even where a thread panicked holding it.
    fn listeners(&self) -> MutexGuard<'_, Vec<Listener>> {
        self.0
            .listeners
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
    }
}

/// Whether the server could be reached when last heard from.
#[must_use]
pub fn is_reachable(app: &AppHandle) -> bool {
    app.try_state::<Reach>()
        .is_none_or(|reach| reach.is_reachable())
}

/// The server's reach, where it has been set up.
#[must_use]
pub fn reach(app: &AppHandle) -> Option<Reach> {
    app.try_state::<Reach>().map(|reach| reach.inner().clone())
}

/// Starts following whether the server can be reached, tells the page each time that changes, and
/// counts a server somebody has just chosen as reached.
///
/// # Errors
///
/// When the upstream client was not set up first.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let upstream = crate::upstream::upstream(app.handle())
        .ok_or("the upstream client was not set up first")?;
    let reach = Reach::new(upstream.clone(), ASK_AGAIN_EVERY, ANSWERS_WITHIN);
    let handle = app.handle().clone();

    reach.when_changed(move |is_reachable| {
        if let Err(error) = handle.emit(REACH_CHANGED, is_reachable) {
            eprintln!("Valence could not say the server's reach changed: {error}");
        }
    });

    let noted = reach.clone();

    app.try_state::<crate::preferences::Preferences>()
        .ok_or("the preferences were not set up first")?
        .when_written(move |key| {
            if key == crate::preferences::SERVER_ADDRESS && upstream.server_address().is_some() {
                noted.note_reached();
            }
        });

    app.manage(reach);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::preferences::{Preferences, SERVER_ADDRESS};
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct Fixture {
        _folder: tempfile::TempDir,
        preferences: Preferences,
        reach: Reach,
    }

    fn a_reach(every: Duration) -> Fixture {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let preferences = Preferences::open(folder.path().join("preferences.json"));
        let upstream = Upstream::new(preferences.clone(), None).expect("a client");
        let reach = Reach::new(upstream, every, Duration::from_millis(500));

        Fixture {
            _folder: folder,
            preferences,
            reach,
        }
    }

    async fn a_health_server() -> (String, Arc<AtomicUsize>) {
        let asked = Arc::new(AtomicUsize::new(0));
        let counted = Arc::clone(&asked);
        let router = axum::Router::new().route(
            "/api/health",
            axum::routing::get(move || {
                counted.fetch_add(1, Ordering::SeqCst);
                async { "ok" }
            }),
        );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("a port");
        let address = format!("http://{}", listener.local_addr().expect("an address"));

        tokio::spawn(async move { axum::serve(listener, router).await });

        (address, asked)
    }

    async fn a_closed_address() -> String {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("a port");
        let address = format!("http://{}", listener.local_addr().expect("an address"));

        drop(listener);
        address
    }

    async fn eventually(condition: impl Fn() -> bool) -> bool {
        for _ in 0..100 {
            if condition() {
                return true;
            }

            tokio::time::sleep(Duration::from_millis(20)).await;
        }

        false
    }

    #[tokio::test]
    async fn starts_reachable_and_tells_listeners_of_changes_only() {
        let fixture = a_reach(Duration::from_secs(60));
        let told = Arc::new(Mutex::new(Vec::new()));
        let heard = Arc::clone(&told);

        fixture.reach.when_changed(move |is_reachable| {
            heard.lock().expect("a lock").push(is_reachable);
        });

        assert!(fixture.reach.is_reachable());

        fixture.reach.note_reached();
        fixture.reach.note_missed();
        fixture.reach.note_missed();
        fixture.reach.note_reached();
        fixture.reach.stop();

        assert_eq!(*told.lock().expect("a lock"), vec![false, true]);
    }

    #[tokio::test]
    async fn asks_again_until_the_server_is_back() {
        let fixture = a_reach(Duration::from_millis(30));
        let (server, asked) = a_health_server().await;

        fixture
            .preferences
            .write(SERVER_ADDRESS, &server)
            .expect("written");
        fixture.reach.note_missed();

        let reach = fixture.reach.clone();

        assert!(eventually(|| reach.is_reachable()).await);
        assert!(asked.load(Ordering::SeqCst) >= 1);
    }

    #[tokio::test]
    async fn a_check_that_finds_nothing_counts_the_server_gone() {
        let fixture = a_reach(Duration::from_secs(60));

        fixture
            .preferences
            .write(SERVER_ADDRESS, &a_closed_address().await)
            .expect("written");
        fixture.reach.check_now();

        let reach = fixture.reach.clone();

        assert!(eventually(|| !reach.is_reachable()).await);
        fixture.reach.stop();
    }

    #[tokio::test]
    async fn a_check_is_set_aside_when_something_newer_was_heard() {
        let fixture = a_reach(Duration::from_secs(60));

        fixture
            .preferences
            .write(SERVER_ADDRESS, &a_closed_address().await)
            .expect("written");
        fixture.reach.check_now();
        fixture.reach.note_reached();

        let reach = fixture.reach.clone();

        assert!(eventually(|| !reach.state().is_checking).await);
        assert!(fixture.reach.is_reachable());
    }

    #[tokio::test]
    async fn checks_nothing_without_a_server() {
        let fixture = a_reach(Duration::from_secs(60));

        fixture.reach.check_now();

        assert!(!fixture.reach.state().is_checking);
    }
}
