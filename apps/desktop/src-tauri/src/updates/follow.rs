//! Watching for a release newer than this build, and fetching it only once somebody says to.

use futures_util::future::BoxFuture;
use serde::Serialize;
use std::future::Future;
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use std::time::Duration;
use tokio::runtime::Handle;
use tokio::task::AbortHandle;

/// How often to look for a release.
pub const CHECK_EVERY: Duration = Duration::from_secs(6 * 60 * 60);

/// What is known about an update, as `DesktopUpdateSchema` reads it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum DesktopUpdate {
    /// Nothing newer has been found.
    None,
    /// A release was found and can be fetched.
    Available {
        /// Its version.
        version: String,
    },
    /// A release is being fetched.
    Downloading {
        /// Its version.
        version: String,
        /// How much of it has arrived, from 0 to 100.
        percent: u8,
    },
    /// Fetching a release failed, and it can be asked for again.
    Failed {
        /// Its version.
        version: String,
    },
}

/// What looks for a release, fetches it, and restarts into it.
pub trait Updater: Send + Sync + 'static {
    /// Looks for a release newer than this build, and says its version where there is one.
    fn check(&self) -> impl Future<Output = Result<Option<String>, String>> + Send;

    /// Fetches the release last found, saying how far it has got as bytes arrive: how many in
    /// this chunk, and how many there are in all where that is known.
    fn download(
        &self,
        progress: Box<dyn FnMut(usize, Option<u64>) + Send>,
    ) -> impl Future<Output = Result<(), String>> + Send;

    /// Installs what was fetched and restarts into it.
    ///
    /// # Errors
    ///
    /// When it could not be installed.
    fn install(&self) -> Result<(), String>;
}

/// What following the updates needs: who hears what it has come to, what to do just before
/// restarting into a download, and where to write down what it did.
pub struct Needs {
    /// How often to look.
    pub every: Duration,
    /// Hears every change in what is known.
    pub on_change: Box<dyn Fn(&DesktopUpdate) + Send + Sync>,
    /// Runs just before restarting into a download, with its version.
    pub before_installing: Box<dyn Fn(String) -> BoxFuture<'static, ()> + Send + Sync>,
    /// Writes a line down.
    pub log: Box<dyn Fn(&str) + Send + Sync>,
}

/// What is going on now.
struct Now {
    update: DesktopUpdate,
    timer: Option<AbortHandle>,
    is_stopped: bool,
    is_checking: bool,
    received: u64,
}

/// The updates being followed.
pub struct Followed<U: Updater> {
    updater: U,
    runtime: Handle,
    needs: Needs,
    now: Mutex<Now>,
}

/// Watches for a release newer than this build, and fetches it only once somebody says to.
///
/// Finding a release and fetching it are two decisions, and only the first is this client's. A
/// release is looked for as this starts and every few hours after, and what is found is offered —
/// nothing is downloaded until somebody asks for it. Once they have, the download runs with its
/// progress on show, and the moment it is on disk the client restarts into it: they have already
/// said yes. Whatever has to happen before the restart is waited for first.
///
/// A download that fails says so and can be asked for again. A check that fails is written down
/// and otherwise left to the next one, since a laptop that is offline has not found a broken
/// release. Somebody can also ask for a check themselves: it looks straight away and starts the
/// wait for the next one again from there, and asking while a check is already out does nothing.
pub fn follow_the_updates<U: Updater>(
    updater: U,
    runtime: Handle,
    needs: Needs,
) -> Arc<Followed<U>> {
    let followed = Arc::new(Followed {
        updater,
        runtime,
        needs,
        now: Mutex::new(Now {
            update: DesktopUpdate::None,
            timer: None,
            is_stopped: false,
            is_checking: false,
            received: 0,
        }),
    });

    followed.check_once();

    followed
}

impl<U: Updater> Followed<U> {
    /// What is going on, even where a panic left it half-said.
    fn now(&self) -> MutexGuard<'_, Now> {
        self.now.lock().unwrap_or_else(PoisonError::into_inner)
    }

    /// What is known now.
    #[must_use]
    pub fn update(&self) -> DesktopUpdate {
        self.now().update.clone()
    }

    /// Says what is known now, to whoever hears it.
    fn move_to(&self, next: DesktopUpdate) {
        let said = {
            let mut now = self.now();

            now.update = next;
            now.update.clone()
        };

        (self.needs.on_change)(&said);
    }

    /// Looks once, and waits to look again.
    fn check_once(self: &Arc<Self>) {
        let is_downloading = {
            let mut now = self.now();

            now.is_checking = true;

            matches!(now.update, DesktopUpdate::Downloading { .. })
        };
        let followed = Arc::clone(self);

        self.runtime.spawn(async move {
            if !is_downloading {
                match followed.updater.check().await {
                    Ok(Some(version)) => followed.found(version),
                    Ok(None) => {}
                    Err(error) => (followed.needs.log)(&format!("Failed: {error}")),
                }
            }

            followed.wait_to_look_again();
        });
    }

    /// Starts the wait for the next look, unless stopped.
    fn wait_to_look_again(self: &Arc<Self>) {
        let mut now = self.now();

        now.is_checking = false;

        if now.is_stopped {
            return;
        }

        let followed = Arc::clone(self);
        let every = self.needs.every;
        let timer = self.runtime.spawn(async move {
            tokio::time::sleep(every).await;
            followed.check_once();
        });

        now.timer = Some(timer.abort_handle());
    }

    /// Offers a release that was found, unless it is already being fetched or already offered.
    fn found(&self, version: String) {
        let is_known = match &self.now().update {
            DesktopUpdate::Downloading { .. } => true,
            DesktopUpdate::None => false,
            DesktopUpdate::Available { version: known }
            | DesktopUpdate::Failed { version: known } => *known == version,
        };

        if !is_known {
            self.move_to(DesktopUpdate::Available { version });
        }
    }

    /// Looks again straight away, and waits the full time again from there.
    pub fn check_now(self: &Arc<Self>) {
        {
            let mut now = self.now();

            if now.is_stopped || now.is_checking {
                return;
            }

            if let Some(timer) = now.timer.take() {
                timer.abort();
            }
        }

        self.check_once();
    }

    /// Fetches the release on offer, and restarts into it once it is on disk.
    pub fn download(self: &Arc<Self>) {
        let version = match &self.now().update {
            DesktopUpdate::Available { version } | DesktopUpdate::Failed { version } => {
                version.clone()
            }
            DesktopUpdate::None | DesktopUpdate::Downloading { .. } => return,
        };

        (self.needs.log)(&format!("Asked to download {version}"));
        self.now().received = 0;
        self.move_to(DesktopUpdate::Downloading {
            version: version.clone(),
            percent: 0,
        });

        let followed = Arc::clone(self);

        self.runtime.spawn(async move {
            let hearing = Arc::clone(&followed);
            let fetched = followed
                .updater
                .download(Box::new(move |chunk, whole| hearing.arrived(chunk, whole)))
                .await;

            match fetched {
                Ok(()) => followed.downloaded(version).await,
                Err(error) => {
                    (followed.needs.log)(&format!("Failed: {error}"));
                    followed.failed(version);
                }
            }
        });
    }

    /// Notes some more of the release arriving, and says so where the percentage has moved.
    fn arrived(&self, chunk: usize, whole: Option<u64>) {
        let (version, percent) = {
            let mut now = self.now();
            let DesktopUpdate::Downloading { version, percent } = &now.update else {
                return;
            };
            let version = version.clone();
            let before = *percent;

            now.received = now
                .received
                .saturating_add(u64::try_from(chunk).unwrap_or(u64::MAX));

            let Some(whole) = whole.filter(|whole| *whole > 0) else {
                return;
            };
            let percent =
                u8::try_from((now.received.saturating_mul(100) / whole).min(100)).unwrap_or(100);

            if percent == before {
                return;
            }

            (version, percent)
        };

        self.move_to(DesktopUpdate::Downloading { version, percent });
    }

    /// Says a download failed, where it was still the one going on.
    fn failed(&self, version: String) {
        if matches!(self.now().update, DesktopUpdate::Downloading { .. }) {
            self.move_to(DesktopUpdate::Failed { version });
        }
    }

    /// Restarts into a release that is on disk, once whatever comes first is done.
    async fn downloaded(&self, version: String) {
        (self.needs.log)(&format!("Downloaded {version}, restarting to install it"));
        (self.needs.before_installing)(version.clone()).await;

        if let Err(error) = self.updater.install() {
            (self.needs.log)(&format!("Failed: {error}"));
            self.failed(version);
        }
    }

    /// Stops looking.
    pub fn stop(&self) {
        let mut now = self.now();

        now.is_stopped = true;

        if let Some(timer) = now.timer.take() {
            timer.abort();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{follow_the_updates, DesktopUpdate, Followed, Needs, Updater};
    use futures_util::FutureExt;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::{Arc, Mutex};
    use std::time::Duration;
    use tokio::runtime::Handle;
    use tokio::sync::Notify;

    type Hearing = Arc<Mutex<Option<Box<dyn FnMut(usize, Option<u64>) + Send>>>>;

    #[derive(Clone, Copy)]
    enum Answer {
        Nothing,
        Found,
        Fails,
        Never,
    }

    #[derive(Default)]
    struct Counts {
        checks: AtomicUsize,
        downloads: AtomicUsize,
        installs: AtomicUsize,
    }

    struct AFakeUpdater {
        check: Answer,
        download: Answer,
        counts: Arc<Counts>,
        progress: Hearing,
    }

    impl Updater for AFakeUpdater {
        async fn check(&self) -> Result<Option<String>, String> {
            self.counts.checks.fetch_add(1, Ordering::SeqCst);

            match self.check {
                Answer::Nothing => Ok(None),
                Answer::Found => Ok(Some("1.2.0".to_owned())),
                Answer::Fails => Err("offline".to_owned()),
                Answer::Never => std::future::pending().await,
            }
        }

        async fn download(
            &self,
            progress: Box<dyn FnMut(usize, Option<u64>) + Send>,
        ) -> Result<(), String> {
            self.counts.downloads.fetch_add(1, Ordering::SeqCst);

            if let Ok(mut kept) = self.progress.lock() {
                *kept = Some(progress);
            }

            match self.download {
                Answer::Nothing | Answer::Found => Ok(()),
                Answer::Fails => Err("offline".to_owned()),
                Answer::Never => std::future::pending().await,
            }
        }

        fn install(&self) -> Result<(), String> {
            self.counts.installs.fetch_add(1, Ordering::SeqCst);

            Ok(())
        }
    }

    struct Following {
        followed: Arc<Followed<AFakeUpdater>>,
        counts: Arc<Counts>,
        changes: Arc<Mutex<Vec<DesktopUpdate>>>,
        lines: Arc<Mutex<Vec<String>>>,
        progress: Hearing,
        let_it_restart: Arc<Notify>,
    }

    impl Following {
        fn checks(&self) -> usize {
            self.counts.checks.load(Ordering::SeqCst)
        }

        fn downloads(&self) -> usize {
            self.counts.downloads.load(Ordering::SeqCst)
        }

        fn installs(&self) -> usize {
            self.counts.installs.load(Ordering::SeqCst)
        }

        fn changes(&self) -> Vec<DesktopUpdate> {
            self.changes
                .lock()
                .map(|said| said.clone())
                .unwrap_or_default()
        }

        fn lines(&self) -> Vec<String> {
            self.lines
                .lock()
                .map(|said| said.clone())
                .unwrap_or_default()
        }

        fn arrive(&self, chunk: usize, whole: u64) {
            if let Ok(mut progress) = self.progress.lock() {
                if let Some(progress) = progress.as_mut() {
                    progress(chunk, Some(whole));
                }
            }
        }
    }

    impl Drop for Following {
        fn drop(&mut self) {
            self.followed.stop();
        }
    }

    fn following(check: Answer, download: Answer, waits_to_install: bool) -> Following {
        let counts = Arc::new(Counts::default());
        let changes = Arc::new(Mutex::new(Vec::new()));
        let lines = Arc::new(Mutex::new(Vec::new()));
        let progress = Arc::new(Mutex::new(None));
        let let_it_restart = Arc::new(Notify::new());
        let heard = Arc::clone(&changes);
        let written = Arc::clone(&lines);
        let waiting = Arc::clone(&let_it_restart);

        let followed = follow_the_updates(
            AFakeUpdater {
                check,
                download,
                counts: Arc::clone(&counts),
                progress: Arc::clone(&progress),
            },
            Handle::current(),
            Needs {
                every: Duration::from_secs(1),
                on_change: Box::new(move |update| {
                    if let Ok(mut heard) = heard.lock() {
                        heard.push(update.clone());
                    }
                }),
                before_installing: Box::new(move |_| {
                    let waiting = Arc::clone(&waiting);

                    async move {
                        if waits_to_install {
                            waiting.notified().await;
                        }
                    }
                    .boxed()
                }),
                log: Box::new(move |line| {
                    if let Ok(mut written) = written.lock() {
                        written.push(line.to_owned());
                    }
                }),
            },
        );

        Following {
            followed,
            counts,
            changes,
            lines,
            progress,
            let_it_restart,
        }
    }

    async fn settle() {
        for _ in 0..20 {
            tokio::task::yield_now().await;
        }
    }

    async fn wait(milliseconds: u64) {
        tokio::time::advance(Duration::from_millis(milliseconds)).await;
        settle().await;
    }

    #[tokio::test(start_paused = true)]
    async fn knows_of_nothing_until_a_release_is_found() {
        let following = following(Answer::Nothing, Answer::Never, false);

        settle().await;

        assert_eq!(following.followed.update(), DesktopUpdate::None);
    }

    #[tokio::test(start_paused = true)]
    async fn offers_a_release_it_finds_and_fetches_nothing_of_its_own_accord() {
        let following = following(Answer::Found, Answer::Never, false);

        settle().await;

        assert_eq!(
            following.changes(),
            vec![DesktopUpdate::Available {
                version: "1.2.0".to_owned()
            }]
        );
        assert_eq!(following.downloads(), 0);
    }

    #[tokio::test(start_paused = true)]
    async fn says_nothing_new_when_the_next_check_finds_the_same_release() {
        let following = following(Answer::Found, Answer::Never, false);

        settle().await;
        wait(1000).await;

        assert_eq!(following.checks(), 2);
        assert_eq!(following.changes().len(), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn fetches_the_release_once_asked_to_and_shows_how_far_it_has_got() {
        let following = following(Answer::Found, Answer::Never, false);

        settle().await;
        following.followed.download();
        settle().await;
        following.arrive(457, 1000);
        following.arrive(2, 1000);

        assert_eq!(following.downloads(), 1);
        assert_eq!(
            following.changes(),
            vec![
                DesktopUpdate::Available {
                    version: "1.2.0".to_owned()
                },
                DesktopUpdate::Downloading {
                    version: "1.2.0".to_owned(),
                    percent: 0
                },
                DesktopUpdate::Downloading {
                    version: "1.2.0".to_owned(),
                    percent: 45
                },
            ]
        );
    }

    #[tokio::test(start_paused = true)]
    async fn restarts_into_the_release_the_moment_it_is_on_disk() {
        let following = following(Answer::Found, Answer::Found, false);

        settle().await;
        following.followed.download();
        settle().await;

        assert_eq!(following.installs(), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn puts_up_what_there_is_to_see_during_the_install_before_restarting() {
        let following = following(Answer::Found, Answer::Found, true);

        settle().await;
        following.followed.download();
        settle().await;

        assert_eq!(following.installs(), 0);

        following.let_it_restart.notify_one();
        settle().await;

        assert_eq!(following.installs(), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn fetches_nothing_where_there_is_nothing_to_fetch() {
        let following = following(Answer::Nothing, Answer::Found, false);

        settle().await;
        following.followed.download();
        settle().await;

        assert_eq!(following.downloads(), 0);
    }

    #[tokio::test(start_paused = true)]
    async fn says_a_download_failed_and_fetches_it_again_when_asked() {
        let following = following(Answer::Found, Answer::Fails, false);

        settle().await;
        following.followed.download();
        settle().await;

        assert_eq!(
            following.followed.update(),
            DesktopUpdate::Failed {
                version: "1.2.0".to_owned()
            }
        );

        following.followed.download();
        settle().await;

        assert_eq!(following.downloads(), 2);
    }

    #[tokio::test(start_paused = true)]
    async fn keeps_a_download_going_when_a_check_finds_the_same_release_mid_way() {
        let following = following(Answer::Found, Answer::Never, false);

        settle().await;
        following.followed.download();
        following.followed.found("1.2.0".to_owned());

        assert_eq!(
            following.followed.update(),
            DesktopUpdate::Downloading {
                version: "1.2.0".to_owned(),
                percent: 0
            }
        );
    }

    #[tokio::test(start_paused = true)]
    async fn writes_down_what_went_wrong_and_what_it_was_asked_to_do() {
        let following = following(Answer::Found, Answer::Fails, false);

        settle().await;
        following.followed.download();
        settle().await;

        assert!(following
            .lines()
            .contains(&"Asked to download 1.2.0".to_owned()));
        assert!(following.lines().contains(&"Failed: offline".to_owned()));
    }

    #[tokio::test(start_paused = true)]
    async fn asks_once_as_soon_as_it_starts() {
        let following = following(Answer::Nothing, Answer::Never, false);

        settle().await;

        assert_eq!(following.checks(), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn carries_on_checking_after_a_check_fails() {
        let following = following(Answer::Fails, Answer::Never, false);

        settle().await;
        wait(1000).await;

        assert_eq!(following.checks(), 2);
    }

    #[tokio::test(start_paused = true)]
    async fn does_not_check_while_a_download_is_running() {
        let following = following(Answer::Found, Answer::Never, false);

        settle().await;
        following.followed.download();
        settle().await;
        wait(1000).await;

        assert_eq!(following.checks(), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn looks_again_straight_away_when_asked_and_waits_the_full_time_again_from_there() {
        let following = following(Answer::Nothing, Answer::Never, false);

        settle().await;
        wait(600).await;
        following.followed.check_now();
        settle().await;

        assert_eq!(following.checks(), 2);

        wait(999).await;

        assert_eq!(following.checks(), 2);

        wait(1).await;

        assert_eq!(following.checks(), 3);
    }

    #[tokio::test(start_paused = true)]
    async fn asks_nothing_more_while_a_check_is_already_out() {
        let following = following(Answer::Never, Answer::Never, false);

        settle().await;
        following.followed.check_now();
        wait(5000).await;

        assert_eq!(following.checks(), 1);
    }

    #[tokio::test(start_paused = true)]
    async fn stops_checking_once_stopped() {
        let following = following(Answer::Nothing, Answer::Never, false);

        settle().await;
        following.followed.stop();
        wait(5000).await;

        assert_eq!(following.checks(), 1);
    }
}
