//! Music and audiobooks kept on this computer to listen to offline: fetching a song, an audiobook
//! track or a cover from the server to keep, stopping one, letting one go and asking whether one is
//! here, as `answerAboutListeningFiles` did.

use crate::held::folder::{how_much_is_there, remove_the_file};
use crate::held::keep_a_download::{keep_a_download, Fetching, Outcome, WhatToFetch};
use crate::held::words::say_it;
use crate::paths::listening_kept;
use crate::upstream::Upstream;
use reqwest::Method;
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, PoisonError};
use tauri::{Emitter, Manager, State};

/// The event the page hears how far a fetch has got on.
pub const LISTENING_PROGRESS: &str = "valence:listening-progress";

/// How far fetching one file has got.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListeningProgress {
    pub(crate) name: String,
    pub(crate) bytes: u64,
    pub(crate) of_bytes: Option<u64>,
}

/// Told how far each fetch has got.
type Telling = Arc<dyn Fn(ListeningProgress) + Send + Sync>;

/// The listening files this computer fetches and keeps.
pub struct Listening {
    folder: PathBuf,
    upstream: Upstream,
    tell: Telling,
    busy: Mutex<HashMap<String, Fetching>>,
}

impl Listening {
    /// Keeps listening files in a folder, fetching them from a server and telling how far each
    /// fetch has got.
    pub fn new(
        folder: PathBuf,
        upstream: Upstream,
        tell: impl Fn(ListeningProgress) + Send + Sync + 'static,
    ) -> Self {
        Self {
            folder,
            upstream,
            tell: Arc::new(tell),
            busy: Mutex::new(HashMap::new()),
        }
    }

    /// Fetches a file from the server to keep, leaving nothing behind where it did not all arrive.
    ///
    /// # Errors
    ///
    /// When the address is not on the server's api, the name could reach outside the folder, or
    /// the folder cannot be made.
    pub async fn fetch(&self, from: &str, name: &str) -> Result<Outcome, String> {
        let from = a_path_on_the_api(from)?;
        let name = a_file_name(name)?;

        let Some(asking) = self.upstream.request(Method::GET, from) else {
            return Ok(Outcome {
                bytes: 0,
                is_complete: false,
                failure: Some(say_it("common.noValenceHasBeenChosenYet", &[])),
            });
        };

        let onto = listening_kept(&self.folder, name);

        if let Some(folder) = onto.parent() {
            tokio::fs::create_dir_all(folder)
                .await
                .map_err(|problem| problem.to_string())?;
        }

        let tell = Arc::clone(&self.tell);
        let telling = name.to_owned();

        let fetching = keep_a_download(WhatToFetch {
            asking,
            onto: onto.clone(),
            already: 0,
            report: Box::new(move |progress| {
                tell(ListeningProgress {
                    name: telling.clone(),
                    bytes: progress.bytes,
                    of_bytes: progress.of_bytes,
                });
            }),
        });

        self.lock().insert(name.to_owned(), fetching.clone());

        let outcome = fetching.finished().await;

        self.lock().remove(name);

        if !outcome.is_complete {
            remove_the_file(&onto)
                .await
                .map_err(|problem| problem.to_string())?;
        }

        Ok(outcome)
    }

    /// Stops fetching a file, where it is being fetched.
    ///
    /// # Errors
    ///
    /// When the name could reach outside the folder.
    pub fn stop(&self, name: &str) -> Result<(), String> {
        let name = a_file_name(name)?;

        if let Some(fetching) = self.lock().get(name) {
            fetching.stop();
        }

        Ok(())
    }

    /// Lets a kept file go.
    ///
    /// # Errors
    ///
    /// When the name could reach outside the folder, or the file cannot be removed.
    pub async fn drop_one(&self, name: &str) -> Result<(), String> {
        let name = a_file_name(name)?;

        remove_the_file(&listening_kept(&self.folder, name))
            .await
            .map_err(|problem| problem.to_string())
    }

    /// Whether a file is here and holds something.
    ///
    /// # Errors
    ///
    /// When the name could reach outside the folder.
    pub async fn has(&self, name: &str) -> Result<bool, String> {
        let name = a_file_name(name)?;

        Ok(how_much_is_there(&listening_kept(&self.folder, name)).await > 0)
    }

    /// Takes the fetches under way, whatever another thread was doing when it panicked.
    fn lock(&self) -> std::sync::MutexGuard<'_, HashMap<String, Fetching>> {
        self.busy.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

/// Lets through a name as `KeptListeningFileSchema` does: lower-case letters, digits, dots and
/// dashes, not starting with a dot or a dash.
fn a_file_name(name: &str) -> Result<&str, String> {
    let is_plain = crate::serve::held_file::is_a_listening_name(name);

    if is_plain {
        Ok(name)
    } else {
        Err(String::from("not a listening file name"))
    }
}

/// Lets through only an address on the server's own api.
fn a_path_on_the_api(from: &str) -> Result<&str, String> {
    if from.starts_with("/api/") {
        Ok(from)
    } else {
        Err(String::from("not an address on the api"))
    }
}

/// Fetches a file to keep.
///
/// # Errors
///
/// When the address or the name is refused, or the folder cannot be made.
#[tauri::command]
pub async fn listening_fetch(
    from: String,
    name: String,
    listening: State<'_, Listening>,
) -> Result<Outcome, String> {
    listening.fetch(&from, &name).await
}

/// Stops fetching a file.
///
/// # Errors
///
/// When the name is refused.
#[tauri::command]
pub async fn listening_stop(name: String, listening: State<'_, Listening>) -> Result<(), String> {
    listening.stop(&name)
}

/// Removes a kept file.
///
/// # Errors
///
/// When the name is refused, or the file cannot be removed.
#[tauri::command]
pub async fn listening_drop(name: String, listening: State<'_, Listening>) -> Result<(), String> {
    listening.drop_one(&name).await
}

/// Whether a file is kept.
///
/// # Errors
///
/// When the name is refused.
#[tauri::command]
pub async fn listening_has(name: String, listening: State<'_, Listening>) -> Result<bool, String> {
    listening.has(&name).await
}

/// Gets listening files ready to be fetched, telling the page how far each fetch has got.
///
/// # Errors
///
/// When the upstream client was not set up first.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();

    app.manage(Listening::new(
        crate::paths::held_folder(),
        crate::upstream::upstream(&handle).ok_or("the upstream client was not set up first")?,
        move |progress| {
            let _ = handle.emit(LISTENING_PROGRESS, progress);
        },
    ));

    Ok(())
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    clippy::expect_used,
    reason = "a test that cannot set up should fail loudly"
)]
mod tests {
    use super::{Listening, ListeningProgress};
    use crate::held::keep_a_download::tests::{an_upstream, answer, arriving, serving};
    use crate::held::keep_a_download::Outcome;
    use axum::body::Body;
    use axum::extract::Request;
    use axum::response::Response;
    use axum::Router;
    use std::sync::{Arc, Mutex};
    use std::time::Duration;

    const NAME: &str = "track-one-high.m4a";

    const FROM: &str = "/api/music/tracks/one/stream?quality=high";

    struct Setting {
        listening: Arc<Listening>,
        asked: Arc<Mutex<Vec<String>>>,
        told: Arc<Mutex<Vec<ListeningProgress>>>,
        folder: tempfile::TempDir,
    }

    async fn answering_with(
        answering: impl Fn() -> Response + Clone + Send + Sync + 'static,
        has_a_server: bool,
    ) -> Setting {
        let folder = tempfile::tempdir().unwrap();
        let asked = Arc::new(Mutex::new(Vec::new()));
        let told = Arc::new(Mutex::new(Vec::new()));
        let seen = asked.clone();

        let server = serving(Router::new().fallback(move |request: Request| {
            let answering = answering.clone();
            let seen = seen.clone();
            async move {
                seen.lock().unwrap().push(request.uri().to_string());
                answering()
            }
        }))
        .await;

        let telling = told.clone();

        let listening = Listening::new(
            folder.path().to_path_buf(),
            an_upstream(has_a_server.then_some(server.as_str()), folder.path()),
            move |progress| telling.lock().unwrap().push(progress),
        );

        Setting {
            listening: Arc::new(listening),
            asked,
            told,
            folder,
        }
    }

    fn a_song() -> Response {
        answer(
            200,
            &[("content-length", "6".to_owned())],
            Body::from("a-song"),
        )
    }

    #[tokio::test]
    async fn fetches_a_song_into_the_listening_folder_and_says_it_finished() {
        let setting = answering_with(a_song, true).await;

        let outcome = setting.listening.fetch(FROM, NAME).await.unwrap();

        assert_eq!(
            outcome,
            Outcome {
                bytes: 6,
                is_complete: true,
                failure: None
            }
        );
        assert_eq!(
            std::fs::read_to_string(setting.folder.path().join("listening").join(NAME)).unwrap(),
            "a-song"
        );
    }

    #[tokio::test]
    async fn asks_the_server_in_use_for_the_file() {
        let setting = answering_with(a_song, true).await;

        setting.listening.fetch(FROM, NAME).await.unwrap();

        assert_eq!(*setting.asked.lock().unwrap(), vec![FROM.to_owned()]);
    }

    #[tokio::test]
    async fn says_no_server_has_been_chosen_rather_than_asking_nobody() {
        let setting = answering_with(a_song, false).await;

        let outcome = setting.listening.fetch(FROM, NAME).await.unwrap();

        assert_eq!(
            outcome,
            Outcome {
                bytes: 0,
                is_complete: false,
                failure: Some("No Valence server has been selected yet.".to_owned()),
            }
        );
        assert!(setting.asked.lock().unwrap().is_empty());
    }

    #[tokio::test]
    async fn tells_the_window_how_far_a_fetch_has_got_naming_the_file() {
        let setting = answering_with(
            || {
                answer(
                    200,
                    &[("content-length", "3".to_owned())],
                    arriving(
                        vec!["a".to_owned(), "b".to_owned(), "c".to_owned()],
                        Duration::from_millis(300),
                    ),
                )
            },
            true,
        )
        .await;

        setting.listening.fetch(FROM, NAME).await.unwrap();

        assert!(setting
            .told
            .lock()
            .unwrap()
            .iter()
            .any(|progress| progress.name == NAME && progress.of_bytes == Some(3)));
    }

    #[tokio::test]
    async fn leaves_nothing_on_the_disk_where_the_server_refused() {
        let setting = answering_with(|| answer(404, &[], Body::from("no")), true).await;

        let outcome = setting.listening.fetch(FROM, NAME).await.unwrap();

        assert_eq!(
            outcome,
            Outcome {
                bytes: 0,
                is_complete: false,
                failure: Some("The server responded with 404.".to_owned()),
            }
        );
        assert!(!setting.folder.path().join("listening").join(NAME).exists());
    }

    #[tokio::test]
    async fn refuses_a_name_that_could_climb_out_of_the_folder() {
        let setting = answering_with(a_song, true).await;

        assert!(setting
            .listening
            .fetch(FROM, "../escaped.m4a")
            .await
            .is_err());
        assert!(setting.listening.has("../escaped.m4a").await.is_err());
        assert!(setting.listening.drop_one("../escaped.m4a").await.is_err());
    }

    #[tokio::test]
    async fn refuses_to_fetch_from_anywhere_but_the_servers_own_api() {
        let setting = answering_with(a_song, true).await;

        assert!(setting
            .listening
            .fetch("https://elsewhere.example/a.m4a", NAME)
            .await
            .is_err());
        assert!(setting.asked.lock().unwrap().is_empty());
    }

    #[tokio::test]
    async fn stops_a_fetch_as_unfinished_rather_than_failed_and_lets_its_piece_go() {
        let setting = answering_with(
            || {
                answer(
                    200,
                    &[("content-length", "5".to_owned())],
                    arriving(
                        ["a", "b", "c", "d", "e"].map(str::to_owned).to_vec(),
                        Duration::from_millis(20),
                    ),
                )
            },
            true,
        )
        .await;

        let fetching = setting.listening.clone();
        let fetched = tokio::spawn(async move { fetching.fetch(FROM, NAME).await });

        tokio::time::sleep(Duration::from_millis(50)).await;
        setting.listening.stop(NAME).unwrap();

        let outcome = fetched.await.unwrap().unwrap();

        assert_eq!((outcome.is_complete, outcome.failure), (false, None));
        assert!(!setting.folder.path().join("listening").join(NAME).exists());
    }

    #[tokio::test]
    async fn stops_nothing_where_the_file_is_not_being_fetched() {
        let setting = answering_with(a_song, true).await;

        assert!(setting.listening.stop(NAME).is_ok());
    }

    #[tokio::test]
    async fn lets_a_kept_file_go() {
        let setting = answering_with(a_song, true).await;
        let kept = setting.folder.path().join("listening");
        std::fs::create_dir_all(&kept).unwrap();
        std::fs::write(kept.join(NAME), "a-song").unwrap();

        setting.listening.drop_one(NAME).await.unwrap();

        assert!(!kept.join(NAME).exists());
    }

    #[tokio::test]
    async fn says_a_file_is_here_only_when_it_holds_something() {
        let setting = answering_with(a_song, true).await;
        let kept = setting.folder.path().join("listening");
        std::fs::create_dir_all(&kept).unwrap();
        std::fs::write(kept.join(NAME), "a-song").unwrap();
        std::fs::write(kept.join("track-empty-high.m4a"), "").unwrap();

        assert_eq!(
            [
                setting.listening.has(NAME).await.unwrap(),
                setting.listening.has("track-empty-high.m4a").await.unwrap(),
                setting
                    .listening
                    .has("track-missing-high.m4a")
                    .await
                    .unwrap(),
            ],
            [true, false, false]
        );
    }
}
