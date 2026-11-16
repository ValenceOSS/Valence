//! Listening on this machine alone for the browser to hand a sign-in back.

use crate::say::say;
use std::sync::Mutex;
use std::time::Duration;
use tauri::Url;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, oneshot};

/// How long somebody has to sign in on the page before the app stops waiting.
pub const LONG_ENOUGH_TO_SIGN_IN: Duration = Duration::from_secs(10 * 60);

/// How long one browser connection has to say what it wants.
const LONG_ENOUGH_TO_ASK: Duration = Duration::from_secs(10);

/// The most of a request read, which is far more than a request line and its headers.
const MOST_OF_A_REQUEST: usize = 16 * 1024;

/// Where the browser is to come back to, and what it brings.
pub struct Listening {
    /// The port, on `127.0.0.1`.
    pub port: u16,
    /// The code the browser brings, or nothing where it never came.
    pub handed_back: oneshot::Receiver<Option<String>>,
}

/// The one sign-in being waited for, which a new one gives up on.
#[derive(Default)]
pub struct HandBacks {
    stop_waiting: Mutex<Option<oneshot::Sender<()>>>,
}

/// What one browser connection asked for.
fn what_was_asked(request: &str) -> Option<String> {
    let target = request.lines().next()?.split(' ').nth(1)?;
    let asked = Url::parse("http://127.0.0.1").ok()?.join(target).ok()?;

    if asked.path() != "/signed-in" {
        return None;
    }

    asked
        .query_pairs()
        .find(|(name, _)| name == "code")
        .map(|(_, code)| code.into_owned())
        .filter(|code| !code.is_empty())
}

/// An HTTP answer, whole, after which the connection closes.
fn an_answer(status: &str, kind: &str, body: &str) -> String {
    format!(
        "HTTP/1.1 {status}\r\ncontent-type: {kind}\r\ncache-control: no-store\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}",
        body.len()
    )
}

/// Reads one request, answers it, and says what code it brought, if any.
async fn answer(mut connection: TcpStream) -> Option<String> {
    let mut request = Vec::new();
    let mut chunk = [0_u8; 2048];
    let reading = async {
        while !request.windows(4).any(|end| end == b"\r\n\r\n") && request.len() < MOST_OF_A_REQUEST
        {
            let read = connection.read(&mut chunk).await.ok()?;

            if read == 0 {
                break;
            }

            request.extend_from_slice(&chunk[..read]);
        }

        Some(())
    };

    tokio::time::timeout(LONG_ENOUGH_TO_ASK, reading)
        .await
        .ok()??;

    let code = what_was_asked(&String::from_utf8_lossy(&request));
    let answered = match code {
        Some(_) => an_answer(
            "200 OK",
            "text/html; charset=utf-8",
            &say(
                "desktop.main.listenForTheHandBack.doctypeHtmlHtmlLangEnMeta",
                &[],
            ),
        ),
        None => an_answer(
            "404 Not Found",
            "text/plain; charset=utf-8",
            &say("desktop.main.listenForTheHandBack.notHere", &[]),
        ),
    };

    let _ = connection.write_all(answered.as_bytes()).await;
    let _ = connection.shutdown().await;

    code
}

impl HandBacks {
    /// Listens on this machine alone for the browser to hand a sign-in back to the desktop app.
    ///
    /// A port of its own on the loopback address, for one answer: the first request that brings
    /// a code is answered with a page saying so, and the listening stops. Anything else is told
    /// there is nothing here. Somebody who closes the tab instead is not waited for for ever, and
    /// starting again gives up on the one before.
    ///
    /// # Errors
    ///
    /// When this machine will not give a port to listen on.
    pub async fn listen(&self, wait_for: Duration) -> std::io::Result<Listening> {
        let (stop, stopped) = oneshot::channel();

        if let Ok(mut waiting) = self.stop_waiting.lock() {
            if let Some(before) = waiting.replace(stop) {
                let _ = before.send(());
            }
        }

        let listener = TcpListener::bind(("127.0.0.1", 0)).await?;
        let port = listener.local_addr()?.port();
        let (settle, handed_back) = oneshot::channel();

        tokio::spawn(async move {
            let (brought, mut codes) = mpsc::channel::<String>(1);
            let give_up = tokio::time::sleep(wait_for);

            tokio::pin!(give_up);
            tokio::pin!(stopped);

            let code = loop {
                tokio::select! {
                    () = &mut give_up => break None,
                    _ = &mut stopped => break None,
                    Some(code) = codes.recv() => break Some(code),
                    accepted = listener.accept() => {
                        if let Ok((connection, _)) = accepted {
                            let brought = brought.clone();

                            tokio::spawn(async move {
                                if let Some(code) = answer(connection).await {
                                    let _ = brought.send(code).await;
                                }
                            });
                        }
                    }
                }
            };

            let _ = settle.send(code);
        });

        Ok(Listening { port, handed_back })
    }
}

#[cfg(test)]
mod tests {
    use super::{what_was_asked, HandBacks, LONG_ENOUGH_TO_SIGN_IN};
    use std::time::Duration;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpStream;

    async fn visit(port: u16, path: &str) -> (u16, String) {
        let Ok(mut connection) = TcpStream::connect(("127.0.0.1", port)).await else {
            return (0, String::new());
        };
        let asked = format!("GET {path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\n\r\n");
        let mut answered = String::new();

        let _ = connection.write_all(asked.as_bytes()).await;
        let _ = connection.read_to_string(&mut answered).await;

        let status = answered
            .split(' ')
            .nth(1)
            .and_then(|status| status.parse().ok())
            .unwrap_or_default();

        (status, answered)
    }

    #[tokio::test]
    async fn takes_the_code_the_browser_brings_back_and_tells_the_browser_it_is_done() {
        let hand_backs = HandBacks::default();
        let Ok(listening) = hand_backs.listen(LONG_ENOUGH_TO_SIGN_IN).await else {
            panic!("could not listen");
        };
        let (status, body) = visit(listening.port, "/signed-in?code=abc").await;

        assert_eq!(status, 200);
        assert!(body.contains("go back to Valence"));
        assert!(body.contains("cache-control: no-store"));
        assert_eq!(
            listening.handed_back.await.ok().flatten(),
            Some("abc".to_owned())
        );
    }

    #[tokio::test]
    async fn answers_nothing_else_and_keeps_waiting() {
        let hand_backs = HandBacks::default();
        let Ok(listening) = hand_backs.listen(LONG_ENOUGH_TO_SIGN_IN).await else {
            panic!("could not listen");
        };

        assert_eq!(visit(listening.port, "/somewhere-else").await.0, 404);
        assert_eq!(visit(listening.port, "/signed-in").await.0, 404);

        visit(listening.port, "/signed-in?code=abc").await;

        assert_eq!(
            listening.handed_back.await.ok().flatten(),
            Some("abc".to_owned())
        );
    }

    #[tokio::test]
    async fn gives_up_on_a_browser_that_never_comes_back() {
        let hand_backs = HandBacks::default();
        let Ok(listening) = hand_backs.listen(Duration::from_millis(10)).await else {
            panic!("could not listen");
        };

        assert_eq!(listening.handed_back.await.ok().flatten(), None);
    }

    #[tokio::test]
    async fn gives_up_on_the_one_before_when_asked_again() {
        let hand_backs = HandBacks::default();
        let Ok(before) = hand_backs.listen(LONG_ENOUGH_TO_SIGN_IN).await else {
            panic!("could not listen");
        };
        let Ok(after) = hand_backs.listen(LONG_ENOUGH_TO_SIGN_IN).await else {
            panic!("could not listen");
        };

        assert_eq!(before.handed_back.await.ok().flatten(), None);

        visit(after.port, "/signed-in?code=abc").await;

        assert_eq!(
            after.handed_back.await.ok().flatten(),
            Some("abc".to_owned())
        );
    }

    #[test]
    fn reads_the_code_from_where_the_browser_was_sent() {
        assert_eq!(
            what_was_asked("GET /signed-in?code=a%20b&x=1 HTTP/1.1\r\n"),
            Some("a b".to_owned())
        );
        assert_eq!(what_was_asked("GET /signed-in?code= HTTP/1.1\r\n"), None);
        assert_eq!(what_was_asked("nonsense"), None);
    }
}
