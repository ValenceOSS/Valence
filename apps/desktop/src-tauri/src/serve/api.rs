//! Passes what the page asks of Valence on to the chosen server, streamed both ways, with the
//! session this app holds for it.
//!
//! Whether the server answered is noted on the way past: this is the one place that sees every
//! request, so the one place that can tell a server that has gone from one that said no. A server
//! that cannot be reached is answered as unavailable rather than as a bad gateway, so the screen
//! that asked tries again, as it should when the app and a server start together and the app asks
//! first. A body the page stops reading stops the request to the server with it.

use std::time::Duration;

use axum::body::Body;
use axum::extract::{Request, State};
use axum::http::header::{CONTENT_LENGTH, TRANSFER_ENCODING};
use axum::http::{Method, StatusCode};
use axum::response::Response;
use tokio::task::JoinHandle;

use super::{answer_headers, said, Served};
use crate::say::say;
use crate::upstream::{asking_as, on_the_server, origin_of};

/// How long an answer may take before the server is checked on.
pub const SLOW_ANSWER: Duration = Duration::from_secs(10);

/// Stops the slow-answer check when the request it watches is over, however it ends.
struct Watching(JoinHandle<()>);

impl Drop for Watching {
    fn drop(&mut self) {
        self.0.abort();
    }
}

/// Whether a request from the page carries a body to pass on.
fn has_a_body(request: &Request) -> bool {
    if matches!(*request.method(), Method::GET | Method::HEAD) {
        return false;
    }

    let headers = request.headers();
    let length = headers
        .get(CONTENT_LENGTH)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.parse::<u64>().ok());

    length.is_some_and(|length| length > 0) || headers.contains_key(TRANSFER_ENCODING)
}

/// Passes one request from the page on to the server and its answer back.
pub async fn answer(State(served): State<Served>, request: Request) -> Response {
    let Some(chosen) = served.upstream.server_address() else {
        return said(
            StatusCode::SERVICE_UNAVAILABLE,
            &say("common.noValenceHasBeenChosenYet", &[]),
        );
    };
    let path_and_query = request
        .uri()
        .path_and_query()
        .map_or("/", |path| path.as_str())
        .to_owned();
    let Some(onward) = on_the_server(&chosen, &path_and_query) else {
        return could_not_reach(&served, &chosen);
    };
    let mut headers = asking_as(request.headers(), &origin_of(&onward));
    let carries_a_body = has_a_body(&request);

    if carries_a_body {
        if let Some(length) = request.headers().get(CONTENT_LENGTH) {
            headers.insert(CONTENT_LENGTH, length.clone());
        }
    }

    let method = request.method().clone();
    let mut asking = served
        .upstream
        .client()
        .request(method, onward)
        .headers(headers);

    if carries_a_body {
        asking = asking.body(reqwest::Body::wrap_stream(
            request.into_body().into_data_stream(),
        ));
    }

    served.upstream.loaded().wait().await;

    let reach = served.reach.clone();
    let _watching = Watching(crate::runtime::spawn(async move {
        tokio::time::sleep(SLOW_ANSWER).await;
        reach.check_now();
    }));

    match asking.send().await {
        Ok(answer) => {
            served.reach.note_reached();
            served.upstream.keep_cookies_from(answer.headers());

            let status = answer.status();
            let headers = answer_headers(answer.headers());
            let mut response = Response::new(Body::from_stream(answer.bytes_stream()));

            *response.status_mut() = status;
            *response.headers_mut() = headers;
            response
        }
        Err(_) => could_not_reach(&served, &chosen),
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

    fn a_request(method: Method, headers: &[(&'static str, &'static str)]) -> Request {
        let mut request = Request::new(Body::empty());
        *request.method_mut() = method;

        for (name, value) in headers {
            request
                .headers_mut()
                .insert(*name, axum::http::HeaderValue::from_static(value));
        }

        request
    }

    #[test]
    fn passes_a_body_on_only_where_there_is_one() {
        assert!(!has_a_body(&a_request(
            Method::GET,
            &[("content-length", "5")]
        )));
        assert!(!has_a_body(&a_request(Method::POST, &[])));
        assert!(!has_a_body(&a_request(
            Method::POST,
            &[("content-length", "0")]
        )));
        assert!(has_a_body(&a_request(
            Method::POST,
            &[("content-length", "5")]
        )));
        assert!(has_a_body(&a_request(
            Method::PUT,
            &[("transfer-encoding", "chunked")]
        )));
    }
}
