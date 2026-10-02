//! The secret a caller presents before this service does anything for it.
//!
//! The service has no accounts of its own. Inside the Valence container it is
//! reached only through a socket the server owns, so nothing else can ask it
//! anything. Running natively on a Mac or a Windows PC, for the GPU
//! (VAL-338), it listens on `127.0.0.1` instead, where every program on that
//! machine and every container Docker Desktop runs can reach it, and it reads
//! the media folders and starts and deletes work for whoever asks. A secret
//! set on both sides narrows that to whoever was given it.
//!
//! Unset, every request is answered, as it always has been, so an ordinary
//! install needs nothing new.

use axum::extract::Request;
use axum::http::header::AUTHORIZATION;
use axum::http::StatusCode;
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::Router;
use std::sync::Arc;

/// The variable the secret is read from.
pub const VARIABLE: &str = "VALENCE_TRANSCODER_SECRET";

/// The fewest characters a secret may have, the same as the requests
/// service asks of its own.
pub const SHORTEST: usize = 32;

/// Reads the secret from its setting.
///
/// Only a setting that is empty means no secret. One of nothing but spaces was
/// still set by somebody meaning to guard the service, and reading it as unset
/// would leave the service open while they believed it closed.
///
/// # Errors
///
/// Refuses a secret shorter than [`SHORTEST`] once its spaces are trimmed, so
/// a placeholder, a typo or a blank is caught at startup rather than guarding
/// the service with something guessable or with nothing.
pub fn parse(raw: &str) -> Result<Option<String>, String> {
    if raw.is_empty() {
        return Ok(None);
    }

    let secret = raw.trim();

    if secret.chars().count() < SHORTEST {
        return Err(format!(
            "{VARIABLE} must be at least {SHORTEST} characters; `openssl rand -hex 32` makes one"
        ));
    }

    Ok(Some(secret.to_owned()))
}

/// Puts every route behind the secret, where there is one.
///
/// The health check too: the server asks it to know whether the service is
/// there, and a server holding the wrong secret should see the service as
/// unreachable rather than as up and refusing everything it is asked.
pub fn require(router: Router, secret: Option<String>) -> Router {
    let Some(secret) = secret else {
        return router;
    };

    let secret: Arc<str> = Arc::from(secret);

    router.layer(middleware::from_fn(move |request: Request, next: Next| {
        let secret = Arc::clone(&secret);

        async move {
            let presented = request
                .headers()
                .get(AUTHORIZATION)
                .and_then(|value| value.to_str().ok());

            if presents(presented, &secret) {
                next.run(request).await
            } else {
                tracing::warn!(
                    target: "service",
                    "refused {} without the shared secret; check {VARIABLE} matches TRANSCODER_SECRET",
                    request.uri().path()
                );

                refuse()
            }
        }
    }))
}

/// Whether an `Authorization` header carries the secret as a bearer token.
///
/// Compared in time that does not depend on where the two first differ, so the
/// secret cannot be worked out a character at a time from how long refusals take.
fn presents(header: Option<&str>, secret: &str) -> bool {
    let Some(token) = header.and_then(|value| value.strip_prefix("Bearer ")) else {
        return false;
    };

    let (token, secret) = (token.as_bytes(), secret.as_bytes());

    token.len() == secret.len()
        && token
            .iter()
            .zip(secret)
            .fold(0_u8, |differs, (one, other)| differs | (one ^ other))
            == 0
}

fn refuse() -> Response {
    (StatusCode::UNAUTHORIZED, "this service needs its secret").into_response()
}

#[cfg(test)]
mod tests {
    use super::{parse, presents, require, SHORTEST};
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use axum::routing::get;
    use axum::Router;
    use tower::ServiceExt;

    const SECRET: &str = "0123456789abcdef0123456789abcdef";

    fn service() -> Router {
        Router::new()
            .route("/health", get(|| async { "up" }))
            .route("/probe", get(|| async { "probed" }))
    }

    async fn status(router: Router, path: &str, authorization: Option<&str>) -> StatusCode {
        let mut request = Request::builder().uri(path);

        if let Some(value) = authorization {
            request = request.header("authorization", value);
        }

        router
            .oneshot(request.body(Body::empty()).unwrap())
            .await
            .unwrap()
            .status()
    }

    #[tokio::test]
    async fn answers_everybody_where_no_secret_is_set() {
        assert_eq!(
            status(require(service(), None), "/probe", None).await,
            StatusCode::OK
        );
    }

    #[tokio::test]
    async fn refuses_a_caller_without_the_secret() {
        let guarded = require(service(), Some(SECRET.to_owned()));

        assert_eq!(
            status(guarded, "/probe", None).await,
            StatusCode::UNAUTHORIZED
        );
    }

    #[tokio::test]
    async fn refuses_a_caller_with_the_wrong_secret() {
        let guarded = require(service(), Some(SECRET.to_owned()));
        let wrong = format!("Bearer {}", "f".repeat(SHORTEST));

        assert_eq!(
            status(guarded, "/probe", Some(&wrong)).await,
            StatusCode::UNAUTHORIZED
        );
    }

    #[tokio::test]
    async fn answers_a_caller_with_the_secret() {
        let guarded = require(service(), Some(SECRET.to_owned()));
        let right = format!("Bearer {SECRET}");

        assert_eq!(
            status(guarded, "/probe", Some(&right)).await,
            StatusCode::OK
        );
    }

    #[tokio::test]
    async fn guards_the_health_check_too() {
        let guarded = require(service(), Some(SECRET.to_owned()));

        assert_eq!(
            status(guarded, "/health", None).await,
            StatusCode::UNAUTHORIZED
        );
    }

    #[test]
    fn reads_an_empty_setting_as_no_secret() {
        assert_eq!(parse(""), Ok(None));
    }

    #[test]
    fn refuses_a_secret_of_nothing_but_spaces() {
        assert!(parse("  ").is_err());
    }

    #[test]
    fn refuses_a_secret_too_short_to_guard_anything() {
        assert!(parse("changeme").is_err());
        assert_eq!(parse(SECRET), Ok(Some(SECRET.to_owned())));
    }

    #[test]
    fn takes_only_a_bearer_token_that_matches_exactly() {
        assert!(presents(Some(&format!("Bearer {SECRET}")), SECRET));
        assert!(!presents(Some(SECRET), SECRET));
        assert!(!presents(Some(&format!("Bearer {SECRET}x")), SECRET));
        assert!(!presents(Some("Bearer "), SECRET));
        assert!(!presents(None, SECRET));
    }
}
