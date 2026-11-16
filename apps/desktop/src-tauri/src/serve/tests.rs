use std::sync::Arc;
use std::time::Duration;

use axum::extract::ws::{Message as PageMessage, WebSocketUpgrade};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::{any, get};
use axum::Router;
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::sync::Notify;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::{Error as SocketError, Message as ClientMessage};

use super::renderer::Renderer;
use super::{router, Served};
use crate::preferences::{Preferences, SERVER_ADDRESS};
use crate::reach::Reach;
use crate::upstream::Upstream;

const KEY: &str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

struct Running {
    _folder: tempfile::TempDir,
    preferences: Preferences,
    address: String,
    host: String,
    asking: reqwest::Client,
}

async fn listen(router: Router) -> String {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("a port");
    let host = listener.local_addr().expect("an address").to_string();

    tokio::spawn(async move { axum::serve(listener, router).await });

    host
}

fn headers_of(headers: &HeaderMap) -> Value {
    let pick = |name: &str| {
        headers
            .get(name)
            .and_then(|value| value.to_str().ok())
            .map(str::to_owned)
    };

    json!({
        "origin": pick("origin"),
        "kind": pick("x-valence-client-kind"),
        "cookie": pick("cookie"),
        "accept": pick("accept"),
        "carriedKey": pick("cookie").is_some_and(|cookie| cookie.contains("valence-key")),
    })
}

async fn a_fake_server(released: Arc<Notify>) -> String {
    let router = Router::new()
        .route(
            "/api/echo",
            any(|headers: HeaderMap, body: String| async move {
                (
                    [
                        ("set-cookie", "session=abc; Path=/; HttpOnly; Max-Age=3600"),
                        ("connection", "close"),
                        ("content-type", "application/json"),
                    ],
                    json!({ "headers": headers_of(&headers), "body": body }).to_string(),
                )
            }),
        )
        .route(
            "/api/stream",
            get(move || {
                let released = Arc::clone(&released);
                let chunks = futures_util::stream::unfold(0, move |step| {
                    let released = Arc::clone(&released);

                    async move {
                        match step {
                            0 => Some((Ok::<_, std::io::Error>("first ".to_owned()), 1)),
                            1 => {
                                released.notified().await;
                                Some((Ok("second".to_owned()), 2))
                            }
                            _ => None,
                        }
                    }
                });

                async move { axum::body::Body::from_stream(chunks) }
            }),
        )
        .route(
            "/api/realtime",
            get(|upgrade: WebSocketUpgrade, headers: HeaderMap| async move {
                let cookie = headers
                    .get("cookie")
                    .and_then(|value| value.to_str().ok())
                    .unwrap_or_default()
                    .to_owned();

                upgrade
                    .on_upgrade(move |mut socket| async move {
                        let _ = socket.send(PageMessage::Text(cookie.into())).await;

                        while let Some(Ok(message)) = socket.next().await {
                            if let PageMessage::Text(text) = message {
                                let _ = socket.send(PageMessage::Text(text)).await;
                            }
                        }
                    })
                    .into_response()
            }),
        );

    format!("http://{}", listen(router).await)
}

async fn running() -> Running {
    let folder = tempfile::tempdir().expect("a temporary folder");
    let preferences = Preferences::open(folder.path().join("preferences.json"));
    let upstream = Upstream::new(preferences.clone(), None).expect("a client");
    let reach = Reach::new(
        upstream.clone(),
        Duration::from_secs(60),
        Duration::from_secs(1),
    );
    let renderer = folder.path().join("dist");

    std::fs::create_dir(&renderer).expect("made");
    std::fs::write(renderer.join("index.html"), "<p>page</p>").expect("written");

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("a port");
    let host = listener.local_addr().expect("an address").to_string();
    let served = Served {
        key: KEY.into(),
        host: host.clone().into(),
        upstream,
        reach,
        held: Arc::new(folder.path().join("held")),
        renderer: Arc::new(Renderer::Folder(renderer)),
        policy: "default-src 'self'".into(),
        pages: reqwest::Client::new(),
        boot: Arc::new(|| json!({ "about": { "platform": "linux" } })),
    };

    tokio::spawn(async move { axum::serve(listener, router(served)).await });

    Running {
        _folder: folder,
        preferences,
        address: format!("http://{host}"),
        host,
        asking: reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("a client"),
    }
}

impl Running {
    fn get(&self, path: &str) -> reqwest::RequestBuilder {
        self.asking.get(format!("{}{path}", self.address))
    }

    fn with_the_key(&self, path: &str) -> reqwest::RequestBuilder {
        self.get(path)
            .header("cookie", format!("valence-key={KEY}"))
    }
}

#[tokio::test]
async fn hands_the_key_over_at_the_door_and_asks_for_it_everywhere_else() {
    let app = running().await;

    let wrong = app.get("/enter?key=nope").send().await.expect("an answer");

    assert_eq!(wrong.status(), 403);

    let entered = app
        .get(&format!(
            "/enter?key={KEY}&to=%2Fupdate.html%3Fstep%3Dinstalling"
        ))
        .send()
        .await
        .expect("an answer");

    assert_eq!(entered.status(), 303);
    assert_eq!(
        entered.headers()["location"],
        "/update.html?step=installing"
    );
    assert_eq!(
        entered.headers()["set-cookie"],
        format!("valence-key={KEY}; HttpOnly; SameSite=Strict; Path=/").as_str()
    );

    for path in ["/boot.js", "/api/echo", "/held/x", "/api/realtime"] {
        let refused = app.get(path).send().await.expect("an answer");

        assert_eq!(refused.status(), 403, "{path}");
    }

    let page = app.get("/library").send().await.expect("an answer");

    assert_eq!(page.status(), 200);
    assert_eq!(page.text().await.expect("text"), "<p>page</p>");
}

#[tokio::test]
async fn answers_only_to_its_own_name() {
    let app = running().await;

    let renamed = app
        .with_the_key("/boot.js")
        .header("host", "evil.example")
        .send()
        .await
        .expect("an answer");

    assert_eq!(renamed.status(), 403);

    let page = app
        .get("/")
        .header("host", "evil.example")
        .send()
        .await
        .expect("an answer");

    assert_eq!(page.status(), 403);
}

#[tokio::test]
async fn turns_away_the_key_from_another_sites_page() {
    let app = running().await;
    let own = app
        .with_the_key("/boot.js")
        .header("origin", &app.address)
        .header("sec-fetch-site", "same-origin")
        .send()
        .await
        .expect("an answer");

    assert_eq!(own.status(), 200);

    for (name, value) in [
        ("origin", "http://127.0.0.1:8080"),
        ("origin", "null"),
        ("sec-fetch-site", "same-site"),
        ("sec-fetch-site", "cross-site"),
    ] {
        let refused = app
            .with_the_key("/boot.js")
            .header(name, value)
            .send()
            .await
            .expect("an answer");

        assert_eq!(refused.status(), 403, "{name}: {value}");
    }
}

#[tokio::test]
async fn builds_the_first_script_fresh_and_never_caches_it() {
    let app = running().await;

    let boot = app
        .with_the_key("/boot.js")
        .send()
        .await
        .expect("an answer");

    assert_eq!(boot.status(), 200);
    assert_eq!(boot.headers()["cache-control"], "no-store");
    assert!(boot
        .text()
        .await
        .expect("text")
        .contains("\"platform\":\"linux\""));
}

#[tokio::test]
async fn says_so_when_no_server_has_been_chosen() {
    let app = running().await;

    let answer = app
        .with_the_key("/api/echo")
        .send()
        .await
        .expect("an answer");

    assert_eq!(answer.status(), 503);
    assert_eq!(
        answer.json::<Value>().await.expect("JSON"),
        json!({ "error": "No Valence server has been selected yet." })
    );
}

#[tokio::test]
async fn passes_requests_on_with_the_session_and_keeps_its_cookies() {
    let app = running().await;
    let server = a_fake_server(Arc::new(Notify::new())).await;

    app.preferences
        .write(SERVER_ADDRESS, &server)
        .expect("written");

    let first = app
        .with_the_key("/api/echo")
        .header("accept", "application/json")
        .send()
        .await
        .expect("an answer");

    assert_eq!(first.status(), 200);
    assert!(first.headers().get("set-cookie").is_none());
    assert!(first.headers().get("connection").is_none());

    let said = first.json::<Value>().await.expect("JSON");

    assert_eq!(said["headers"]["origin"], server.as_str());
    assert_eq!(said["headers"]["kind"], "desktop");
    assert_eq!(said["headers"]["accept"], "application/json");
    assert_eq!(said["headers"]["carriedKey"], false);

    let second = app
        .asking
        .post(format!("{}/api/echo", app.address))
        .header("cookie", format!("valence-key={KEY}"))
        .body("a body")
        .send()
        .await
        .expect("an answer")
        .json::<Value>()
        .await
        .expect("JSON");

    assert_eq!(second["headers"]["cookie"], "session=abc");
    assert_eq!(second["body"], "a body");
}

#[tokio::test]
async fn streams_an_answer_as_it_arrives() {
    let app = running().await;
    let released = Arc::new(Notify::new());
    let server = a_fake_server(Arc::clone(&released)).await;

    app.preferences
        .write(SERVER_ADDRESS, &server)
        .expect("written");

    let answer = app
        .with_the_key("/api/stream")
        .send()
        .await
        .expect("an answer");
    let mut body = answer.bytes_stream();
    let first = tokio::time::timeout(Duration::from_secs(5), body.next())
        .await
        .expect("the first part before the rest exists")
        .expect("a part")
        .expect("bytes");

    assert_eq!(&first[..], b"first ");

    released.notify_one();

    let mut rest = Vec::new();

    while let Some(part) = body.next().await {
        rest.extend_from_slice(&part.expect("bytes"));
    }

    assert_eq!(rest, b"second");
}

#[tokio::test]
async fn says_the_server_could_not_be_reached_and_notes_it() {
    let app = running().await;
    let closed = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("a port");
    let server = format!("http://{}", closed.local_addr().expect("an address"));

    drop(closed);
    app.preferences
        .write(SERVER_ADDRESS, &server)
        .expect("written");

    let answer = app
        .with_the_key("/api/echo")
        .send()
        .await
        .expect("an answer");

    assert_eq!(answer.status(), 503);
    assert_eq!(
        answer.json::<Value>().await.expect("JSON")["error"],
        format!("Couldn’t connect to Valence at {server}.").as_str()
    );
}

#[tokio::test]
async fn carries_the_live_connection_with_the_session() {
    let app = running().await;
    let server = a_fake_server(Arc::new(Notify::new())).await;

    app.preferences
        .write(SERVER_ADDRESS, &server)
        .expect("written");
    app.with_the_key("/api/echo")
        .send()
        .await
        .expect("an answer");

    let mut asking = format!("ws://{}/api/realtime", app.host)
        .into_client_request()
        .expect("a request");

    asking.headers_mut().insert(
        "cookie",
        format!("valence-key={KEY}").parse().expect("a header"),
    );

    let unnamed = tokio_tungstenite::connect_async(asking.clone()).await;

    assert!(
        matches!(&unnamed, Err(SocketError::Http(refusal)) if refusal.status() == 403),
        "a live connection that does not say where it comes from"
    );

    asking
        .headers_mut()
        .insert("origin", app.address.parse().expect("a header"));

    let (mut socket, _) = tokio_tungstenite::connect_async(asking)
        .await
        .expect("a socket");
    let greeting = socket.next().await.expect("a message").expect("a frame");

    assert_eq!(greeting, ClientMessage::Text("session=abc".into()));

    socket
        .send(ClientMessage::Text("hello".into()))
        .await
        .expect("sent");

    let echoed = socket.next().await.expect("a message").expect("a frame");

    assert_eq!(echoed, ClientMessage::Text("hello".into()));

    socket.close(None).await.expect("closed");
}
