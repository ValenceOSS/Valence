//! Carries the page's live connection on to the server, with the session this app holds for it.
//!
//! The page cannot open the socket at the server itself: its origin is this app, so the webview
//! would send the server no cookie and the server would rightly refuse it. So the page opens its
//! socket here, this opens one to the server with the session on it, and messages are passed
//! between the two until either end closes, which closes the other.

use axum::extract::ws::{CloseFrame as PageClose, Message as PageMessage, WebSocket};
use axum::extract::{FromRequestParts, Request, State, WebSocketUpgrade};
use axum::http::header::{COOKIE, ORIGIN, SEC_WEBSOCKET_PROTOCOL, UPGRADE};
use axum::http::{HeaderMap, HeaderName, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use futures_util::{SinkExt, StreamExt};
use reqwest::Url;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::protocol::frame::coding::CloseCode;
use tokio_tungstenite::tungstenite::protocol::CloseFrame as ServerClose;
use tokio_tungstenite::tungstenite::{Error as SocketError, Message as ServerMessage};
use tokio_tungstenite::Connector;

use super::{said, Served};
use crate::say::say;
use crate::upstream::{
    on_the_server, origin_of, CLIENT_KIND, CLIENT_KIND_HEADER, LONGEST_TO_CONNECT,
};

/// Whether `headers` ask to open a WebSocket.
#[must_use]
pub fn asks_for_a_socket(headers: &HeaderMap) -> bool {
    headers
        .get(UPGRADE)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.eq_ignore_ascii_case("websocket"))
}

/// The socket address for `path_and_query` on `server`: `ws` for `http` and `wss` for `https`.
#[must_use]
pub fn socket_on_the_server(server: &str, path_and_query: &str) -> Option<Url> {
    let mut url = on_the_server(server, path_and_query)?;
    let scheme = if url.scheme() == "https" { "wss" } else { "ws" };

    url.set_scheme(scheme).ok()?;
    Some(url)
}

/// A message from the page, as the server's socket sends it; nothing for a ping or pong, which
/// each end answers for itself.
#[must_use]
pub fn to_the_server(message: PageMessage) -> Option<ServerMessage> {
    match message {
        PageMessage::Text(text) => Some(ServerMessage::Text(text.as_str().into())),
        PageMessage::Binary(bytes) => Some(ServerMessage::Binary(bytes)),
        PageMessage::Close(frame) => Some(ServerMessage::Close(frame.map(|frame| ServerClose {
            code: CloseCode::from(frame.code),
            reason: frame.reason.as_str().into(),
        }))),
        PageMessage::Ping(_) | PageMessage::Pong(_) => None,
    }
}

/// A message from the server, as the page's socket sends it; nothing for a ping, pong or raw
/// frame.
#[must_use]
pub fn to_the_page(message: ServerMessage) -> Option<PageMessage> {
    match message {
        ServerMessage::Text(text) => Some(PageMessage::Text(text.as_str().into())),
        ServerMessage::Binary(bytes) => Some(PageMessage::Binary(bytes)),
        ServerMessage::Close(frame) => Some(PageMessage::Close(frame.map(|frame| PageClose {
            code: frame.code.into(),
            reason: frame.reason.as_str().into(),
        }))),
        ServerMessage::Ping(_) | ServerMessage::Pong(_) | ServerMessage::Frame(_) => None,
    }
}

/// Opens the page's socket on to the server, or passes a plain request on as any other.
pub async fn answer(State(served): State<Served>, request: Request) -> Response {
    if !asks_for_a_socket(request.headers()) {
        return super::api::answer(State(served), request).await;
    }

    let (mut parts, _body) = request.into_parts();
    let upgrade = match WebSocketUpgrade::from_request_parts(&mut parts, &served).await {
        Ok(upgrade) => upgrade,
        Err(refused) => return refused.into_response(),
    };
    let Some(chosen) = served.upstream.server_address() else {
        return said(
            StatusCode::SERVICE_UNAVAILABLE,
            &say("common.noValenceHasBeenChosenYet", &[]),
        );
    };
    let path_and_query = parts
        .uri
        .path_and_query()
        .map_or("/api/realtime", |path| path.as_str());
    let (Some(socket), Some(page)) = (
        socket_on_the_server(&chosen, path_and_query),
        on_the_server(&chosen, path_and_query),
    ) else {
        return could_not_reach(&served, &chosen);
    };
    let Ok(mut asking) = socket.as_str().into_client_request() else {
        return could_not_reach(&served, &chosen);
    };
    let headers = asking.headers_mut();

    if let Some(cookie) = served.upstream.cookie_header_for(&page) {
        headers.insert(COOKIE, cookie);
    }

    if let Ok(origin) = HeaderValue::from_str(&origin_of(&page)) {
        headers.insert(ORIGIN, origin);
    }

    headers.insert(
        HeaderName::from_static(CLIENT_KIND_HEADER),
        HeaderValue::from_static(CLIENT_KIND),
    );

    for name in [SEC_WEBSOCKET_PROTOCOL, axum::http::header::USER_AGENT] {
        if let Some(value) = parts.headers.get(&name) {
            headers.insert(name, value.clone());
        }
    }

    let connecting = tokio_tungstenite::connect_async_tls_with_config(
        asking,
        None,
        false,
        crate::tls::for_sockets().map(Connector::Rustls),
    );
    let Ok(connected) = tokio::time::timeout(LONGEST_TO_CONNECT, connecting).await else {
        return could_not_reach(&served, &chosen);
    };

    match connected {
        Ok((upstream, answered)) => {
            served.reach.note_reached();

            let chosen = answered
                .headers()
                .get(SEC_WEBSOCKET_PROTOCOL)
                .and_then(|value| value.to_str().ok())
                .map(str::to_owned);
            let upgrade = match chosen {
                Some(protocol) => upgrade.protocols([protocol]),
                None => upgrade,
            };

            upgrade.on_upgrade(move |page| pump(page, upstream))
        }
        Err(SocketError::Http(refusal)) => {
            served.reach.note_reached();
            StatusCode::from_u16(refusal.status().as_u16())
                .unwrap_or(StatusCode::BAD_GATEWAY)
                .into_response()
        }
        Err(_) => could_not_reach(&served, &chosen),
    }
}

/// Passes messages between the page's socket and the server's until either closes, then closes
/// the other.
async fn pump<S>(page: WebSocket, server: tokio_tungstenite::WebSocketStream<S>)
where
    S: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let (mut to_page, mut from_page) = page.split();
    let (mut to_server, mut from_server) = server.split();

    let page_to_server = async {
        while let Some(Ok(message)) = from_page.next().await {
            let Some(message) = to_the_server(message) else {
                continue;
            };
            let is_closing = matches!(message, ServerMessage::Close(_));

            if to_server.send(message).await.is_err() || is_closing {
                break;
            }
        }

        let _ = to_server.close().await;
    };
    let server_to_page = async {
        while let Some(Ok(message)) = from_server.next().await {
            let Some(message) = to_the_page(message) else {
                continue;
            };
            let is_closing = matches!(message, PageMessage::Close(_));

            if to_page.send(message).await.is_err() || is_closing {
                break;
            }
        }

        let _ = to_page.close().await;
    };

    tokio::select! {
        () = page_to_server => {}
        () = server_to_page => {}
    }
}

/// Notes that the server could not be reached, and says so.
fn could_not_reach(served: &Served, chosen: &str) -> Response {
    served.reach.note_missed();

    said(
        StatusCode::SERVICE_UNAVAILABLE,
        &say(
            "desktop.main.theApplication.valenceCouldNotBeReachedAt",
            &[("server", chosen)],
        ),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn opens_a_socket_on_the_servers_own_scheme() {
        assert_eq!(
            socket_on_the_server("http://nas:8420", "/api/realtime").map(String::from),
            Some("ws://nas:8420/api/realtime".to_owned())
        );
        assert_eq!(
            socket_on_the_server("https://nas.example/x", "/api/realtime?feed=admin")
                .map(String::from),
            Some("wss://nas.example/api/realtime?feed=admin".to_owned())
        );
    }

    #[test]
    fn knows_a_request_for_a_socket() {
        let mut headers = HeaderMap::new();

        assert!(!asks_for_a_socket(&headers));

        headers.insert(UPGRADE, HeaderValue::from_static("WebSocket"));

        assert!(asks_for_a_socket(&headers));
    }

    #[test]
    fn passes_messages_on_and_leaves_pings_to_each_end() {
        assert_eq!(
            to_the_server(PageMessage::Text("hello".into())),
            Some(ServerMessage::Text("hello".into()))
        );
        assert_eq!(
            to_the_page(ServerMessage::Binary(vec![1, 2].into())),
            Some(PageMessage::Binary(vec![1, 2].into()))
        );
        assert_eq!(to_the_server(PageMessage::Ping(vec![].into())), None);
        assert_eq!(to_the_page(ServerMessage::Pong(vec![].into())), None);
        assert_eq!(
            to_the_page(ServerMessage::Close(Some(ServerClose {
                code: CloseCode::Normal,
                reason: "bye".into(),
            }))),
            Some(PageMessage::Close(Some(PageClose {
                code: 1000,
                reason: "bye".into(),
            })))
        );
    }
}
