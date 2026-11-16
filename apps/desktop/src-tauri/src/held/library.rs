//! Everything this computer holds, and everything it is in the middle of fetching: the transfers,
//! the index that describes them and the artwork beside them, as `theHeldLibrary` kept them.

use super::folder::{how_much_is_there, remove_the_file, remove_the_folder, KEPT_TRICKPLAY_INDEX};
use super::held_file::{HeldFile, HeldState, WhatToKeep};
use super::index::HeldIndex;
use super::keep_a_download::{keep_a_download, Fetching, Outcome, WhatToFetch};
use super::trickplay::trickplay_to_keep;
use super::words::say_it;
use crate::paths::{file_kept, poster_kept, trickplay_kept};
use crate::runtime::spawn;
use crate::upstream::Upstream;
use futures_util::future::{BoxFuture, FutureExt, Shared};
use reqwest::Method;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};

/// Told the whole list whenever anything held changes.
type Listener = Arc<dyn Fn(&[HeldFile]) + Send + Sync>;

/// The library of held files.
#[derive(Clone)]
pub struct HeldLibrary {
    inner: Arc<Inner>,
}

/// What the library keeps between calls.
struct Inner {
    folder: PathBuf,
    index: HeldIndex,
    upstream: Upstream,
    now: Box<dyn Fn() -> String + Send + Sync>,
    busy: Mutex<HashMap<String, Fetching>>,
    thumbnailing: Mutex<HashMap<String, Shared<BoxFuture<'static, bool>>>>,
    listeners: Mutex<Vec<Listener>>,
}

/// Takes what a mutex guards, whatever another thread was doing when it panicked.
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

impl HeldLibrary {
    /// Opens the library over a folder and an index, fetching from a server.
    pub fn new(
        folder: PathBuf,
        index: HeldIndex,
        upstream: Upstream,
        now: impl Fn() -> String + Send + Sync + 'static,
    ) -> Self {
        Self {
            inner: Arc::new(Inner {
                folder,
                index,
                upstream,
                now: Box::new(now),
                busy: Mutex::new(HashMap::new()),
                thumbnailing: Mutex::new(HashMap::new()),
                listeners: Mutex::new(Vec::new()),
            }),
        }
    }

    /// Everything held, forgetting what was here and whose file has since vanished.
    pub async fn all(&self) -> Vec<HeldFile> {
        self.inner.all().await
    }

    /// Starts keeping something, unless it is already here or already arriving.
    ///
    /// # Errors
    ///
    /// When the held folder cannot be made.
    pub async fn keep(&self, what: WhatToKeep) -> std::io::Result<()> {
        let inner = &self.inner;

        if inner.is_busy(&what.download_id) {
            return Ok(());
        }

        let already = inner.index.read(&what.download_id);

        if already
            .as_ref()
            .is_some_and(|row| row.state == HeldState::Here)
        {
            return Ok(());
        }

        tokio::fs::create_dir_all(&inner.folder).await?;

        let on_disk = how_much_is_there(&file_kept(&inner.folder, &what.download_id)).await;

        let row = HeldFile {
            what,
            state: HeldState::Fetching,
            bytes: on_disk,
            bytes_per_second: None,
            failure: None,
            kept_at: already
                .as_ref()
                .map_or_else(|| (inner.now)(), |row| row.kept_at.clone()),
            has_poster: already.as_ref().is_some_and(|row| row.has_poster),
            has_trickplay: already.as_ref().is_some_and(|row| row.has_trickplay),
        };

        inner.index.write(&row);
        Inner::start(inner, row);
        inner.announce().await;

        Ok(())
    }

    /// Stops keeping something and takes its files with it.
    ///
    /// # Errors
    ///
    /// When a file is there and cannot be removed.
    pub async fn let_go(&self, download_id: &str) -> std::io::Result<()> {
        let inner = &self.inner;
        let fetching = lock(&inner.busy).get(download_id).cloned();

        if let Some(fetching) = fetching {
            fetching.stop();
            fetching.finished().await;
        }

        inner.index.forget(download_id);

        remove_the_file(&file_kept(&inner.folder, download_id)).await?;
        remove_the_file(&poster_kept(&inner.folder, download_id)).await?;
        remove_the_folder(&trickplay_kept(&inner.folder, download_id)).await?;

        inner.announce().await;

        Ok(())
    }

    /// Pauses a transfer, or sets a paused or failed one going again from what is on the disk.
    pub async fn pause(&self, download_id: &str, is_paused: bool) {
        let inner = &self.inner;

        if is_paused {
            if let Some(fetching) = lock(&inner.busy).get(download_id) {
                fetching.stop();
            }

            return;
        }

        let Some(row) = inner.index.read(download_id) else {
            return;
        };

        if inner.is_busy(download_id) || row.state == HeldState::Here {
            return;
        }

        inner.go_again(row).await;
        inner.announce().await;
    }

    /// Sets going again everything that was interrupted rather than paused, then fills in the
    /// thumbnails of films kept before the server had made them.
    pub async fn carry_on_where_it_left_off(&self) {
        let inner = &self.inner;

        for row in inner.index.all() {
            if inner.is_busy(row.download_id())
                || row.state == HeldState::Here
                || row.state == HeldState::Paused
            {
                continue;
            }

            inner.go_again(row).await;
        }

        inner.announce().await;

        spawn(Inner::fill_in_the_thumbnails(Arc::clone(inner)));
    }

    /// Tells a listener the whole list whenever anything held changes.
    pub fn when_changed(&self, listener: impl Fn(&[HeldFile]) + Send + Sync + 'static) {
        lock(&self.inner.listeners).push(Arc::new(listener));
    }
}

impl Inner {
    /// Whether a transfer for this download is under way.
    fn is_busy(&self, download_id: &str) -> bool {
        lock(&self.busy).contains_key(download_id)
    }

    /// Everything held, forgetting what was here and whose file has since vanished.
    async fn all(&self) -> Vec<HeldFile> {
        let mut checked = Vec::new();

        for row in self.index.all() {
            if row.state == HeldState::Here
                && how_much_is_there(&file_kept(&self.folder, row.download_id())).await == 0
            {
                self.index.forget(row.download_id());
                continue;
            }

            checked.push(row);
        }

        checked
    }

    /// Tells every listener the whole list.
    async fn announce(&self) {
        let held = self.all().await;
        let listeners = lock(&self.listeners).clone();

        for listener in listeners {
            listener(&held);
        }
    }

    /// Notes a row as fetching again and starts it from what is on the disk.
    async fn go_again(self: &Arc<Self>, row: HeldFile) {
        self.index.change(row.download_id(), |current| {
            current.state = HeldState::Fetching;
            current.failure = None;
        });

        let bytes = how_much_is_there(&file_kept(&self.folder, row.download_id())).await;

        Self::start(
            self,
            HeldFile {
                state: HeldState::Fetching,
                bytes,
                ..row
            },
        );
    }

    /// Starts the transfer for a row, unless one for it is already under way, and settles the row
    /// when it ends.
    fn start(this: &Arc<Self>, row: HeldFile) {
        let download_id = row.download_id().to_owned();
        let mut busy = lock(&this.busy);

        if busy.contains_key(&download_id) {
            return;
        }

        let Some(asking) = this
            .upstream
            .request(Method::GET, &format!("/api/downloads/{download_id}/file"))
        else {
            drop(busy);
            this.index.change(&download_id, |current| {
                current.state = HeldState::Failed;
                current.failure = Some(say_it("common.noValenceHasBeenChosenYet", &[]));
            });
            return;
        };

        let reporting = Arc::clone(this);
        let reported = download_id.clone();

        let fetching = keep_a_download(WhatToFetch {
            asking,
            onto: file_kept(&this.folder, &download_id),
            already: row.bytes,
            report: Box::new(move |progress| {
                reporting.index.change(&reported, |current| {
                    current.bytes = progress.bytes;
                    current.bytes_per_second = Some(progress.bytes_per_second);

                    if let Some(of_bytes) = progress.of_bytes {
                        current.what.of_bytes = Some(of_bytes);
                    }
                });

                let announcing = Arc::clone(&reporting);
                spawn(async move { announcing.announce().await });
            }),
        });

        busy.insert(download_id, fetching.clone());
        drop(busy);

        let settling = Arc::clone(this);

        spawn(async move {
            let outcome = fetching.finished().await;
            settling.settle(row, outcome).await;
        });
    }

    /// Records how a transfer ended, fetching the artwork beside a film that arrived whole.
    async fn settle(self: Arc<Self>, row: HeldFile, outcome: Outcome) {
        lock(&self.busy).remove(row.download_id());

        if self.index.read(row.download_id()).is_none() {
            return;
        }

        let has_poster = if outcome.is_complete {
            self.fetch_the_poster(&row).await
        } else {
            row.has_poster
        };

        let has_trickplay = if outcome.is_complete {
            Self::fetch_the_trickplay(&self, row.clone()).await
        } else {
            row.has_trickplay
        };

        self.index.change(row.download_id(), |current| {
            current.bytes = outcome.bytes;
            current.bytes_per_second = None;
            current.has_poster = has_poster;
            current.has_trickplay = has_trickplay;

            if outcome.is_complete {
                current.state = HeldState::Here;
                current.failure = None;
            } else if let Some(failure) = outcome.failure {
                current.state = HeldState::Failed;
                current.failure = Some(failure);
            } else {
                current.state = HeldState::Paused;
            }
        });

        self.announce().await;
    }

    /// Fetches the poster beside a film, and says whether there is one to draw.
    async fn fetch_the_poster(&self, row: &HeldFile) -> bool {
        let Some(asking) = self.upstream.request(
            Method::GET,
            &format!("/api/media/{}/image/poster", row.what.media_id),
        ) else {
            return row.has_poster;
        };

        let image = match self.upstream.send(asking).await {
            Ok(answer) if answer.status().is_success() => answer.bytes().await,
            _ => return row.has_poster,
        };

        let Ok(image) = image else {
            return row.has_poster;
        };

        tokio::fs::write(poster_kept(&self.folder, row.download_id()), image)
            .await
            .map_or(row.has_poster, |()| true)
    }

    /// Fetches a film's scrubbing thumbnails, sharing a fetch already under way for the same film.
    async fn fetch_the_trickplay(this: &Arc<Self>, row: HeldFile) -> bool {
        let download_id = row.download_id().to_owned();

        let shared = {
            let mut thumbnailing = lock(&this.thumbnailing);

            if let Some(already) = thumbnailing.get(&download_id) {
                already.clone()
            } else {
                let fetching = Arc::clone(this);
                let forgetting = download_id.clone();
                let started = async move {
                    let kept = fetching.fetch_the_sheets(&row).await;
                    lock(&fetching.thumbnailing).remove(&forgetting);
                    kept
                }
                .boxed()
                .shared();

                thumbnailing.insert(download_id, started.clone());
                started
            }
        };

        shared.await
    }

    /// Fetches the thumbnail index and every sheet it names, keeping all of them or none.
    async fn fetch_the_sheets(&self, row: &HeldFile) -> bool {
        if self.upstream.server_address().is_none() {
            return row.has_trickplay;
        }

        let Some(wanted) = trickplay_to_keep(&self.upstream, &row.what.media_id).await else {
            return row.has_trickplay;
        };

        let kept = trickplay_kept(&self.folder, row.download_id());

        let keeping = async {
            tokio::fs::create_dir_all(&kept).await.ok()?;
            tokio::fs::write(kept.join(KEPT_TRICKPLAY_INDEX), &wanted.vtt)
                .await
                .ok()?;

            for sheet in &wanted.sheets {
                let asking = self.upstream.request(Method::GET, &sheet.from)?;
                let answer = self.upstream.send(asking).await.ok()?;

                if !answer.status().is_success() {
                    return None;
                }

                let image = answer.bytes().await.ok()?;
                tokio::fs::write(kept.join(&sheet.name), image).await.ok()?;
            }

            self.index.read(row.download_id()).map(|_| ())
        };

        if keeping.await.is_some() {
            return true;
        }

        let _ = remove_the_folder(&kept).await;

        false
    }

    /// Fetches the thumbnails of films kept before the server had made them, one at a time.
    async fn fill_in_the_thumbnails(this: Arc<Self>) {
        for row in this.index.all() {
            let still_wanted = this
                .index
                .read(row.download_id())
                .is_some_and(|current| current.state == HeldState::Here && !current.has_trickplay);

            if !still_wanted || this.is_busy(row.download_id()) {
                continue;
            }

            if Self::fetch_the_trickplay(&this, row.clone()).await {
                this.index
                    .change(row.download_id(), |current| current.has_trickplay = true);
                this.announce().await;
            }
        }
    }
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    clippy::expect_used,
    reason = "a test that cannot set up should fail loudly"
)]
mod tests {
    use super::HeldLibrary;
    use crate::held::held_file::{HeldFile, HeldState, WhatToKeep};
    use crate::held::index::{HeldIndex, HELD_INDEX_FILE};
    use crate::held::keep_a_download::tests::{an_upstream, answer, arriving, serving as serve};
    use crate::paths::poster_kept;
    use axum::body::Body;
    use axum::extract::Request;
    use axum::response::Response;
    use axum::Router;
    use futures_util::future::BoxFuture;
    use futures_util::FutureExt;
    use serde_json::json;
    use std::future::Future;
    use std::path::{Path, PathBuf};
    use std::sync::{Arc, Mutex};
    use std::time::Duration;

    const DOWNLOAD: &str = "2b2b7f7e-2f0e-4a5e-9c2f-2b9b1e1f0a11";

    const INDEX: &str = "/api/playback/trickplay/t1/thumbnails.vtt";

    const VTT: &str = "WEBVTT\n\n00:00:00.000 --> 00:00:10.000\nsheet-001.jpg#xywh=0,0,320,180\n\n00:16:40.000 --> 00:16:50.000\nsheet-002.jpg#xywh=0,0,320,180";

    type Hook = Arc<dyn Fn() -> BoxFuture<'static, ()> + Send + Sync>;

    #[derive(Clone, Copy, PartialEq, Eq)]
    enum Trickplay {
        NotYet,
        Made,
        MissingASheet,
        Hangs,
    }

    #[derive(Clone)]
    struct Serving {
        film: String,
        status: u16,
        has_a_poster: bool,
        pause_for: Duration,
        trickplay: Trickplay,
        while_sheets_arrive: Option<Hook>,
    }

    impl Default for Serving {
        fn default() -> Self {
            Self {
                film: String::from("hello world"),
                status: 200,
                has_a_poster: true,
                pause_for: Duration::ZERO,
                trickplay: Trickplay::NotYet,
                while_sheets_arrive: None,
            }
        }
    }

    struct Setting {
        library: HeldLibrary,
        serving: Arc<Mutex<Serving>>,
        seen: Arc<Mutex<Vec<String>>>,
        folder: tempfile::TempDir,
        index_file: PathBuf,
        _kept: tempfile::TempDir,
    }

    impl Setting {
        fn held(&self) -> &Path {
            self.folder.path()
        }

        fn rows(&self) -> Vec<HeldFile> {
            HeldIndex::open(self.index_file.clone()).all()
        }

        fn row(&self, download_id: &str) -> Option<HeldFile> {
            HeldIndex::open(self.index_file.clone()).read(download_id)
        }

        fn asked(&self) -> Vec<String> {
            self.seen.lock().unwrap().clone()
        }

        async fn settle(&self) {
            for _ in 0..800 {
                if self
                    .rows()
                    .iter()
                    .all(|row| row.state != HeldState::Fetching)
                {
                    tokio::time::sleep(Duration::from_millis(10)).await;
                    return;
                }

                tokio::time::sleep(Duration::from_millis(5)).await;
            }

            panic!("the library was still fetching after four seconds");
        }
    }

    async fn eventually<F: Future<Output = bool>>(condition: impl Fn() -> F) -> bool {
        for _ in 0..500 {
            if condition().await {
                return true;
            }

            tokio::time::sleep(Duration::from_millis(10)).await;
        }

        false
    }

    fn asked() -> WhatToKeep {
        WhatToKeep::from_value(json!({
            "downloadId": DOWNLOAD,
            "mediaId": "9c858901-8a57-4791-81fe-4c455b099bc9",
            "seriesId": null,
            "seriesTitle": null,
            "title": "The Third Man",
            "quality": "original",
            "durationSeconds": 5940,
            "ofBytes": 11
        }))
        .unwrap()
    }

    fn held_row(download_id: &str, state: HeldState, bytes: u64) -> HeldFile {
        let mut what = asked();
        what.download_id = download_id.to_owned();

        HeldFile {
            what,
            state,
            bytes,
            bytes_per_second: None,
            failure: None,
            kept_at: String::from("2026-08-22T00:00:00.000Z"),
            has_poster: state == HeldState::Here,
            has_trickplay: false,
        }
    }

    async fn answering(serving: Arc<Mutex<Serving>>, request: Request) -> Response {
        let path = request.uri().path().to_owned();
        let range = request
            .headers()
            .get("range")
            .and_then(|range| range.to_str().ok())
            .and_then(|range| range.strip_prefix("bytes="))
            .and_then(|range| range.strip_suffix('-'))
            .and_then(|from| from.parse::<usize>().ok())
            .unwrap_or(0);
        let now = serving.lock().unwrap().clone();

        if path.ends_with("/trickplay") {
            return match now.trickplay {
                Trickplay::Hangs => std::future::pending().await,
                Trickplay::NotYet => answer(404, &[], Body::from("not yet")),
                Trickplay::Made | Trickplay::MissingASheet => answer(
                    200,
                    &[("content-type", "application/json".to_owned())],
                    Body::from(
                        json!({
                            "id": "t1",
                            "url": INDEX,
                            "intervalSeconds": 10,
                            "tileWidth": 320,
                            "tileHeight": 180
                        })
                        .to_string(),
                    ),
                ),
            };
        }

        if path == INDEX {
            return answer(200, &[], Body::from(VTT));
        }

        if path.starts_with("/api/playback/trickplay/t1/") {
            if let Some(hook) = now.while_sheets_arrive {
                hook().await;
            }

            return if now.trickplay == Trickplay::MissingASheet && path.ends_with("sheet-002.jpg") {
                answer(404, &[], Body::from("gone"))
            } else {
                answer(200, &[], Body::from("a-sheet"))
            };
        }

        if path.contains("/image/poster") {
            return if now.has_a_poster {
                answer(200, &[], Body::from("an-image"))
            } else {
                answer(404, &[], Body::from("gone"))
            };
        }

        if now.status != 200 {
            return answer(now.status, &[], Body::from("no"));
        }

        let film = now.film;
        let letters: Vec<String> = film[range..].chars().map(String::from).collect();

        if range > 0 {
            answer(
                206,
                &[(
                    "content-range",
                    format!("bytes {range}-{}/{}", film.len() - 1, film.len()),
                )],
                arriving(letters, now.pause_for),
            )
        } else {
            answer(
                200,
                &[("content-length", film.len().to_string())],
                arriving(letters, now.pause_for),
            )
        }
    }

    async fn a_library(serving: Serving, rows: &[HeldFile], has_a_server: bool) -> Setting {
        let folder = tempfile::tempdir().unwrap();
        let kept = tempfile::tempdir().unwrap();
        let index_file = kept.path().join(HELD_INDEX_FILE);
        let serving = Arc::new(Mutex::new(serving));
        let seen = Arc::new(Mutex::new(Vec::new()));
        let answering_with = serving.clone();
        let seeing = seen.clone();

        let server = serve(Router::new().fallback(move |request: Request| {
            let serving = answering_with.clone();
            seeing.lock().unwrap().push(request.uri().path().to_owned());
            answering(serving, request)
        }))
        .await;

        let index = HeldIndex::open(index_file.clone());

        for row in rows {
            index.write(row);
        }

        let library = HeldLibrary::new(
            folder.path().to_path_buf(),
            index,
            an_upstream(has_a_server.then_some(server.as_str()), kept.path()),
            || String::from("2026-08-22T00:00:00.000Z"),
        );

        Setting {
            library,
            serving,
            seen,
            folder,
            index_file,
            _kept: kept,
        }
    }

    #[tokio::test]
    async fn puts_a_film_on_the_disk_and_says_it_is_here() {
        let setting = a_library(Serving::default(), &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;

        assert_eq!(held.first().map(|row| row.state), Some(HeldState::Here));
        assert_eq!(
            std::fs::read_to_string(setting.held().join(format!("{DOWNLOAD}.mp4"))).unwrap(),
            "hello world"
        );
    }

    #[tokio::test]
    async fn fetches_the_artwork_beside_it() {
        let setting = a_library(Serving::default(), &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;

        assert_eq!(held.first().map(|row| row.has_poster), Some(true));
        assert!(setting.held().join(format!("{DOWNLOAD}.jpg")).exists());
    }

    #[tokio::test]
    async fn keeps_the_film_even_where_the_artwork_could_not_be_fetched() {
        let serving = Serving {
            has_a_poster: false,
            ..Serving::default()
        };
        let setting = a_library(serving, &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;

        assert_eq!(
            held.first().map(|row| (row.state, row.has_poster)),
            Some((HeldState::Here, false))
        );
    }

    #[tokio::test]
    async fn keeps_the_film_even_where_the_artwork_could_not_be_written_down() {
        let setting = a_library(Serving::default(), &[], true).await;
        std::fs::create_dir_all(setting.held().join(format!("{DOWNLOAD}.jpg"))).unwrap();

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;

        assert_eq!(
            held.first().map(|row| (row.state, row.has_poster)),
            Some((HeldState::Here, false))
        );
    }

    #[tokio::test]
    async fn keeps_the_thumbnails_beside_it_for_scrubbing_without_the_server() {
        let serving = Serving {
            trickplay: Trickplay::Made,
            ..Serving::default()
        };
        let setting = a_library(serving, &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;
        let kept = setting.held().join(format!("{DOWNLOAD}.trickplay"));

        assert_eq!(held.first().map(|row| row.has_trickplay), Some(true));
        assert_eq!(
            std::fs::read_to_string(kept.join("thumbnails.vtt")).unwrap(),
            VTT
        );
        assert_eq!(
            std::fs::read_to_string(kept.join("sheet-002.jpg")).unwrap(),
            "a-sheet"
        );
    }

    #[tokio::test]
    async fn keeps_the_film_while_the_server_has_not_made_its_thumbnails_yet() {
        let setting = a_library(Serving::default(), &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;

        assert_eq!(
            held.first().map(|row| (row.state, row.has_trickplay)),
            Some((HeldState::Here, false))
        );
    }

    #[tokio::test]
    async fn picks_the_thumbnails_up_once_the_server_has_made_them() {
        let setting = a_library(Serving::default(), &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        setting.serving.lock().unwrap().trickplay = Trickplay::Made;
        setting.library.carry_on_where_it_left_off().await;

        assert!(
            eventually(|| async {
                setting
                    .library
                    .all()
                    .await
                    .first()
                    .is_some_and(|row| row.has_trickplay)
            })
            .await
        );
    }

    #[tokio::test]
    async fn sets_an_interrupted_film_going_again_before_asking_after_thumbnails() {
        let serving = Serving {
            trickplay: Trickplay::Hangs,
            ..Serving::default()
        };
        let here = held_row("3c3c7f7e-2f0e-4a5e-9c2f-2b9b1e1f0a12", HeldState::Here, 11);
        let interrupted = held_row(DOWNLOAD, HeldState::Fetching, 0);
        let setting = a_library(serving, &[here.clone(), interrupted], true).await;
        std::fs::write(
            setting.held().join(format!("{}.mp4", here.download_id())),
            "hello world",
        )
        .unwrap();

        setting.library.carry_on_where_it_left_off().await;

        assert!(
            eventually(|| async {
                setting
                    .asked()
                    .iter()
                    .any(|address| address.contains(&format!("/api/downloads/{DOWNLOAD}/file")))
            })
            .await
        );
        assert!(eventually(|| async { poster_kept(setting.held(), DOWNLOAD).exists() }).await);
    }

    #[tokio::test]
    async fn asks_once_for_a_films_thumbnails_however_many_times_it_is_told_to_look() {
        let setting = a_library(Serving::default(), &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        setting.serving.lock().unwrap().trickplay = Trickplay::Made;
        futures_util::join!(
            setting.library.carry_on_where_it_left_off(),
            setting.library.carry_on_where_it_left_off()
        );

        assert!(
            eventually(|| async {
                setting
                    .library
                    .all()
                    .await
                    .first()
                    .is_some_and(|row| row.has_trickplay)
            })
            .await
        );
        tokio::time::sleep(Duration::from_millis(50)).await;
        assert_eq!(
            setting
                .asked()
                .iter()
                .filter(|address| address.ends_with(INDEX))
                .count(),
            1
        );
    }

    #[tokio::test]
    async fn keeps_no_thumbnails_for_a_film_forgotten_while_they_were_being_fetched() {
        let serving = Serving {
            trickplay: Trickplay::Made,
            ..Serving::default()
        };
        let setting = a_library(serving, &[], true).await;
        let forgetting = setting.library.clone();
        let is_forgotten = Arc::new(Mutex::new(false));
        let was_forgotten = is_forgotten.clone();

        setting.serving.lock().unwrap().while_sheets_arrive = Some(Arc::new(move || {
            let forgetting = forgetting.clone();
            let is_forgotten = is_forgotten.clone();
            async move {
                let first = !std::mem::replace(&mut *is_forgotten.lock().unwrap(), true);

                if first {
                    forgetting.let_go(DOWNLOAD).await.unwrap();
                }
            }
            .boxed()
        }));

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let trickplay = setting.held().join(format!("{DOWNLOAD}.trickplay"));

        assert!(
            eventually(|| async { *was_forgotten.lock().unwrap() && !trickplay.exists() }).await
        );
        tokio::time::sleep(Duration::from_millis(100)).await;
        assert!(!trickplay.exists());
        assert!(setting.library.all().await.is_empty());
    }

    #[tokio::test]
    async fn keeps_all_the_thumbnails_or_none() {
        let serving = Serving {
            trickplay: Trickplay::MissingASheet,
            ..Serving::default()
        };
        let setting = a_library(serving, &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;

        assert_eq!(held.first().map(|row| row.has_trickplay), Some(false));
        assert!(!setting
            .held()
            .join(format!("{DOWNLOAD}.trickplay"))
            .exists());
    }

    #[tokio::test]
    async fn stops_offering_something_whose_file_somebody_deleted() {
        let setting = a_library(Serving::default(), &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;
        std::fs::remove_file(setting.held().join(format!("{DOWNLOAD}.mp4"))).unwrap();

        assert!(setting.library.all().await.is_empty());
    }

    #[tokio::test]
    async fn does_not_fetch_a_second_copy_of_something_already_here() {
        let setting = a_library(Serving::default(), &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let as_far_as = setting.asked().len();

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        assert_eq!(setting.asked().len(), as_far_as);
    }

    #[tokio::test]
    async fn leaves_a_paused_transfer_saying_so_with_what_arrived_still_on_the_disk() {
        let serving = Serving {
            film: String::from("abcdefghijklmnop"),
            pause_for: Duration::from_millis(15),
            ..Serving::default()
        };
        let setting = a_library(serving, &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        tokio::time::sleep(Duration::from_millis(60)).await;
        setting.library.pause(DOWNLOAD, true).await;
        setting.settle().await;

        let held = setting.library.all().await;
        let paused = held.first().unwrap();

        assert_eq!(paused.state, HeldState::Paused);
        assert!(paused.bytes > 0 && paused.bytes < 16);
    }

    #[tokio::test]
    async fn asks_only_for_the_rest_when_it_carries_on() {
        let serving = Serving {
            film: String::from("abcdefghijklmnop"),
            pause_for: Duration::from_millis(15),
            ..Serving::default()
        };
        let setting = a_library(serving, &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        tokio::time::sleep(Duration::from_millis(60)).await;
        setting.library.pause(DOWNLOAD, true).await;
        setting.settle().await;

        let stopped = setting.row(DOWNLOAD).map_or(0, |row| row.bytes);

        setting.library.pause(DOWNLOAD, false).await;
        setting.settle().await;

        assert!(stopped > 0);
        assert_eq!(
            std::fs::read_to_string(setting.held().join(format!("{DOWNLOAD}.mp4"))).unwrap(),
            "abcdefghijklmnop"
        );
    }

    #[tokio::test]
    async fn takes_the_thumbnails_with_it_when_a_download_is_forgotten() {
        let serving = Serving {
            trickplay: Trickplay::Made,
            ..Serving::default()
        };
        let setting = a_library(serving, &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;
        setting.library.let_go(DOWNLOAD).await.unwrap();

        assert!(!setting
            .held()
            .join(format!("{DOWNLOAD}.trickplay"))
            .exists());
    }

    #[tokio::test]
    async fn forgets_a_download_and_takes_its_file_with_it() {
        let setting = a_library(Serving::default(), &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;
        setting.library.let_go(DOWNLOAD).await.unwrap();

        assert!(setting.library.all().await.is_empty());
        assert!(!setting.held().join(format!("{DOWNLOAD}.mp4")).exists());
        assert!(!setting.held().join(format!("{DOWNLOAD}.jpg")).exists());
    }

    #[tokio::test]
    async fn says_why_something_failed_rather_than_losing_it() {
        let serving = Serving {
            status: 503,
            ..Serving::default()
        };
        let setting = a_library(serving, &[], true).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;

        assert_eq!(
            held.first().map(|row| (row.state, row.failure.clone())),
            Some((
                HeldState::Failed,
                Some(String::from("The server responded with 503."))
            ))
        );
    }

    #[tokio::test]
    async fn refuses_to_invent_a_server_that_was_never_chosen() {
        let setting = a_library(Serving::default(), &[], false).await;

        setting.library.keep(asked()).await.unwrap();
        setting.settle().await;

        let held = setting.library.all().await;

        assert_eq!(
            held.first().map(|row| (row.state, row.failure.clone())),
            Some((
                HeldState::Failed,
                Some(String::from("No Valence server has been selected yet."))
            ))
        );
    }

    #[tokio::test]
    async fn picks_an_interrupted_transfer_back_up_and_leaves_a_paused_one_paused() {
        let interrupted = "11111111-1111-4111-8111-111111111111";
        let paused = "22222222-2222-4222-8222-222222222222";
        let setting = a_library(
            Serving::default(),
            &[
                held_row(interrupted, HeldState::Fetching, 0),
                held_row(paused, HeldState::Paused, 4),
            ],
            true,
        )
        .await;

        setting.library.carry_on_where_it_left_off().await;
        setting.settle().await;

        assert_eq!(
            setting.row(interrupted).map(|row| row.state),
            Some(HeldState::Here)
        );
        assert_eq!(
            setting.row(paused).map(|row| row.state),
            Some(HeldState::Paused)
        );
    }

    #[tokio::test]
    async fn tells_whoever_is_listening_when_something_changes() {
        let setting = a_library(Serving::default(), &[], true).await;
        let told = Arc::new(Mutex::new(Vec::<Vec<HeldFile>>::new()));
        let telling = told.clone();

        setting
            .library
            .when_changed(move |held| telling.lock().unwrap().push(held.to_vec()));
        setting.library.keep(asked()).await.unwrap();

        assert!(
            eventually(|| async {
                told.lock()
                    .unwrap()
                    .last()
                    .and_then(|held| held.first())
                    .is_some_and(|row| row.state == HeldState::Here)
            })
            .await
        );
    }
}
