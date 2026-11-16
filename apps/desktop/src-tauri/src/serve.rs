//! The loopback server the window is a page of.
//!
//! The window loads `http://127.0.0.1:<port>/`, and everything the page asks for goes through
//! here: its own files, what it asks of Valence, its live connection, and the files this computer
//! is holding. So nothing the page does is cross-origin, the session it signs in with is held out
//! here where the page cannot read it, and an answer can stream as it would from any server.

pub mod api;
pub mod boot;
pub mod guard;
pub mod held_file;
pub mod port;
pub mod realtime;
pub mod renderer;

use std::path::PathBuf;
use std::sync::Arc;

use axum::http::header::{CONTENT_TYPE, SET_COOKIE};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::middleware::from_fn_with_state;
use axum::response::{IntoResponse, Response};
use axum::routing::{any, get};
use axum::Router;
use reqwest::Url;
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

use crate::reach::Reach;
use crate::upstream::Upstream;
use renderer::Renderer;

const PORT_FILE: &str = "loopback-port";

const HOP_BY_HOP: [&str; 8] = [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
];

/// Everything the loopback server's routes share.
#[derive(Clone)]
pub struct Served {
    /// The key the window carries in its cookie.
    pub key: Arc<str>,
    /// This server's own name, `127.0.0.1:<port>`.
    pub host: Arc<str>,
    /// The client requests to the server go out through.
    pub upstream: Upstream,
    /// Whether the server can be reached.
    pub reach: Reach,
    /// Where held files are.
    pub held: Arc<PathBuf>,
    /// Where the renderer's files come from.
    pub renderer: Arc<Renderer>,
    /// The content security policy pages are held to.
    pub policy: Arc<str>,
    /// The client requests to Vite go out through, in development.
    pub pages: reqwest::Client,
    /// Builds what the first script hands the page.
    pub boot: Arc<dyn Fn() -> Value + Send + Sync>,
}

/// Where the loopback server is listening, and the key the window needs.
pub struct Serving {
    port: u16,
    key: Arc<str>,
}

/// The routes, guarded: everything but the renderer's own files needs the key, and everything has
/// to be addressed to this server by name.
pub fn router(served: Served) -> Router {
    let guarded = Router::new()
        .route("/boot.js", get(boot::answer))
        .route("/api/realtime", any(realtime::answer))
        .route("/api/{*rest}", any(api::answer))
        .route("/held/{*rest}", get(held_file::answer))
        .route_layer(from_fn_with_state(served.clone(), guard::with_the_key));

    Router::new()
        .merge(guarded)
        .route("/enter", get(guard::enter))
        .fallback(renderer::answer)
        .layer(from_fn_with_state(served.clone(), guard::on_this_host))
        .with_state(served)
}

/// The headers of an answer to hand the page: all but those that belong to one connection, and
/// the cookies, which stay with this app.
#[must_use]
pub fn answer_headers(from: &HeaderMap) -> HeaderMap {
    let mut headers = from.clone();

    for name in HOP_BY_HOP {
        headers.remove(name);
    }

    headers.remove(SET_COOKIE);
    headers
}

/// Answers with `status` and why, in the shape the rest of the API says it.
#[must_use]
pub fn said(status: StatusCode, error: &str) -> Response {
    (
        status,
        [(CONTENT_TYPE, HeaderValue::from_static("application/json"))],
        json!({ "error": error }).to_string(),
    )
        .into_response()
}

/// The origin the window's pages are served from, `http://127.0.0.1:<port>`.
#[must_use]
pub fn origin(app: &AppHandle) -> String {
    let port = app.try_state::<Serving>().map_or(0, |serving| serving.port);

    format!("http://127.0.0.1:{port}")
}

/// The address a window opens to show `path` of the application: one that hands it the key first.
#[must_use]
pub fn entry(app: &AppHandle, path: &str) -> Option<Url> {
    let serving = app.try_state::<Serving>()?;
    let mut url = Url::parse(&origin(app)).ok()?.join("/enter").ok()?;

    url.query_pairs_mut()
        .append_pair("key", &serving.key)
        .append_pair("to", path);
    Some(url)
}

/// Where the renderer's files come from: Vite where `VALENCE_RENDERER_URL` says so, or in a debug
/// build the development address the configuration names, and otherwise the files embedded in the
/// app, or the crate's own `dist` folder for a debug build with no development address.
fn chosen_renderer(app: &tauri::App) -> Result<Renderer, Box<dyn std::error::Error>> {
    if let Some(vite) = std::env::var("VALENCE_RENDERER_URL")
        .ok()
        .filter(|url| !url.is_empty())
    {
        return Ok(Renderer::Vite(Url::parse(&vite)?));
    }

    if cfg!(debug_assertions) {
        return Ok(match app.config().build.dev_url.clone() {
            Some(vite) => Renderer::Vite(vite),
            None => Renderer::Folder(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../dist")),
        });
    }

    Ok(Renderer::Embedded(app.handle().clone()))
}

/// Starts the loopback server, on the port it had last time where it can.
///
/// # Errors
///
/// When no port can be listened on, the renderer's address is not one, or the upstream client
/// and reach were not set up first.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let port_file = crate::paths::user_data().join(PORT_FILE);
    let ports = port::candidates(port::remembered(&port_file));
    let listener = tauri::async_runtime::block_on(async { port::listen_on_the_first(&ports) })?;
    let port = listener.local_addr()?.port();

    if let Err(error) = port::remember(&port_file, port) {
        eprintln!("Valence could not remember its port: {error}");
    }

    let key: Arc<str> = guard::a_key().into();
    let host = format!("127.0.0.1:{port}");
    let renderer = chosen_renderer(app)?;
    let policy = renderer::policy_for(&renderer, &format!("http://{host}"));
    let handle = app.handle().clone();
    let served = Served {
        key: Arc::clone(&key),
        host: host.into(),
        upstream: crate::upstream::upstream(app.handle())
            .ok_or("the upstream client was not set up first")?,
        reach: crate::reach::reach(app.handle()).ok_or("reach was not set up first")?,
        held: Arc::new(crate::paths::held_folder()),
        renderer: Arc::new(renderer),
        policy: policy.into(),
        pages: reqwest::Client::new(),
        boot: Arc::new(move || boot::snapshot(&handle)),
    };

    app.manage(Serving { port, key });
    crate::runtime::spawn(async move {
        if let Err(error) = axum::serve(listener, router(served)).await {
            eprintln!("Valence's loopback server stopped: {error}");
        }
    });

    Ok(())
}

#[cfg(test)]
mod tests;
