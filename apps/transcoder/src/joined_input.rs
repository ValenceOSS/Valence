//! A film kept as several files, read as one.
//!
//! Some films come split across files — `cd1` and `cd2`, `part1` and `part2` —
//! and play as one title. The server names every part in order wherever it
//! would name a file, and this writes the list that has ffmpeg's concat demuxer
//! read them as one input with one timeline: keyframes, seeking, segment
//! numbering and every other reader of the input then work as they do on a
//! single file.
//!
//! The list is written here rather than by the server because the parts' paths
//! are only known on this side once the path map has translated them, and
//! because the server may not share this service's disk at all. It is named by
//! what would make it wrong — each part's path, size and modified time — so a
//! part replaced in place gets a new list, and everything addressed by the
//! input's own address is read again.

use std::fmt::Write as _;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::OnceLock;
use std::time::UNIX_EPOCH;

use sha2::{Digest, Sha256};

/// The extension every list this service writes ends in.
pub const EXTENSION: &str = "ffconcat";

/// The folder, under the transcode cache, that lists are written into.
pub const FOLDER_NAME: &str = "joined";

/// What reads a list as the parts it joins: the concat demuxer, told that the
/// parts' absolute paths are allowed.
pub const CONCAT_INPUT: [&str; 4] = ["-f", "concat", "-safe", "0"];

static FOLDER: OnceLock<PathBuf> = OnceLock::new();

/// Numbers each list written, so two requests writing the same list at once
/// never write into the same temporary file.
static WRITES: AtomicU64 = AtomicU64::new(0);

/// Names the folder lists are written into.
///
/// Called once, at startup, before anything is listening.
pub fn install(folder: PathBuf) {
    let _ = FOLDER.set(folder);
}

/// Whether a path is a list this service wrote, rather than a file of a library.
///
/// Only a file directly in the folder lists are written to counts, so a path
/// climbing out of it with `..` is never taken for one.
#[must_use]
pub fn is_joined(path: &str) -> bool {
    FOLDER.get().is_some_and(|folder| {
        let path = Path::new(path);

        path.parent() == Some(folder.as_path())
            && path
                .extension()
                .is_some_and(|extension| extension == EXTENSION)
    })
}

/// An ffmpeg or ffprobe command line with every input that is a list of parts
/// read through the concat demuxer, every remote input read through the relay,
/// and every other input left as it was.
///
/// Applied to a finished command line rather than threaded through each
/// builder, so every builder that names its input with `-i` reads a film's
/// parts as one input without knowing it can be one. Paths are absolute, which
/// the demuxer calls unsafe, hence `-safe 0`.
#[must_use]
pub fn opened(arguments: Vec<String>) -> Vec<String> {
    let mut read = Vec::with_capacity(arguments.len() + 4);
    let mut arguments = arguments.into_iter().peekable();

    while let Some(argument) = arguments.next() {
        if argument == "-i" && arguments.peek().is_some_and(|input| is_joined(input)) {
            read.extend(CONCAT_INPUT.map(str::to_owned));
        } else if argument == "-i" {
            if let Some(relayed) = arguments
                .peek()
                .and_then(|input| crate::remote_input::relay_address_of(input))
            {
                arguments.next();
                read.extend(crate::remote_input::RELAY_INPUT.map(str::to_owned));
                read.push(argument);
                read.push(relayed);

                continue;
            }
        }

        read.push(argument);
    }

    read
}

/// What ffprobe is to read: a list of parts through the concat demuxer, a
/// remote input through the relay, and any other file as itself.
#[must_use]
pub fn probed(path: &Path) -> Vec<std::ffi::OsString> {
    if let Some(relayed) = path
        .to_str()
        .and_then(crate::remote_input::relay_address_of)
    {
        crate::remote_input::RELAY_INPUT
            .into_iter()
            .map(std::ffi::OsString::from)
            .chain([std::ffi::OsString::from(relayed)])
            .collect()
    } else if path.to_str().is_some_and(is_joined) {
        CONCAT_INPUT
            .into_iter()
            .map(std::ffi::OsString::from)
            .chain([path.as_os_str().to_owned()])
            .collect()
    } else {
        vec![path.as_os_str().to_owned()]
    }
}

/// The first part a list joins, for what the demuxer reports only as `concat`
/// but every part shares, such as the container they were written in.
#[must_use]
pub fn first_part(path: &Path) -> Option<PathBuf> {
    parts_of(path)?.into_iter().next()
}

/// Every part a list this service wrote joins, in order.
///
/// What decides whether the list may be read: it may where every part it names
/// may, so a list is never a way to reach a file outside the roots the parts
/// are checked against. Read exactly as [`join`] writes it — a header, then a
/// `file` line and a `duration` line for each part — and nothing at all where
/// it holds anything else, since the demuxer would read a line written any
/// other way that this would pass over.
#[must_use]
pub fn parts_of(path: &Path) -> Option<Vec<PathBuf>> {
    if !path.to_str().is_some_and(is_joined) {
        return None;
    }

    let written = std::fs::read_to_string(path).ok()?;
    let mut lines = written.lines().filter(|line| !line.is_empty());

    if lines.next()? != "ffconcat version 1.0" {
        return None;
    }

    let mut parts = Vec::new();

    while let Some(line) = lines.next() {
        let part = unquoted(line.strip_prefix("file ")?)?;
        let duration = lines.next()?.strip_prefix("duration ")?;

        duration.parse::<f64>().ok()?;
        parts.push(PathBuf::from(part));
    }

    (!parts.is_empty()).then_some(parts)
}

/// A path read back the way [`quoted`] wrote it, or nothing where it was not
/// written that way.
fn unquoted(written: &str) -> Option<String> {
    let inner = written.strip_prefix('\'')?.strip_suffix('\'')?;

    (!inner.replace(r"'\''", "").contains('\'')).then(|| inner.replace(r"'\''", "'"))
}

/// A part's path written the way the concat demuxer reads a quoted path, with
/// any single quote closed, escaped and opened again.
fn quoted(path: &str) -> String {
    format!("'{}'", path.replace('\'', r"'\''"))
}

/// One file of a film kept as several, and how long it plays.
///
/// The length is the one the server read when it scanned the part. The demuxer
/// is told it rather than left to work it out, since what it works out on its
/// own leaves the whole with no length and every later part's timeline a few
/// hundredths of a second off the keyframes the session cuts on.
#[derive(Debug, Clone, PartialEq, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Part {
    /// Where the part is, already translated.
    pub path: String,
    /// How long it plays, in seconds.
    pub duration_seconds: f64,
}

/// Writes the list that reads some parts as one input, and answers its path.
///
/// One part is answered as itself, so a request naming one file in a list is
/// read exactly as one naming it alone.
///
/// # Errors
///
/// Where there is no part, a part cannot be read or has a line break in its
/// path, the folder was never installed, or the list cannot be written. The
/// list is read a line at a time, so a line break would let a folder's name
/// write lines of its own into it.
pub fn join(parts: &[Part]) -> Result<String, String> {
    match parts {
        [] => return Err("a joined input names no part".to_owned()),
        [only] => return Ok(only.path.clone()),
        _ => {}
    }

    let folder = FOLDER
        .get()
        .ok_or_else(|| "joined inputs are not set up".to_owned())?;
    let mut hasher = Sha256::new();
    let mut body = String::from("ffconcat version 1.0\n");

    for Part {
        path: part,
        duration_seconds,
    } in parts
    {
        if part.contains(['\n', '\r']) {
            return Err(format!("{part}: a part's path holds a line break"));
        }

        let metadata = std::fs::metadata(part).map_err(|error| format!("{part}: {error}"))?;
        let modified = metadata
            .modified()
            .ok()
            .and_then(|at| at.duration_since(UNIX_EPOCH).ok())
            .map_or(0, |since| since.as_nanos());

        hasher.update(part.as_bytes());
        hasher.update([0]);
        hasher.update(metadata.len().to_be_bytes());
        hasher.update(modified.to_be_bytes());
        hasher.update(duration_seconds.to_be_bytes());
        let _ = writeln!(body, "file {}\nduration {duration_seconds}", quoted(part));
    }

    let mut name = String::new();

    for byte in hasher.finalize() {
        let _ = write!(name, "{byte:02x}");
    }

    let list = folder.join(format!("{name}.{EXTENSION}"));

    if !list.exists() {
        std::fs::create_dir_all(folder).map_err(|error| error.to_string())?;

        let written = folder.join(format!(
            "{name}.{}.{}",
            std::process::id(),
            WRITES.fetch_add(1, Ordering::Relaxed)
        ));

        std::fs::write(&written, body).map_err(|error| error.to_string())?;

        if let Err(error) = std::fs::rename(&written, &list) {
            let _ = std::fs::remove_file(&written);

            if !list.exists() {
                return Err(error.to_string());
            }
        }
    }

    Ok(list.to_string_lossy().into_owned())
}

/// The one folder every test in this crate installs, since a folder can be
/// installed only once and the tests run side by side.
#[cfg(test)]
#[must_use]
pub fn test_folder() -> PathBuf {
    let folder = std::env::temp_dir().join("valence-joined-input-tests");

    install(folder.clone());

    folder
}

#[cfg(test)]
mod tests {
    use super::{is_joined, join, opened, probed, quoted, Part};

    fn part(path: &str, duration_seconds: f64) -> Part {
        Part {
            path: path.to_owned(),
            duration_seconds,
        }
    }

    fn installed() -> std::path::PathBuf {
        super::test_folder()
    }

    fn a_part(name: &str, bytes: &[u8]) -> String {
        let folder = std::env::temp_dir().join("valence-joined-input-parts");

        std::fs::create_dir_all(&folder).expect("makes the folder");

        let path = folder.join(name);

        std::fs::write(&path, bytes).expect("writes the part");

        path.to_string_lossy().into_owned()
    }

    #[test]
    fn answers_one_part_as_itself() {
        installed();

        let only = a_part("only.mkv", b"one");

        assert_eq!(join(&[part(&only, 20.0)]), Ok(only.clone()));
        assert_eq!(
            probed(std::path::Path::new(&only)),
            vec![std::ffi::OsString::from(&only)]
        );
        assert_eq!(
            opened(vec!["-i".to_owned(), only.clone()]),
            vec!["-i".to_owned(), only]
        );
    }

    #[test]
    fn writes_a_list_that_ffmpeg_reads_as_one_input() {
        let folder = installed();
        let first = a_part("Film - cd1.mkv", b"first");
        let second = a_part("Film's - cd2.mkv", b"second");

        let list = join(&[part(&first, 20.0), part(&second, 21.5)]).expect("joins them");
        let written = std::fs::read_to_string(&list).expect("reads the list");

        assert!(list.starts_with(&folder.to_string_lossy().into_owned()));
        assert!(is_joined(&list));
        assert_eq!(
            written,
            format!(
                "ffconcat version 1.0\nfile {}\nduration 20\nfile {}\nduration 21.5\n",
                quoted(&first),
                quoted(&second)
            )
        );
        assert_eq!(
            opened(vec![
                "-ss".to_owned(),
                "28".to_owned(),
                "-i".to_owned(),
                list.clone(),
                "-c".to_owned(),
                "copy".to_owned(),
            ]),
            ["-ss", "28", "-f", "concat", "-safe", "0", "-i", &list, "-c", "copy"]
        );
    }

    #[test]
    fn names_a_new_list_once_a_part_is_written_over() {
        installed();

        let first = a_part("Changing - cd1.mkv", b"first");
        let second = a_part("Changing - cd2.mkv", b"second");
        let before = join(&[part(&first, 20.0), part(&second, 20.0)]).expect("joins them");

        a_part("Changing - cd2.mkv", b"second, re-released");

        let after = join(&[part(&first, 20.0), part(&second, 20.0)]).expect("joins them again");

        assert_ne!(before, after);
    }

    #[test]
    fn refuses_a_part_that_is_not_there() {
        installed();

        let first = a_part("Present - cd1.mkv", b"first");

        assert!(join(&[part(&first, 20.0), part("/nowhere/Absent - cd2.mkv", 20.0)]).is_err());
    }

    #[test]
    fn reads_back_the_first_part_of_a_list() {
        installed();

        let first = a_part("It's - cd1.mkv", b"first");
        let second = a_part("It's - cd2.mkv", b"second");
        let list = join(&[part(&first, 20.0), part(&second, 20.0)]).expect("joins them");

        assert_eq!(
            super::first_part(std::path::Path::new(&list)),
            Some(std::path::PathBuf::from(&first))
        );
        assert_eq!(super::first_part(std::path::Path::new(&first)), None);
    }

    #[test]
    fn reads_back_every_part_of_a_list() {
        installed();

        let first = a_part("Every's - cd1.mkv", b"first");
        let second = a_part("Every's - cd2.mkv", b"second");
        let list = join(&[part(&first, 20.0), part(&second, 20.0)]).expect("joins them");

        assert_eq!(
            super::parts_of(std::path::Path::new(&list)),
            Some(vec![
                std::path::PathBuf::from(&first),
                std::path::PathBuf::from(&second)
            ])
        );
        assert_eq!(super::parts_of(std::path::Path::new(&first)), None);
    }

    #[test]
    fn refuses_a_part_whose_path_holds_a_line_break() {
        installed();

        let first = a_part("Broken - cd1.mkv", b"first");

        assert!(join(&[
            part(&first, 20.0),
            part("/films/x\nfile 'http://a'/cd2.mkv", 20.0)
        ])
        .is_err());
    }

    #[test]
    fn writes_the_same_list_from_many_requests_at_once() {
        installed();

        let first = a_part("Racing - cd1.mkv", b"first");
        let second = a_part("Racing - cd2.mkv", b"second");
        let parts = [part(&first, 31.0), part(&second, 31.0)];
        let lists: Vec<_> = std::thread::scope(|scope| {
            let handles: Vec<_> = (0..8).map(|_| scope.spawn(|| join(&parts))).collect();

            handles
                .into_iter()
                .map(|handle| handle.join().expect("joins"))
                .collect()
        });

        assert!(lists.iter().all(Result::is_ok));
    }

    #[test]
    fn takes_only_a_file_directly_in_the_folder_for_a_list() {
        let folder = installed();

        assert!(!is_joined(&format!(
            "{}/../media/film.ffconcat",
            folder.display()
        )));
        assert!(!is_joined(&format!(
            "{}/inner/film.ffconcat",
            folder.display()
        )));
        assert!(is_joined(&format!("{}/film.ffconcat", folder.display())));
    }

    /// The demuxer reads lines this would otherwise pass over — one indented, one
    /// it has a directive for — so a list written any other way names no parts.
    #[test]
    fn reads_no_parts_from_a_list_not_written_as_join_writes_one() {
        let folder = installed();
        let written = |name: &str, body: &str| {
            let list = folder.join(format!("{name}.ffconcat"));

            std::fs::create_dir_all(&folder).expect("makes the folder");
            std::fs::write(&list, body).expect("writes the list");

            super::parts_of(&list)
        };

        assert_eq!(
            written(
                "planted",
                "ffconcat version 1.0\nfile '/media/a.mkv'\nduration 20\n  file '/private/b.mkv'\n"
            ),
            None
        );
        assert_eq!(
            written(
                "unescaped",
                "ffconcat version 1.0\nfile '/media/it's.mkv'\nduration 20\n"
            ),
            None
        );
        assert_eq!(
            written("headless", "file '/media/a.mkv'\nduration 20\n"),
            None
        );
        assert_eq!(
            written(
                "plain",
                "ffconcat version 1.0\nfile '/media/it'\\''s.mkv'\nduration 20\n"
            ),
            Some(vec![std::path::PathBuf::from("/media/it's.mkv")])
        );
    }

    #[test]
    fn quotes_a_path_holding_a_single_quote() {
        assert_eq!(quoted("/films/It's/cd1.mkv"), r"'/films/It'\''s/cd1.mkv'");
    }

    #[test]
    fn does_not_take_a_library_file_for_a_list() {
        installed();

        assert!(!is_joined("/films/Odd Name.ffconcat"));
    }
}
