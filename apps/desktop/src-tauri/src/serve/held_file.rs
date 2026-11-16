//! Serves the files this computer is holding to the player in the window, read straight off the
//! disk, in whatever part the player asks for.
//!
//! The path asked for is held to the exact shapes the page uses, because a path built from
//! whatever the page sent is how a page reads the rest of the disk: a download id must be a UUID,
//! and a thumbnail or listening file's name is held to a few safe characters and may not start
//! with a dot.

use std::io::SeekFrom;
use std::path::{Path, PathBuf};

use axum::body::Body;
use axum::extract::{Request, State};
use axum::http::header::{ACCEPT_RANGES, CONTENT_LENGTH, CONTENT_RANGE, CONTENT_TYPE, RANGE};
use axum::http::{HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use tokio_util::io::ReaderStream;

use super::Served;
use crate::paths::{file_kept, listening_kept, poster_kept, trickplay_kept};
use crate::say::say;

/// A held file asked for: where it is, and what kind of thing it is.
#[derive(Debug, PartialEq, Eq)]
pub struct Asked {
    /// Where the file is.
    pub path: PathBuf,
    /// Its media type.
    pub kind: &'static str,
}

/// A part of a file, from one byte to another, both included.
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct Part {
    /// The first byte.
    pub from: u64,
    /// The last byte.
    pub to: u64,
}

/// The media type of a listening file, by its extension.
fn listening_kind(name: &str) -> &'static str {
    match name.rsplit('.').next().unwrap_or_default() {
        "flac" => "audio/flac",
        "mp3" => "audio/mpeg",
        "m4a" | "m4b" => "audio/mp4",
        "aac" => "audio/aac",
        "ogg" | "opus" => "audio/ogg",
        "wav" => "audio/wav",
        "jpg" => "image/jpeg",
        _ => "application/octet-stream",
    }
}

/// Whether `id` is a UUID as zod's `uuid()` reads one: eight, four, four, four and twelve hex
/// digits, a version from 1 to 8 and the RFC's variant, or the nil or max UUID.
#[must_use]
pub fn is_a_uuid(id: &str) -> bool {
    let groups: Vec<&str> = id.split('-').collect();
    let is_shaped = groups.len() == 5
        && groups.iter().zip([8, 4, 4, 4, 12]).all(|(group, length)| {
            group.len() == length && group.chars().all(|c| c.is_ascii_hexdigit())
        });

    if !is_shaped {
        return false;
    }

    let lowered = id.to_ascii_lowercase();

    if lowered == "00000000-0000-0000-0000-000000000000"
        || lowered == "ffffffff-ffff-ffff-ffff-ffffffffffff"
    {
        return true;
    }

    let version = groups[2].chars().next();
    let variant = groups[3].chars().next();

    matches!(version, Some('1'..='8')) && matches!(variant, Some('8' | '9' | 'a' | 'b' | 'A' | 'B'))
}

/// Whether `name` is a safe listening file name: lowercase letters, digits, dots and dashes, not
/// starting with a dot or a dash.
#[must_use]
pub fn is_a_listening_name(name: &str) -> bool {
    let mut chars = name.chars();

    chars
        .next()
        .is_some_and(|first| first.is_ascii_lowercase() || first.is_ascii_digit())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '.' || c == '-')
}

/// Whether `name` is a safe thumbnail sheet name: letters, digits, dots, dashes and underscores,
/// not starting with a dot.
#[must_use]
pub fn is_a_sheet_name(name: &str) -> bool {
    let is_allowed = |c: char| c.is_ascii_alphanumeric() || c == '_' || c == '-';
    let mut chars = name.chars();

    chars.next().is_some_and(is_allowed) && chars.all(|c| is_allowed(c) || c == '.')
}

/// Which file under `folder` the address `pathname` asks for, if it is a held file at all.
#[must_use]
pub fn what_was_asked(folder: &Path, pathname: &str) -> Option<Asked> {
    let rest = pathname.strip_prefix("/held/")?;

    if let Some(name) = rest.strip_prefix("listening/") {
        return is_a_listening_name(name).then(|| Asked {
            path: listening_kept(folder, name),
            kind: listening_kind(name),
        });
    }

    let (download_id, what) = rest.split_at(rest.find('/').unwrap_or(rest.len()));

    if !is_a_uuid(download_id) {
        return None;
    }

    match what {
        "" => Some(Asked {
            path: file_kept(folder, download_id),
            kind: "video/mp4",
        }),
        "/poster" => Some(Asked {
            path: poster_kept(folder, download_id),
            kind: "image/jpeg",
        }),
        _ => {
            let sheet = what.strip_prefix("/trickplay/")?;

            is_a_sheet_name(sheet).then(|| Asked {
                path: trickplay_kept(folder, download_id).join(sheet),
                kind: if Path::new(sheet)
                    .extension()
                    .is_some_and(|extension| extension.eq_ignore_ascii_case("vtt"))
                {
                    "text/vtt"
                } else {
                    "image/jpeg"
                },
            })
        }
    }
}

/// Reads a run of digits, as large as it says and no larger than the largest number there is.
fn digits(text: &str) -> Option<u64> {
    if text.is_empty() || !text.chars().all(|c| c.is_ascii_digit()) {
        return None;
    }

    Some(text.parse().unwrap_or(u64::MAX))
}

/// Which part of a file of `size` bytes `range` asks for, or nothing where the whole file was
/// wanted: an open-ended ask means to the end, a suffix means the last so many bytes, and an ask
/// starting past the end is answered with the whole file.
#[must_use]
pub fn which_part(range: Option<&str>, size: u64) -> Option<Part> {
    let asked = range?.strip_prefix("bytes=")?;
    let (from, to) = asked.split_once('-')?;

    if size == 0
        || (!from.is_empty() && digits(from).is_none())
        || (!to.is_empty() && digits(to).is_none())
    {
        return None;
    }

    if from.is_empty() {
        let how_much = digits(to).filter(|how_much| *how_much > 0)?;

        return Some(Part {
            from: size.saturating_sub(how_much),
            to: size - 1,
        });
    }

    let from = digits(from)?;

    if from >= size {
        return None;
    }

    let to = digits(to).map_or(size - 1, |to| to.min(size - 1));

    (to >= from).then_some(Part { from, to })
}

/// Answers with a plain refusal in words.
fn not_found(key: &str) -> Response {
    (
        StatusCode::NOT_FOUND,
        [(
            CONTENT_TYPE,
            HeaderValue::from_static("text/plain; charset=utf-8"),
        )],
        say(key, &[]),
    )
        .into_response()
}

/// Serves a held file, or the part of it the player asked for.
pub async fn answer(State(served): State<Served>, request: Request) -> Response {
    let range = request
        .headers()
        .get(RANGE)
        .and_then(|value| value.to_str().ok())
        .map(str::to_owned);

    serve(&served.held, request.uri().path(), range.as_deref()).await
}

/// Serves the held file under `folder` that `pathname` asks for, in the part `range` asks for.
pub async fn serve(folder: &Path, pathname: &str, range: Option<&str>) -> Response {
    let Some(asked) = what_was_asked(folder, pathname) else {
        return not_found("desktop.main.aHeldFile.notAHeldFile");
    };
    let Ok(mut file) = tokio::fs::File::open(&asked.path).await else {
        return not_found("desktop.main.aHeldFile.thisClientIsNotHoldingThat");
    };
    let size = match file.metadata().await {
        Ok(found) if found.is_file() => found.len(),
        _ => return not_found("desktop.main.aHeldFile.thisClientIsNotHoldingThat"),
    };
    let kind = HeaderValue::from_static(asked.kind);
    let whole = HeaderValue::from_static("bytes");

    let Some(part) = which_part(range, size) else {
        return (
            StatusCode::OK,
            [
                (CONTENT_TYPE, kind),
                (ACCEPT_RANGES, whole),
                (CONTENT_LENGTH, HeaderValue::from(size)),
            ],
            Body::from_stream(ReaderStream::new(file)),
        )
            .into_response();
    };

    if file.seek(SeekFrom::Start(part.from)).await.is_err() {
        return not_found("desktop.main.aHeldFile.thisClientIsNotHoldingThat");
    }

    let length = part.to - part.from + 1;
    let content_range = format!("bytes {}-{}/{size}", part.from, part.to);

    (
        StatusCode::PARTIAL_CONTENT,
        [
            (CONTENT_TYPE, kind),
            (ACCEPT_RANGES, whole),
            (CONTENT_LENGTH, HeaderValue::from(length)),
            (
                CONTENT_RANGE,
                HeaderValue::from_str(&content_range)
                    .unwrap_or(HeaderValue::from_static("bytes */0")),
            ),
        ],
        Body::from_stream(ReaderStream::new(file.take(length))),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use http_body_util::BodyExt;

    #[test]
    fn lets_no_sheet_name_climb_out_of_its_folder() {
        assert!(is_a_sheet_name("sheet-001.jpg"));
        assert!(is_a_sheet_name("_a"));
        assert!(!is_a_sheet_name(".hidden"));
        assert!(!is_a_sheet_name("../up.jpg"));
        assert!(!is_a_sheet_name("a/b.jpg"));
        assert!(!is_a_sheet_name(""));
    }

    #[test]
    fn lets_through_only_listening_names_the_schema_allows() {
        assert!(is_a_listening_name("track-01.flac"));
        assert!(!is_a_listening_name("-track.flac"));
        assert!(!is_a_listening_name(".track.flac"));
        assert!(!is_a_listening_name("Track.flac"));
        assert!(!is_a_listening_name("../track.flac"));
        assert!(!is_a_listening_name(""));
    }

    const ID: &str = "0b7a3b9e-4f0c-4c3e-9d2a-1f2e3d4c5b6a";

    #[test]
    fn knows_a_uuid() {
        assert!(is_a_uuid(ID));
        assert!(is_a_uuid("0B7A3B9E-4F0C-4C3E-9D2A-1F2E3D4C5B6A"));
        assert!(is_a_uuid("00000000-0000-0000-0000-000000000000"));
        assert!(!is_a_uuid("0b7a3b9e-4f0c-0c3e-9d2a-1f2e3d4c5b6a"));
        assert!(!is_a_uuid("0b7a3b9e-4f0c-4c3e-7d2a-1f2e3d4c5b6a"));
        assert!(!is_a_uuid("0b7a3b9e4f0c-4c3e-9d2a-1f2e3d4c5b6a-"));
        assert!(!is_a_uuid("../../../../etc/passwd-aaaaaaaaaaaaa"));
    }

    #[test]
    fn finds_a_film_its_poster_and_its_thumbnails() {
        let folder = Path::new("/held");

        assert_eq!(
            what_was_asked(folder, &format!("/held/{ID}")),
            Some(Asked {
                path: folder.join(format!("{ID}.mp4")),
                kind: "video/mp4"
            })
        );
        assert_eq!(
            what_was_asked(folder, &format!("/held/{ID}/poster")).map(|a| a.kind),
            Some("image/jpeg")
        );
        assert_eq!(
            what_was_asked(folder, &format!("/held/{ID}/trickplay/index.vtt")),
            Some(Asked {
                path: folder.join(format!("{ID}.trickplay")).join("index.vtt"),
                kind: "text/vtt"
            })
        );
        assert_eq!(
            what_was_asked(folder, &format!("/held/{ID}/trickplay/sheet_1.jpg")).map(|a| a.kind),
            Some("image/jpeg")
        );
    }

    #[test]
    fn finds_a_listening_file_by_its_extension() {
        let folder = Path::new("/held");

        assert_eq!(
            what_was_asked(folder, "/held/listening/track-1.flac"),
            Some(Asked {
                path: folder.join("listening").join("track-1.flac"),
                kind: "audio/flac"
            })
        );
        assert_eq!(
            what_was_asked(folder, "/held/listening/book.m4b").map(|a| a.kind),
            Some("audio/mp4")
        );
        assert_eq!(
            what_was_asked(folder, "/held/listening/x.bin").map(|a| a.kind),
            Some("application/octet-stream")
        );
    }

    #[test]
    fn will_not_climb_out_of_the_folder() {
        let folder = Path::new("/held");

        for pathname in [
            "/held/../secret",
            "/held/listening/../../etc/passwd",
            "/held/listening/.hidden",
            "/held/listening/Upper.mp3",
            "/held/listening/a/b.mp3",
            &format!("/held/{ID}/trickplay/../../secret"),
            &format!("/held/{ID}/trickplay/.hidden"),
            &format!("/held/{ID}/trickplay/a/b"),
            &format!("/held/{ID}/trickplay/%2e%2e"),
            &format!("/held/{ID}/other"),
            &format!("/held/{ID}/poster/x"),
            "/held/not-a-download",
            "/elsewhere",
        ] {
            assert_eq!(what_was_asked(folder, pathname), None, "{pathname}");
        }
    }

    #[test]
    fn reads_which_part_was_asked_for() {
        assert_eq!(which_part(None, 100), None);
        assert_eq!(
            which_part(Some("bytes=0-9"), 100),
            Some(Part { from: 0, to: 9 })
        );
        assert_eq!(
            which_part(Some("bytes=10-"), 100),
            Some(Part { from: 10, to: 99 })
        );
        assert_eq!(
            which_part(Some("bytes=90-500"), 100),
            Some(Part { from: 90, to: 99 })
        );
        assert_eq!(
            which_part(Some("bytes=-10"), 100),
            Some(Part { from: 90, to: 99 })
        );
        assert_eq!(
            which_part(Some("bytes=-500"), 100),
            Some(Part { from: 0, to: 99 })
        );
        assert_eq!(
            which_part(Some("bytes=5-99999999999999999999999"), 100),
            Some(Part { from: 5, to: 99 })
        );
    }

    #[test]
    fn answers_nonsense_with_the_whole_file() {
        assert_eq!(which_part(Some("bytes=100-"), 100), None);
        assert_eq!(which_part(Some("bytes=-0"), 100), None);
        assert_eq!(which_part(Some("bytes=-"), 100), None);
        assert_eq!(which_part(Some("bytes=50-10"), 100), None);
        assert_eq!(which_part(Some("bytes=a-b"), 100), None);
        assert_eq!(which_part(Some("items=0-9"), 100), None);
        assert_eq!(which_part(Some("bytes=0-9,20-29"), 100), None);
        assert_eq!(which_part(Some("bytes=0-"), 0), None);
    }

    async fn body_of(response: Response) -> Vec<u8> {
        response
            .into_body()
            .collect()
            .await
            .expect("a body")
            .to_bytes()
            .to_vec()
    }

    #[tokio::test]
    async fn serves_a_file_whole_or_in_part() {
        let folder = tempfile::tempdir().expect("a temporary folder");
        let bytes: Vec<u8> = (0..=255).collect();
        std::fs::write(folder.path().join(format!("{ID}.mp4")), &bytes).expect("written");

        let whole = serve(folder.path(), &format!("/held/{ID}"), None).await;

        assert_eq!(whole.status(), StatusCode::OK);
        assert_eq!(whole.headers()[CONTENT_LENGTH], "256");
        assert_eq!(whole.headers()[ACCEPT_RANGES], "bytes");
        assert_eq!(whole.headers()[CONTENT_TYPE], "video/mp4");
        assert_eq!(body_of(whole).await, bytes);

        let part = serve(folder.path(), &format!("/held/{ID}"), Some("bytes=10-19")).await;

        assert_eq!(part.status(), StatusCode::PARTIAL_CONTENT);
        assert_eq!(part.headers()[CONTENT_RANGE], "bytes 10-19/256");
        assert_eq!(part.headers()[CONTENT_LENGTH], "10");
        assert_eq!(body_of(part).await, (10..20).collect::<Vec<u8>>());
    }

    #[tokio::test]
    async fn refuses_what_it_is_not_holding() {
        let folder = tempfile::tempdir().expect("a temporary folder");

        let missing = serve(folder.path(), &format!("/held/{ID}"), None).await;
        let wrong = serve(folder.path(), "/held/nothing", None).await;

        assert_eq!(missing.status(), StatusCode::NOT_FOUND);
        assert_eq!(
            String::from_utf8(body_of(missing).await).ok().as_deref(),
            Some("That isn’t downloaded on this device.")
        );
        assert_eq!(wrong.status(), StatusCode::NOT_FOUND);
        assert_eq!(
            String::from_utf8(body_of(wrong).await).ok().as_deref(),
            Some("Not a downloaded file.")
        );
    }
}
