//! Fetches a prepared file to the disk, can be stopped, and picks up where it stopped.

use super::words::say_it;
use futures_util::future::{BoxFuture, FutureExt, Shared};
use reqwest::header::{HeaderMap, CONTENT_LENGTH, CONTENT_RANGE, RANGE};
use reqwest::{RequestBuilder, StatusCode};
use serde::Serialize;
use std::path::PathBuf;
use std::time::{Duration, Instant};
use tokio::io::{AsyncWriteExt, BufWriter};
use tokio_util::sync::CancellationToken;

/// How often progress is reported while a file arrives.
pub const EVERY: Duration = Duration::from_millis(500);

/// How far a transfer has got.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Progress {
    pub(crate) bytes: u64,
    pub(crate) of_bytes: Option<u64>,
    pub(crate) bytes_per_second: u64,
}

/// How a transfer ended.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Outcome {
    pub(crate) bytes: u64,
    pub(crate) is_complete: bool,
    pub(crate) failure: Option<String>,
}

/// What to fetch, where to put it, how much is already there, and who to tell how it goes.
pub struct WhatToFetch {
    pub(crate) asking: RequestBuilder,
    pub(crate) onto: PathBuf,
    pub(crate) already: u64,
    pub(crate) report: Box<dyn Fn(Progress) + Send + Sync>,
}

/// A transfer under way: a way to stop it, and how it went.
#[derive(Clone)]
pub struct Fetching {
    stopper: CancellationToken,
    finished: Shared<BoxFuture<'static, Outcome>>,
}

impl Fetching {
    /// Stops the transfer, keeping what arrived.
    pub fn stop(&self) {
        self.stopper.cancel();
    }

    /// Waits for the transfer to end, and says how it went.
    pub async fn finished(&self) -> Outcome {
        self.finished.clone().await
    }
}

/// Starts fetching a file to the disk, asking only for the rest where some is there already.
#[must_use]
pub fn keep_a_download(asked: WhatToFetch) -> Fetching {
    let stopper = CancellationToken::new();
    let already = asked.already;
    let running = crate::runtime::spawn(run(asked, stopper.clone()));
    let finished = async move {
        running.await.unwrap_or_else(|_| Outcome {
            bytes: already,
            is_complete: false,
            failure: Some(say_it(
                "desktop.main.theHeldLibrary.thisClientCouldNotFinishKeeping",
                &[],
            )),
        })
    }
    .boxed()
    .shared();

    Fetching { stopper, finished }
}

/// How big the whole file is, from an answer that may be only part of it.
fn how_big(headers: &HeaderMap, already: u64, starting_over: bool) -> Option<u64> {
    let whole = headers
        .get(CONTENT_RANGE)
        .and_then(|range| range.to_str().ok())
        .and_then(|range| range.rsplit_once('/'))
        .map(|(_, total)| total.trim_end())
        .filter(|total| !total.is_empty() && total.bytes().all(|digit| digit.is_ascii_digit()))
        .and_then(|total| total.parse().ok());

    if whole.is_some() {
        return whole;
    }

    headers
        .get(CONTENT_LENGTH)
        .and_then(|length| length.to_str().ok())
        .and_then(|length| length.trim().parse::<u64>().ok())
        .map(|length| if starting_over { 0 } else { already } + length)
}

/// A transfer that ended before all of it arrived, having got so far, and why where it failed.
fn unfinished(bytes: u64, failure: Option<String>) -> Outcome {
    Outcome {
        bytes,
        is_complete: false,
        failure,
    }
}

/// Asks for the file, or for the rest of it, and hands back an answer that is sending one.
async fn ask(
    asking: RequestBuilder,
    already: u64,
    stopper: &CancellationToken,
) -> Result<reqwest::Response, Outcome> {
    let asking = if already > 0 {
        asking.header(RANGE, format!("bytes={already}-"))
    } else {
        asking
    };

    let answer = tokio::select! {
        biased;
        () = stopper.cancelled() => return Err(unfinished(already, None)),
        answer = asking.send() => answer,
    };

    let answer = answer.map_err(|problem| unfinished(already, Some(problem.to_string())))?;
    let status = answer.status();

    if !status.is_success() {
        return Err(unfinished(
            already,
            Some(say_it(
                "common.theServerAnsweredStatus",
                &[("status", status.as_u16().to_string())],
            )),
        ));
    }

    if status == StatusCode::NO_CONTENT || status == StatusCode::RESET_CONTENT {
        return Err(unfinished(
            already,
            Some(say_it(
                "desktop.main.keepADownload.theServerSentNoFile",
                &[],
            )),
        ));
    }

    Ok(answer)
}

/// Fetches the file, ending when it has all arrived, something went wrong, or it was stopped.
async fn run(asked: WhatToFetch, stopper: CancellationToken) -> Outcome {
    let mut answer = match ask(asked.asking, asked.already, &stopper).await {
        Ok(answer) => answer,
        Err(outcome) => return outcome,
    };

    let status = answer.status();

    let starting_over = asked.already > 0 && status != StatusCode::PARTIAL_CONTENT;
    let mut bytes = if starting_over { 0 } else { asked.already };
    let whole = how_big(answer.headers(), asked.already, starting_over);

    let opened = tokio::fs::OpenOptions::new()
        .create(true)
        .append(bytes > 0)
        .write(true)
        .truncate(bytes == 0)
        .open(&asked.onto)
        .await;

    let mut onto = match opened {
        Ok(file) => BufWriter::with_capacity(256 * 1024, file),
        Err(problem) => return unfinished(bytes, Some(problem.to_string())),
    };

    let mut told_at = Instant::now();
    let mut told_about = bytes;

    loop {
        let piece = tokio::select! {
            biased;
            () = stopper.cancelled() => {
                let _ = onto.flush().await;
                return unfinished(bytes, None);
            }
            piece = answer.chunk() => piece,
        };

        let piece = match piece {
            Ok(Some(piece)) => piece,
            Ok(None) => break,
            Err(problem) => {
                let _ = onto.flush().await;
                return unfinished(
                    bytes,
                    (!stopper.is_cancelled()).then(|| problem.to_string()),
                );
            }
        };

        if let Err(problem) = onto.write_all(&piece).await {
            let _ = onto.flush().await;
            return unfinished(bytes, Some(problem.to_string()));
        }

        bytes += piece.len() as u64;

        let since = told_at.elapsed();

        if since >= EVERY {
            (asked.report)(Progress {
                bytes,
                of_bytes: whole,
                bytes_per_second: per_second(bytes - told_about, since),
            });

            told_at = Instant::now();
            told_about = bytes;
        }
    }

    if let Err(problem) = onto.flush().await {
        return unfinished(bytes, Some(problem.to_string()));
    }

    match whole {
        Some(whole) if whole != bytes => unfinished(
            bytes,
            Some(say_it(
                "desktop.main.keepADownload.theServerSentBytesOfThe",
                &[("bytes", bytes.to_string()), ("whole", whole.to_string())],
            )),
        ),
        _ => Outcome {
            bytes,
            is_complete: true,
            failure: None,
        },
    }
}

/// How many bytes a second arrived, rounded to a whole number.
fn per_second(bytes: u64, since: Duration) -> u64 {
    let seconds = since.as_secs_f64();

    if seconds <= 0.0 {
        return 0;
    }

    #[allow(
        clippy::cast_precision_loss,
        clippy::cast_possible_truncation,
        clippy::cast_sign_loss,
        reason = "a rate is a rounded, non-negative figure far below the limits of either type"
    )]
    let rate = (bytes as f64 / seconds).round() as u64;

    rate
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    clippy::expect_used,
    reason = "a test that cannot set up should fail loudly"
)]
pub(crate) mod tests {
    use super::{keep_a_download, Outcome, Progress, WhatToFetch};
    use crate::preferences::{Preferences, SERVER_ADDRESS};
    use crate::upstream::Upstream;
    use axum::body::Body;
    use axum::http::{HeaderMap, HeaderValue, StatusCode};
    use axum::response::Response;
    use axum::routing::get;
    use axum::Router;
    use futures_util::stream;
    use std::path::Path;
    use std::sync::{Arc, Mutex};
    use std::time::Duration;

    /// The upstream client, asking `server` where there is one, with its preferences in `folder`.
    pub(crate) fn an_upstream(server: Option<&str>, folder: &Path) -> Upstream {
        let preferences = Preferences::open(folder.join("preferences.json"));

        if let Some(server) = server {
            preferences.write(SERVER_ADDRESS, server).unwrap();
        }

        Upstream::new(preferences, None).unwrap()
    }

    /// Serves a router on a port of its own on this machine, and says where.
    pub(crate) async fn serving(router: Router) -> String {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();

        tokio::spawn(async move {
            let _ = axum::serve(listener, router).await;
        });

        format!("http://{address}")
    }

    /// A body that arrives a piece at a time, waiting before each.
    pub(crate) fn arriving(pieces: Vec<String>, pause_for: Duration) -> Body {
        Body::from_stream(stream::unfold(
            pieces.into_iter(),
            move |mut left| async move {
                let piece = left.next()?;

                if !pause_for.is_zero() {
                    tokio::time::sleep(pause_for).await;
                }

                Some((Ok::<_, std::io::Error>(piece), left))
            },
        ))
    }

    /// An answer with a status, headers and a body.
    pub(crate) fn answer(status: u16, headers: &[(&'static str, String)], body: Body) -> Response {
        let mut response = Response::new(body);
        *response.status_mut() = StatusCode::from_u16(status).unwrap();

        for (name, value) in headers {
            response
                .headers_mut()
                .insert(*name, HeaderValue::from_str(value).unwrap());
        }

        response
    }

    fn pieces(of: &[&str]) -> Vec<String> {
        of.iter().map(|piece| (*piece).to_owned()).collect()
    }

    type Answering = Arc<dyn Fn() -> Response + Send + Sync>;

    async fn a_server(answering: Answering, seen: Arc<Mutex<Option<String>>>) -> String {
        serving(Router::new().route(
            "/api/downloads/one/file",
            get(move |headers: HeaderMap| {
                let answering = answering.clone();
                let seen = seen.clone();
                async move {
                    *seen.lock().unwrap() = headers
                        .get("range")
                        .and_then(|range| range.to_str().ok())
                        .map(str::to_owned);
                    answering()
                }
            }),
        ))
        .await
    }

    async fn fetching(
        answering: Answering,
        onto: &Path,
        already: u64,
    ) -> (
        super::Fetching,
        Arc<Mutex<Option<String>>>,
        Arc<Mutex<Vec<Progress>>>,
    ) {
        let seen = Arc::new(Mutex::new(None));
        let told = Arc::new(Mutex::new(Vec::new()));
        let server = a_server(answering, seen.clone()).await;
        let telling = told.clone();

        let fetching = keep_a_download(WhatToFetch {
            asking: reqwest::Client::new().get(format!("{server}/api/downloads/one/file")),
            onto: onto.to_path_buf(),
            already,
            report: Box::new(move |progress| telling.lock().unwrap().push(progress)),
        });

        (fetching, seen, told)
    }

    #[tokio::test]
    async fn puts_the_file_on_the_disk_and_says_it_finished() {
        let folder = tempfile::tempdir().unwrap();
        let onto = folder.path().join("film.mp4");
        let (fetching, _, _) = fetching(
            Arc::new(|| {
                answer(
                    200,
                    &[("content-length", "11".to_owned())],
                    arriving(pieces(&["hello ", "world"]), Duration::ZERO),
                )
            }),
            &onto,
            0,
        )
        .await;

        assert_eq!(
            fetching.finished().await,
            Outcome {
                bytes: 11,
                is_complete: true,
                failure: None
            }
        );
        assert_eq!(std::fs::read_to_string(onto).unwrap(), "hello world");
    }

    #[tokio::test]
    async fn does_not_call_a_file_finished_when_fewer_bytes_came_than_promised() {
        let folder = tempfile::tempdir().unwrap();
        let (fetching, _, _) = fetching(
            Arc::new(|| {
                answer(
                    200,
                    &[("content-range", "bytes 0-4/11".to_owned())],
                    arriving(pieces(&["hello"]), Duration::ZERO),
                )
            }),
            &folder.path().join("film.mp4"),
            0,
        )
        .await;

        assert_eq!(
            fetching.finished().await,
            Outcome {
                bytes: 5,
                is_complete: false,
                failure: Some(
                    "The download is incomplete: the server sent 5 of 11 bytes.".to_owned()
                ),
            }
        );
    }

    #[tokio::test]
    async fn asks_for_the_rest_of_a_file_it_already_has_some_of() {
        let folder = tempfile::tempdir().unwrap();
        let onto = folder.path().join("film.mp4");
        std::fs::write(&onto, "hello ").unwrap();

        let (fetching, seen, _) = fetching(
            Arc::new(|| {
                answer(
                    206,
                    &[("content-range", "bytes 6-10/11".to_owned())],
                    arriving(pieces(&["world"]), Duration::ZERO),
                )
            }),
            &onto,
            6,
        )
        .await;

        fetching.finished().await;

        assert_eq!(seen.lock().unwrap().as_deref(), Some("bytes=6-"));
        assert_eq!(std::fs::read_to_string(onto).unwrap(), "hello world");
    }

    #[tokio::test]
    async fn reads_the_whole_length_from_a_partial_answer() {
        let folder = tempfile::tempdir().unwrap();
        let (fetching, _, told) = fetching(
            Arc::new(|| {
                answer(
                    206,
                    &[("content-range", "bytes 6-10/11".to_owned())],
                    arriving(
                        pieces(&["w", "o", "r", "l", "d"]),
                        Duration::from_millis(150),
                    ),
                )
            }),
            &folder.path().join("film.mp4"),
            6,
        )
        .await;

        fetching.finished().await;
        let told = told.lock().unwrap();

        assert!(!told.is_empty());
        assert!(told.iter().all(|progress| progress.of_bytes == Some(11)));
    }

    #[tokio::test]
    async fn adds_what_is_on_the_disk_where_the_server_did_not_state_the_whole() {
        let folder = tempfile::tempdir().unwrap();
        let (fetching, _, told) = fetching(
            Arc::new(|| {
                answer(
                    206,
                    &[("content-length", "5".to_owned())],
                    arriving(
                        pieces(&["w", "o", "r", "l", "d"]),
                        Duration::from_millis(150),
                    ),
                )
            }),
            &folder.path().join("film.mp4"),
            6,
        )
        .await;

        fetching.finished().await;
        let told = told.lock().unwrap();

        assert!(!told.is_empty());
        assert!(told.iter().all(|progress| progress.of_bytes == Some(11)));
    }

    #[tokio::test]
    async fn starts_the_file_again_where_the_server_ignored_the_range() {
        let folder = tempfile::tempdir().unwrap();
        let onto = folder.path().join("film.mp4");
        std::fs::write(&onto, "hello ").unwrap();

        let (fetching, _, _) = fetching(
            Arc::new(|| {
                answer(
                    200,
                    &[("content-length", "11".to_owned())],
                    arriving(pieces(&["hello world"]), Duration::ZERO),
                )
            }),
            &onto,
            6,
        )
        .await;

        assert_eq!(fetching.finished().await.bytes, 11);
        assert_eq!(std::fs::read_to_string(onto).unwrap(), "hello world");
    }

    #[tokio::test]
    async fn says_what_went_wrong_where_the_server_refused() {
        let folder = tempfile::tempdir().unwrap();
        let (fetching, _, _) = fetching(
            Arc::new(|| answer(404, &[], Body::from("no"))),
            &folder.path().join("film.mp4"),
            0,
        )
        .await;

        assert_eq!(
            fetching.finished().await,
            Outcome {
                bytes: 0,
                is_complete: false,
                failure: Some("The server responded with 404.".to_owned()),
            }
        );
    }

    #[tokio::test]
    async fn treats_being_stopped_as_unfinished_and_keeps_what_arrived() {
        let folder = tempfile::tempdir().unwrap();
        let onto = folder.path().join("film.mp4");
        let (fetching, _, _) = fetching(
            Arc::new(|| {
                answer(
                    200,
                    &[("content-length", "5".to_owned())],
                    arriving(
                        pieces(&["a", "b", "c", "d", "e"]),
                        Duration::from_millis(20),
                    ),
                )
            }),
            &onto,
            0,
        )
        .await;

        tokio::time::sleep(Duration::from_millis(50)).await;
        fetching.stop();

        let outcome = fetching.finished().await;

        assert_eq!((outcome.is_complete, outcome.failure), (false, None));
        assert!(outcome.bytes > 0);
        assert_eq!(std::fs::read(onto).unwrap().len() as u64, outcome.bytes);
    }
}
