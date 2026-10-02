//! Every request that names a file is read through the path map.
//!
//! A transcoder running natively on a Mac is sent the server's container paths
//! and has to find them under the folders they were mounted from. The
//! translation sits on each field rather than in each route, so what has to be
//! true is that every field naming a file carries it: one that does not reads
//! `/media/…` on a machine with no `/media` and fails as a missing file.
//!
//! Its own binary because installing a map is for the life of the process, and
//! the unit tests beside the map need a process with none.

#![allow(clippy::expect_used, clippy::unwrap_used)]

use valence_transcoder::download::DownloadRequest;
use valence_transcoder::fingerprint::FingerprintRequest;
use valence_transcoder::frame::FrameRequest;
use valence_transcoder::path_map::{self, PathMap};
use valence_transcoder::preview::PreviewRequest;
use valence_transcoder::rendition::RenditionRequest;
use valence_transcoder::router::{AudioQuery, FileQuery, ProbeRequest, RenditionPath};
use valence_transcoder::subtitle::SubtitleRequest;
use valence_transcoder::trickplay::TrickplayRequest;

const FILM: &str = "/media/Films/film.mkv";
const SPEC: &str = r#"{
    "inputPath": "/media/Films/film.mkv",
    "startSeconds": 0,
    "segmentSeconds": 4,
    "hardwareAccel": "none",
    "video": {"kind": "copy"},
    "audio": {"kind": "copy"}
}"#;

fn on_the_host(rest: &[&str]) -> String {
    let mut path = std::path::PathBuf::from("/Volumes/Media");

    for part in rest {
        path.push(part);
    }

    path.to_string_lossy().into_owned()
}

fn installed() {
    path_map::install(
        PathMap::parse("/media=/Volumes/Media;/downloads=/Users/someone/Downloads")
            .expect("it parses")
            .expect("it maps something"),
    );
}

#[test]
fn translates_every_field_that_names_a_file() {
    installed();

    let probe: ProbeRequest = serde_json::from_str(&format!(r#"{{"path":"{FILM}"}}"#)).unwrap();
    let file: FileQuery = serde_json::from_str(&format!(r#"{{"path":"{FILM}"}}"#)).unwrap();
    let audio: AudioQuery =
        serde_json::from_str(&format!(r#"{{"path":"{FILM}","kbps":"160"}}"#)).unwrap();
    let preview: PreviewRequest =
        serde_json::from_str(&format!(r#"{{"inputPath":"{FILM}","generation":0}}"#)).unwrap();
    let trickplay: TrickplayRequest = serde_json::from_str(&format!(
        r#"{{"inputPath":"{FILM}","generation":0,"intervalSeconds":10,"tileWidth":320,"columns":10,"rows":10}}"#
    ))
    .unwrap();
    let frame: FrameRequest = serde_json::from_str(&format!(
        r#"{{"inputPath":"{FILM}","atSeconds":60,"width":640}}"#
    ))
    .unwrap();
    let subtitle: SubtitleRequest =
        serde_json::from_str(&format!(r#"{{"inputPath":"{FILM}","streamIndex":2}}"#)).unwrap();
    let fingerprint: FingerprintRequest = serde_json::from_str(&format!(
        r#"{{"inputPath":"{FILM}","startSeconds":0,"durationSeconds":600}}"#
    ))
    .unwrap();
    let download: DownloadRequest = serde_json::from_str(&format!(
        r#"{{"spec":{SPEC},"durationSeconds":5400,"audioStreamIndexes":[1],"subtitleStreamIndexes":[],"generation":0}}"#
    ))
    .unwrap();
    let rendition: RenditionRequest = serde_json::from_str(&format!(
        r#"{{"spec":{SPEC},"carry":{{"audio":[],"subtitleStreamIndexes":[],"colour":{{}},"keepsChapters":true}},"durationSeconds":5400,"outputPath":"/media/Films/.valence/film.mkv"}}"#
    ))
    .unwrap();
    let stopped: RenditionPath =
        serde_json::from_str(r#"{"outputPath":"/media/Films/.valence/film.mkv"}"#).unwrap();

    for (field, translated) in [
        ("probe path", probe.path.as_str()),
        ("file path", file.path.as_str()),
        ("audio path", audio.path.as_str()),
        ("preview input", preview.input_path.as_str()),
        ("trickplay input", trickplay.input_path.as_str()),
        ("frame input", frame.input_path.as_str()),
        ("subtitle input", subtitle.input_path.as_str()),
        ("fingerprint input", fingerprint.input_path.as_str()),
        ("download input", download.spec.input_path.as_str()),
        ("rendition input", rendition.spec.input_path.as_str()),
    ] {
        assert_eq!(translated, on_the_host(&["Films", "film.mkv"]), "{field}");
    }

    for (field, translated) in [
        ("rendition output", rendition.output_path.as_str()),
        ("stopped rendition", stopped.output_path.as_str()),
    ] {
        assert_eq!(
            translated,
            on_the_host(&["Films", ".valence", "film.mkv"]),
            "{field}"
        );
    }
}

#[test]
fn refuses_a_request_for_a_folder_the_map_does_not_hold() {
    installed();

    let refused = serde_json::from_str::<ProbeRequest>(r#"{"path":"/srv/film.mkv"}"#)
        .expect_err("nothing maps /srv");

    assert!(refused.to_string().contains("/srv/film.mkv"), "{refused}");
}
