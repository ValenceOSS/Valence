//! Serves the page itself: the built renderer embedded in the app or, while it is being worked on,
//! from Vite.
//!
//! Every page is held to a content security policy, sent as a header so a page built for a browser
//! does not carry the desktop's rules. Inline styles are allowed because animation writes them;
//! WebAssembly may be compiled because the player decodes some sound and pictures with it;
//! pictures may come from anywhere over https because a catalogue's artwork lives at its own
//! addresses; and the one thing a page may frame is the video host's player, for trailers.

use std::path::{Path, PathBuf};

use axum::body::Body;
use axum::extract::{Request, State};
use axum::http::header::{CACHE_CONTROL, CONTENT_ENCODING, CONTENT_LENGTH, CONTENT_TYPE};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use reqwest::Url;

use super::{answer_headers, said, Served};
use crate::say::say;

/// The hosts a trailer may be framed from.
pub const VIDEO_HOSTS: [&str; 4] = [
    "www.youtube-nocookie.com",
    "youtube-nocookie.com",
    "www.youtube.com",
    "youtube.com",
];

const CONTENT_SECURITY_POLICY: &str = "content-security-policy";

/// Where the renderer's files come from.
#[derive(Clone, Debug)]
pub enum Renderer {
    /// The built files Tauri embedded in the app.
    Embedded(tauri::AppHandle),
    /// A folder of built files.
    Folder(PathBuf),
    /// Vite's development server, at this address.
    Vite(Url),
}

/// The policy a page is held to, letting it connect to `connections` beyond its own origin and run
/// script from `scripts` beyond its own.
#[must_use]
pub fn policy(scripts: &[&str], connections: &[&str]) -> String {
    let script_src = ["script-src 'self' 'wasm-unsafe-eval'"]
        .into_iter()
        .chain(scripts.iter().copied())
        .collect::<Vec<_>>()
        .join(" ");
    let connect_src = ["connect-src 'self'"]
        .into_iter()
        .chain(connections.iter().copied())
        .collect::<Vec<_>>()
        .join(" ");
    let frame_src = ["frame-src".to_owned()]
        .into_iter()
        .chain(VIDEO_HOSTS.iter().map(|host| format!("https://{host}")))
        .collect::<Vec<_>>()
        .join(" ");

    [
        "default-src 'self'".to_owned(),
        script_src,
        "style-src 'self' 'unsafe-inline'".to_owned(),
        "img-src 'self' data: blob: https:".to_owned(),
        "media-src 'self' blob:".to_owned(),
        "font-src 'self' data:".to_owned(),
        connect_src,
        "object-src 'none'".to_owned(),
        frame_src,
        "base-uri 'self'".to_owned(),
        "form-action 'none'".to_owned(),
    ]
    .join("; ")
}

/// The policy for this renderer, served from `origin`: the release's own, or in development the
/// release's with Vite's inline scripts and its hot-reload connection allowed as well.
#[must_use]
pub fn policy_for(renderer: &Renderer, origin: &str) -> String {
    let socket = origin.replacen("http://", "ws://", 1);

    match renderer {
        Renderer::Embedded(_) | Renderer::Folder(_) => policy(&[], &[&socket]),
        Renderer::Vite(vite) => {
            let page = vite.origin().ascii_serialization();
            let hot = page
                .replacen("https://", "wss://", 1)
                .replacen("http://", "ws://", 1);

            policy(&["'unsafe-inline'"], &[&socket, &page, &hot])
        }
    }
}

/// The media type of a file, by its extension.
#[must_use]
pub fn type_of(name: &str) -> &'static str {
    match name.rsplit_once('.').map(|(_, extension)| extension) {
        Some("html") => "text/html; charset=utf-8",
        Some("js" | "mjs") => "text/javascript; charset=utf-8",
        Some("css") => "text/css; charset=utf-8",
        Some("json" | "map") => "application/json",
        Some("webmanifest") => "application/manifest+json",
        Some("svg") => "image/svg+xml",
        Some("png") => "image/png",
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("avif") => "image/avif",
        Some("gif") => "image/gif",
        Some("ico") => "image/x-icon",
        Some("woff") => "font/woff",
        Some("woff2") => "font/woff2",
        Some("ttf") => "font/ttf",
        Some("otf") => "font/otf",
        Some("wasm") => "application/wasm",
        Some("txt") => "text/plain; charset=utf-8",
        Some("vtt") => "text/vtt",
        _ => "application/octet-stream",
    }
}

/// What a path asks of the renderer's folder.
#[derive(Debug, PartialEq, Eq)]
pub enum Wanted {
    /// A file at this path within the folder; where it is missing, the page is answered instead
    /// when `is_a_route` says the path names a place in the page rather than a file.
    File {
        /// The file, relative to the folder.
        path: PathBuf,
        /// Whether the path has no extension, so names a place in the page.
        is_a_route: bool,
    },
    /// Nothing that may be served.
    Nothing,
}

/// What `pathname` asks of the renderer's folder: `/` is the page, and a path that would leave the
/// folder asks for nothing.
#[must_use]
pub fn wanted(pathname: &str) -> Wanted {
    let relative = pathname.strip_prefix('/').unwrap_or(pathname);

    if relative.is_empty() {
        return Wanted::File {
            path: PathBuf::from("index.html"),
            is_a_route: false,
        };
    }

    let segments: Vec<&str> = relative.split('/').collect();
    let is_safe = segments.iter().all(|segment| {
        *segment != "." && *segment != ".." && !segment.contains(['\\', ':', '\0', '%'])
    });

    if !is_safe {
        return Wanted::Nothing;
    }

    let last = segments.last().copied().unwrap_or_default();
    let is_a_route = !last.chars().skip(1).any(|c| c == '.');

    Wanted::File {
        path: segments
            .iter()
            .filter(|segment| !segment.is_empty())
            .collect(),
        is_a_route,
    }
}

/// Answers with a page, under the policy.
fn a_page(bytes: Vec<u8>, policy: &str) -> Response {
    let mut response = (
        [
            (
                CONTENT_TYPE,
                HeaderValue::from_static("text/html; charset=utf-8"),
            ),
            (CACHE_CONTROL, HeaderValue::from_static("no-cache")),
        ],
        bytes,
    )
        .into_response();

    if let Ok(policy) = HeaderValue::from_str(policy) {
        response
            .headers_mut()
            .insert(CONTENT_SECURITY_POLICY, policy);
    }

    response
}

/// Answers that there is no such file.
fn missing() -> Response {
    StatusCode::NOT_FOUND.into_response()
}

/// Reads one file from `folder`, where it is a file.
async fn read_from(folder: &Path, path: &Path) -> Option<Vec<u8>> {
    let file = folder.join(path);
    let found = tokio::fs::metadata(&file).await.ok()?;

    if found.is_file() {
        tokio::fs::read(&file).await.ok()
    } else {
        None
    }
}

/// Serves `pathname` from the renderer's `folder`: the file where there is one, the page for a
/// place in it, and nothing for a missing file.
pub async fn from_the_folder(folder: &Path, pathname: &str, policy: &str) -> Response {
    let Wanted::File { path, is_a_route } = wanted(pathname) else {
        return missing();
    };

    if let Some(bytes) = read_from(folder, &path).await {
        let kind = type_of(&path.to_string_lossy());

        return if kind.starts_with("text/html") {
            a_page(bytes, policy)
        } else {
            ([(CONTENT_TYPE, HeaderValue::from_static(kind))], bytes).into_response()
        };
    }

    if !is_a_route {
        return missing();
    }

    match read_from(folder, Path::new("index.html")).await {
        Some(bytes) => a_page(bytes, policy),
        None => missing(),
    }
}

/// Serves `pathname` from the files embedded in the app: the file where there is one, the page
/// for a place in it, and nothing for a missing file. Tauri answers a missing file with the page,
/// so a page that comes back for a file that is not one means the file is missing.
fn from_the_app(app: &tauri::AppHandle, pathname: &str, policy: &str) -> Response {
    let Wanted::File { path, is_a_route } = wanted(pathname) else {
        return missing();
    };
    let Some(asset) = app.asset_resolver().get(pathname.to_owned()) else {
        return missing();
    };
    let name = path.to_string_lossy();
    let is_a_page = asset.mime_type.starts_with("text/html");

    if is_a_page && (is_a_route || name.ends_with(".html")) {
        return a_page(asset.bytes, policy);
    }

    if is_a_page {
        return missing();
    }

    (
        [(CONTENT_TYPE, HeaderValue::from_static(type_of(&name)))],
        asset.bytes,
    )
        .into_response()
}

/// The headers of a page Vite sent, unpacked on the way and so no longer the length it was, and
/// held to the development policy.
#[must_use]
pub fn under_the_policy(from: &HeaderMap, policy: &str) -> HeaderMap {
    let mut headers = answer_headers(from);
    let is_a_page = headers
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|kind| kind.starts_with("text/html"));

    if is_a_page {
        if headers.remove(CONTENT_ENCODING).is_some() {
            headers.remove(CONTENT_LENGTH);
        }

        if let Ok(policy) = HeaderValue::from_str(policy) {
            headers.insert(CONTENT_SECURITY_POLICY, policy);
        }
    }

    headers
}

/// Passes a request for the renderer on to Vite.
async fn from_vite(served: &Served, vite: &Url, request: Request) -> Response {
    let path_and_query = request
        .uri()
        .path_and_query()
        .map_or("/", |path| path.as_str());
    let Ok(onward) = vite.join(path_and_query) else {
        return missing();
    };
    let asked = served
        .pages
        .request(request.method().clone(), onward)
        .headers(crate::upstream::carried(request.headers()))
        .send()
        .await;

    match asked {
        Ok(answer) => {
            let status = answer.status();
            let headers = under_the_policy(answer.headers(), &served.policy);
            let mut response = Response::new(Body::from_stream(answer.bytes_stream()));

            *response.status_mut() = status;
            *response.headers_mut() = headers;
            response
        }
        Err(_) => said(
            StatusCode::BAD_GATEWAY,
            &say(
                "desktop.main.theApplication.thisClientsOwnPagesCouldNot",
                &[("served", vite.as_str())],
            ),
        ),
    }
}

/// Serves the renderer, from wherever it comes from.
pub async fn answer(State(served): State<Served>, request: Request) -> Response {
    match served.renderer.as_ref() {
        Renderer::Embedded(app) => from_the_app(app, request.uri().path(), &served.policy),
        Renderer::Folder(folder) => {
            from_the_folder(folder, request.uri().path(), &served.policy).await
        }
        Renderer::Vite(vite) => from_vite(&served, vite, request).await,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use http_body_util::BodyExt;

    #[test]
    fn holds_a_page_to_the_releases_policy() {
        let policy = policy_for(&Renderer::Folder(PathBuf::new()), "http://127.0.0.1:41847");

        assert_eq!(
            policy,
            "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self' ws://127.0.0.1:41847; object-src 'none'; frame-src https://www.youtube-nocookie.com https://youtube-nocookie.com https://www.youtube.com https://youtube.com; base-uri 'self'; form-action 'none'"
        );
        assert!(!policy.contains("gstatic"));
    }

    #[test]
    fn lets_vite_run_its_scripts_and_reload_in_development() {
        let vite = Url::parse("http://localhost:5174/").expect("an address");
        let policy = policy_for(&Renderer::Vite(vite), "http://127.0.0.1:41847");

        assert!(policy.contains("script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline';"));
        assert!(policy.contains(
            "connect-src 'self' ws://127.0.0.1:41847 http://localhost:5174 ws://localhost:5174;"
        ));
    }

    #[test]
    fn types_files_by_their_extension() {
        assert_eq!(type_of("index.html"), "text/html; charset=utf-8");
        assert_eq!(
            type_of("assets/Main-abc.js"),
            "text/javascript; charset=utf-8"
        );
        assert_eq!(
            type_of("decoders/valence-browser-decoders.wasm"),
            "application/wasm"
        );
        assert_eq!(type_of("fonts/a.woff2"), "font/woff2");
        assert_eq!(type_of("README"), "application/octet-stream");
    }

    #[test]
    fn reads_what_a_path_wants() {
        assert_eq!(
            wanted("/"),
            Wanted::File {
                path: PathBuf::from("index.html"),
                is_a_route: false
            }
        );
        assert_eq!(
            wanted("/assets/Main-abc.js"),
            Wanted::File {
                path: PathBuf::from("assets").join("Main-abc.js"),
                is_a_route: false
            }
        );
        assert_eq!(
            wanted("/library/films"),
            Wanted::File {
                path: PathBuf::from("library").join("films"),
                is_a_route: true
            }
        );
        assert_eq!(
            wanted("/.well-known"),
            Wanted::File {
                path: PathBuf::from(".well-known"),
                is_a_route: true
            }
        );
    }

    #[test]
    fn will_not_leave_the_folder() {
        for pathname in [
            "/../secret",
            "/assets/../../x.js",
            "/./x",
            "/C:/x",
            "/a\\b",
            "/%2e%2e/x",
        ] {
            assert_eq!(wanted(pathname), Wanted::Nothing, "{pathname}");
        }
    }

    async fn body_of(response: Response) -> String {
        let bytes = response
            .into_body()
            .collect()
            .await
            .expect("a body")
            .to_bytes();
        String::from_utf8(bytes.to_vec()).expect("text")
    }

    #[tokio::test]
    async fn serves_files_and_the_page_for_a_route_but_not_for_a_missing_file() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        std::fs::write(folder.path().join("index.html"), "<p>page</p>").expect("written");
        std::fs::create_dir(folder.path().join("assets")).expect("made");
        std::fs::write(folder.path().join("assets").join("a.js"), "let a;").expect("written");

        let page = from_the_folder(folder.path(), "/", "policy").await;

        assert_eq!(page.headers()[CONTENT_SECURITY_POLICY], "policy");
        assert_eq!(body_of(page).await, "<p>page</p>");

        let script = from_the_folder(folder.path(), "/assets/a.js", "policy").await;

        assert_eq!(
            script.headers()[CONTENT_TYPE],
            "text/javascript; charset=utf-8"
        );
        assert!(script.headers().get(CONTENT_SECURITY_POLICY).is_none());
        assert_eq!(body_of(script).await, "let a;");

        let route = from_the_folder(folder.path(), "/library/films", "policy").await;

        assert_eq!(route.status(), StatusCode::OK);
        assert_eq!(body_of(route).await, "<p>page</p>");

        let folder_as_route = from_the_folder(folder.path(), "/assets", "policy").await;

        assert_eq!(body_of(folder_as_route).await, "<p>page</p>");

        let wasm = from_the_folder(folder.path(), "/decoders/missing.wasm", "policy").await;

        assert_eq!(wasm.status(), StatusCode::NOT_FOUND);

        let escaping = from_the_folder(folder.path(), "/../index.html", "policy").await;

        assert_eq!(escaping.status(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn holds_a_vite_page_to_the_policy_and_drops_what_no_longer_holds() {
        let mut from = HeaderMap::new();
        from.insert(CONTENT_TYPE, HeaderValue::from_static("text/html"));
        from.insert(CONTENT_ENCODING, HeaderValue::from_static("gzip"));
        from.insert(CONTENT_LENGTH, HeaderValue::from_static("10"));

        let page = under_the_policy(&from, "policy");

        assert_eq!(page[CONTENT_SECURITY_POLICY], "policy");
        assert!(page.get(CONTENT_ENCODING).is_none());
        assert!(page.get(CONTENT_LENGTH).is_none());

        let mut script = HeaderMap::new();
        script.insert(CONTENT_TYPE, HeaderValue::from_static("text/javascript"));
        script.insert(CONTENT_LENGTH, HeaderValue::from_static("10"));

        let kept = under_the_policy(&script, "policy");

        assert!(kept.get(CONTENT_SECURITY_POLICY).is_none());
        assert_eq!(kept[CONTENT_LENGTH], "10");
    }
}
