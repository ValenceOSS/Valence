//! A remote file has to play as a local one does, read through the relay.
//!
//! The unit tests prove the rules a fetch is held to. Only a real Matroska file,
//! served over HTTP with ranges as a remote service serves it, proves that ffprobe
//! reads it through the relay, that its cues give the keyframes a session cuts on,
//! and that a link that stops working is noticed and a fresh one taken up.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use std::collections::HashMap;
use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use axum::body::Body;
use axum::extract::{Path as RoutePath, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use valence_transcoder::remote_input::{self, Remote};

mod common;

/// Serves a film as a remote file service would: ranges answered, and one address that has
/// expired.
async fn a_service(film: PathBuf) -> SocketAddr {
    let bytes = Arc::new(std::fs::read(&film).expect("reads the film"));
    let router = Router::new()
        .route(
            "/f/{name}",
            get(
                |State(bytes): State<Arc<Vec<u8>>>,
                 RoutePath(name): RoutePath<String>,
                 asked: HeaderMap| async move {
                    if name == "expired.mkv" {
                        return StatusCode::GONE.into_response();
                    }

                    let size = bytes.len();
                    let from = asked
                        .get(header::RANGE)
                        .and_then(|range| range.to_str().ok())
                        .and_then(|range| range.strip_prefix("bytes="))
                        .and_then(|range| range.split_once('-'))
                        .map(|(from, to)| {
                            (
                                from.parse::<usize>().unwrap_or(0),
                                to.parse::<usize>().map_or(size - 1, |to| to.min(size - 1)),
                            )
                        });

                    match from {
                        Some((start, end)) => Response::builder()
                            .status(StatusCode::PARTIAL_CONTENT)
                            .header(header::CONTENT_RANGE, format!("bytes {start}-{end}/{size}"))
                            .header(header::CONTENT_LENGTH, end - start + 1)
                            .header(header::ACCEPT_RANGES, "bytes")
                            .body(Body::from(bytes[start..=end].to_vec()))
                            .expect("builds"),
                        None => Response::builder()
                            .header(header::CONTENT_LENGTH, size)
                            .header(header::ACCEPT_RANGES, "bytes")
                            .body(Body::from(bytes.to_vec()))
                            .expect("builds"),
                    }
                },
            ),
        )
        .with_state(bytes);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("binds");
    let address = listener.local_addr().expect("has an address");

    tokio::spawn(async move {
        axum::serve(listener, router).await.expect("serves");
    });

    address
}

fn a_film() -> PathBuf {
    common::generate(
        "remote-relay-film.mkv",
        &[
            "-f",
            "lavfi",
            "-i",
            "testsrc=duration=10:size=320x240:rate=25",
            "-c:v",
            "libx264",
            "-g",
            "50",
            "-keyint_min",
            "50",
            "-pix_fmt",
            "yuv420p",
        ],
    )
}

fn remote(url: &str, size: u64) -> Remote {
    Remote {
        url: url.to_owned(),
        hosts: vec!["*.files.example.test".to_owned()],
        size_bytes: size,
    }
}

#[tokio::test]
async fn plays_a_remote_film_through_the_relay() {
    if !common::is_available() {
        eprintln!("skipped: ffmpeg is not installed");

        return;
    }

    let film = a_film();
    let size = std::fs::metadata(&film).expect("has a size").len();
    let service = a_service(film).await;

    remote_input::install(
        common::scratch("remote-inputs"),
        HashMap::from([("eu1.files.example.test".to_owned(), service)]),
    )
    .await
    .expect("installs");

    let path = remote_input::register(
        "film-1",
        remote("https://eu1.files.example.test/f/film.mkv", size),
    )
    .expect("registers");

    let probe = valence_transcoder::probe::probe_media(&common::ffprobe(), Path::new(&path))
        .await
        .expect("probes through the relay");

    assert!(
        (probe.duration_seconds - 10.0).abs() < 0.5,
        "{}",
        probe.duration_seconds
    );
    assert_eq!(probe.video.expect("has a picture").codec, "h264");

    let keyframes = valence_transcoder::mkv_cues::read_remote_keyframes(|from, length| {
        remote_input::read_stretch("film-1", from, length)
    })
    .await
    .expect("reads the cues");

    assert_eq!(
        keyframes
            .cuts
            .iter()
            .map(|cut| cut.at_seconds.round())
            .collect::<Vec<_>>(),
        vec![0.0, 2.0, 4.0, 6.0, 8.0]
    );

    let relayed = remote_input::relay_address_of(&path).expect("has a relay address");
    let client = reqwest::Client::new();
    let part = client
        .get(&relayed)
        .header(header::RANGE, "bytes=0-99")
        .send()
        .await
        .expect("asks the relay");

    assert_eq!(part.status(), StatusCode::PARTIAL_CONTENT);
    assert_eq!(part.bytes().await.expect("reads").len(), 100);

    remote_input::register(
        "film-1",
        remote("https://eu1.files.example.test/f/expired.mkv", size),
    )
    .expect("registers the new link");

    let gone = client.get(&relayed).send().await.expect("asks the relay");

    assert_eq!(gone.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert!(remote_input::has_expired("film-1"));

    remote_input::register(
        "film-1",
        remote("https://eu1.files.example.test/f/film.mkv", size),
    )
    .expect("registers a fresh link");

    assert!(!remote_input::has_expired("film-1"));
    assert_eq!(
        client.get(&relayed).send().await.expect("asks").status(),
        StatusCode::OK
    );

    remote_input::register(
        "film-1",
        Remote {
            hosts: vec!["other.example.test".to_owned()],
            ..remote("https://eu1.files.example.test/f/film.mkv", size)
        },
    )
    .expect("registers a link to a host it may not reach");

    assert_eq!(
        client.get(&relayed).send().await.expect("asks").status(),
        StatusCode::BAD_GATEWAY
    );

    refuses_addresses_written_as_numbers(&client, &relayed, size).await;
}

/// Checks the relay will not fetch a link to a private address written as numbers, whatever the
/// hosts registered with it say.
async fn refuses_addresses_written_as_numbers(client: &reqwest::Client, relayed: &str, size: u64) {
    for private in [
        "https://127.0.0.1/f/film.mkv",
        "https://0xa.0.0.5/f/film.mkv",
        "https://[::1]/f/film.mkv",
    ] {
        remote_input::register(
            "film-1",
            Remote {
                hosts: vec![
                    "*.files.example.test".to_owned(),
                    "127.0.0.1".to_owned(),
                    "10.0.0.5".to_owned(),
                    "[::1]".to_owned(),
                    "::1".to_owned(),
                ],
                ..remote(private, size)
            },
        )
        .expect("registers a link to an address written as numbers");

        assert_eq!(
            client.get(relayed).send().await.expect("asks").status(),
            StatusCode::BAD_GATEWAY,
            "{private}"
        );
    }
}
