//! What keeping a film's scrubbing thumbnails takes, as `trickplayToKeep` in the shared client
//! works it out: the index as the server wrote it, and each sheet it names with where it is served.

use crate::serve::held_file::is_a_sheet_name;
use crate::upstream::Upstream;
use reqwest::Method;
use serde::Deserialize;

/// The thumbnails to keep for one film.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TrickplayToKeep {
    pub(crate) vtt: String,
    pub(crate) sheets: Vec<Sheet>,
}

/// One sheet of thumbnails: the name it is kept under, and where the server has it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Sheet {
    pub(crate) name: String,
    pub(crate) from: String,
}

/// What the server says when asked for a film's thumbnails.
#[derive(Deserialize)]
struct Index {
    url: String,
}

/// Asks the server for a film's thumbnails, or nothing where there are none yet or a sheet's name
/// would reach outside the folder it is kept in.
pub async fn trickplay_to_keep(upstream: &Upstream, media_id: &str) -> Option<TrickplayToKeep> {
    let asking = upstream.request(Method::POST, &format!("/api/playback/{media_id}/trickplay"))?;
    let asked = upstream
        .send(asking)
        .await
        .ok()
        .filter(|answer| answer.status().is_success())?;

    let Index { url } = asked.json::<Index>().await.ok()?;

    let vtt = upstream
        .send(upstream.request(Method::GET, &url)?)
        .await
        .ok()
        .filter(|answer| answer.status().is_success())?
        .text()
        .await
        .ok()?;

    let mut sheets: Vec<Sheet> = Vec::new();

    for name in sheet_names(&vtt) {
        if !is_a_sheet_name(&name) {
            return None;
        }

        if sheets.iter().all(|sheet| sheet.name != name) {
            sheets.push(Sheet {
                from: sheet_address(&name, &url),
                name,
            });
        }
    }

    (!sheets.is_empty()).then_some(TrickplayToKeep { vtt, sheets })
}

/// The sheet each cue of a thumbnail index points at, in order, as `parseTrickplayIndex` reads them.
fn sheet_names(vtt: &str) -> Vec<String> {
    let lines: Vec<&str> = vtt.lines().collect();

    lines
        .iter()
        .enumerate()
        .filter_map(|(at, line)| {
            let (from, to) = line.split_once("-->")?;

            if !is_a_timestamp(from) || !is_a_timestamp(to.split("-->").next().unwrap_or_default())
            {
                return None;
            }

            sheet_of(lines.get(at + 1).copied().unwrap_or_default())
        })
        .collect()
}

/// Whether text holds a `WebVTT` timestamp with hours, `H:MM:SS` with an optional fraction.
fn is_a_timestamp(said: &str) -> bool {
    let said = said.trim();

    said.char_indices().any(|(at, _)| {
        let mut parts = said[at..].splitn(3, ':');
        let (Some(hours), Some(minutes), Some(rest)) = (parts.next(), parts.next(), parts.next())
        else {
            return false;
        };

        hours
            .bytes()
            .last()
            .is_some_and(|digit| digit.is_ascii_digit())
            && minutes.len() == 2
            && minutes.bytes().all(|digit| digit.is_ascii_digit())
            && rest.len() >= 2
            && rest.bytes().take(2).all(|digit| digit.is_ascii_digit())
    })
}

/// The sheet a cue's payload names, where it names a tile of four finite numbers.
fn sheet_of(payload: &str) -> Option<String> {
    let mut parts = payload.trim().split("#xywh=");
    let name = parts.next().unwrap_or_default();
    let fragment = parts.next()?;
    let numbers: Vec<&str> = fragment.split(',').collect();

    let all_finite = numbers.iter().all(|number| {
        let number = number.trim();
        number.is_empty() || number.parse::<f64>().is_ok_and(f64::is_finite)
    });

    (numbers.len() == 4 && all_finite).then(|| name.to_owned())
}

/// Where a sheet named in the index is served: beside the index, as a browser would resolve it.
fn sheet_address(name: &str, index_url: &str) -> String {
    let path = index_url.split(['?', '#']).next().unwrap_or_default();
    let folder = path.rfind('/').map_or("", |slash| &path[..=slash]);

    format!("{folder}{name}")
}

#[cfg(test)]
mod tests {
    use super::{sheet_address, sheet_names};

    const VTT: &str = "WEBVTT\n\n00:00:00.000 --> 00:00:10.000\nsheet-001.jpg#xywh=0,0,320,180\n\n00:16:40.000 --> 00:16:50.000\nsheet-002.jpg#xywh=320,0,320,180\n\n00:16:50.000 --> 00:17:00.000\nsheet-002.jpg#xywh=640,0,320,180\n";

    #[test]
    fn reads_the_sheet_of_every_cue() {
        assert_eq!(
            sheet_names(VTT),
            vec!["sheet-001.jpg", "sheet-002.jpg", "sheet-002.jpg"]
        );
    }

    #[test]
    fn passes_over_a_cue_without_a_tile() {
        assert_eq!(
            sheet_names("WEBVTT\n\n00:00:00.000 --> 00:00:10.000\nsheet-001.jpg\n"),
            Vec::<String>::new()
        );
    }

    #[test]
    fn passes_over_a_cue_whose_times_cannot_be_read() {
        assert_eq!(
            sheet_names("WEBVTT\n\n00:00.000 --> 00:10.000\nsheet-001.jpg#xywh=0,0,1,1\n"),
            Vec::<String>::new()
        );
    }

    #[test]
    fn finds_a_sheet_beside_the_index() {
        assert_eq!(
            sheet_address(
                "sheet-001.jpg",
                "/api/playback/trickplay/t1/thumbnails.vtt?v=2"
            ),
            "/api/playback/trickplay/t1/sheet-001.jpg"
        );
    }
}
