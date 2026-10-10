//! The fonts a file carries for its own subtitles.
//!
//! Typeset anime subtitles name fonts nobody has installed and ship them
//! inside the Matroska file as attachments, so that a sign drawn on a shop
//! window looks like the shop window's lettering. A player that draws those
//! signs needs the same fonts, so they are copied out once, kept under the
//! file's [`source_address`](crate::source_address), and handed over by name.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::process::Command;

use crate::subtitle::Tools;

const DIRECTORY: &str = "fonts";

const FINISHED: &str = ".finished";

const FONT_EXTENSIONS: [&str; 5] = ["ttf", "otf", "ttc", "woff", "woff2"];

/// A file whose attached fonts are wanted.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontsRequest {
    #[serde(deserialize_with = "crate::path_map::deserialize")]
    pub input_path: String,
}

/// One attached font of a file, by the name it was attached under.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontRequest {
    #[serde(deserialize_with = "crate::path_map::deserialize")]
    pub input_path: String,
    pub name: String,
}

/// The fonts a file carries, by name.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FontList {
    pub names: Vec<String>,
}

/// Why a file's fonts could not be had.
#[derive(Debug, Error)]
pub enum FontError {
    #[error("could not start ffmpeg: {0}")]
    Spawn(std::io::Error),
    #[error("could not keep the fonts: {0}")]
    Keep(std::io::Error),
    #[error("that file carries no font by that name")]
    Missing,
}

/// The arguments that copy each listed font attachment out of a file into
/// the directory ffmpeg is run in, reading nothing else.
///
/// Each is written under its stream number rather than the name it was
/// attached under: ffmpeg refuses to write a name it finds unsafe, such as
/// one with a space, and gives up on the rest. A font names its own family
/// inside the file, so nothing reads the name it is kept under.
#[must_use]
pub fn dump_arguments(path: &Path, fonts: &[(u32, String)]) -> Vec<String> {
    let mut arguments = vec![
        "-nostdin".to_owned(),
        "-y".to_owned(),
        "-loglevel".to_owned(),
        "error".to_owned(),
    ];

    for (index, extension) in fonts {
        arguments.push(format!("-dump_attachment:{index}"));
        arguments.push(format!("{index}.{extension}"));
    }

    arguments.extend([
        "-i".to_owned(),
        path.to_string_lossy().into_owned(),
        "-t".to_owned(),
        "0".to_owned(),
        "-f".to_owned(),
        "null".to_owned(),
        "-".to_owned(),
    ]);

    arguments
}

/// The font attachments a file carries, as stream numbers and the extension
/// each was attached with, read from its header.
async fn attached(ffprobe: &str, path: &Path) -> Vec<(u32, String)> {
    let Ok(output) = Command::new(ffprobe)
        .args([
            "-v",
            "error",
            "-select_streams",
            "t",
            "-show_entries",
            "stream=index:stream_tags=filename",
            "-of",
            "csv=p=0",
        ])
        .arg(path)
        .kill_on_drop(true)
        .output()
        .await
    else {
        return Vec::new();
    };

    String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter_map(|line| {
            let (index, name) = line.split_once(',')?;
            let extension = Path::new(name.trim())
                .extension()?
                .to_str()?
                .to_ascii_lowercase();

            if !is_font(&format!("font.{extension}")) {
                return None;
            }

            Some((index.trim().parse().ok()?, extension))
        })
        .collect()
}

/// Whether a file name is one a font is kept under.
fn is_font(name: &str) -> bool {
    Path::new(name)
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            FONT_EXTENSIONS
                .iter()
                .any(|known| known.eq_ignore_ascii_case(extension))
        })
}

/// Copies a file's attachments into the directory kept for them, once.
///
/// They are written to a directory of their own first and moved into place
/// whole, so a reader never sees half of a file's fonts.
async fn kept(
    tools: &Tools,
    artefact_root: &Path,
    path: &Path,
) -> Result<Option<PathBuf>, FontError> {
    let Some(address) = crate::source_address::of(path).await else {
        return Ok(None);
    };

    let directory = artefact_root.join(DIRECTORY).join(&address);

    if tokio::fs::try_exists(directory.join(FINISHED))
        .await
        .unwrap_or(false)
    {
        return Ok(Some(directory));
    }

    let partial = artefact_root
        .join(DIRECTORY)
        .join(format!("{address}.partial"));
    let _ = tokio::fs::remove_dir_all(&partial).await;
    tokio::fs::create_dir_all(&partial)
        .await
        .map_err(FontError::Keep)?;

    let fonts = attached(&tools.ffprobe, path).await;

    if !fonts.is_empty() {
        Command::new(&tools.ffmpeg)
            .args(dump_arguments(path, &fonts))
            .current_dir(&partial)
            .kill_on_drop(true)
            .output()
            .await
            .map_err(FontError::Spawn)?;
    }

    tokio::fs::write(partial.join(FINISHED), b"")
        .await
        .map_err(FontError::Keep)?;
    let _ = tokio::fs::remove_dir_all(&directory).await;
    tokio::fs::rename(&partial, &directory)
        .await
        .map_err(FontError::Keep)?;

    Ok(Some(directory))
}

/// The fonts a file carries, by name, copied out of it the first time.
///
/// # Errors
///
/// Returns [`FontError`] when ffmpeg cannot be started or the fonts cannot be
/// kept.
pub async fn list(tools: &Tools, artefact_root: &Path, path: &Path) -> Result<FontList, FontError> {
    let Some(directory) = kept(tools, artefact_root, path).await? else {
        return Ok(FontList { names: Vec::new() });
    };

    let mut names = Vec::new();
    let mut entries = tokio::fs::read_dir(&directory)
        .await
        .map_err(FontError::Keep)?;

    while let Ok(Some(entry)) = entries.next_entry().await {
        if let Some(name) = entry.file_name().to_str() {
            if is_font(name) {
                names.push(name.to_owned());
            }
        }
    }

    names.sort();

    Ok(FontList { names })
}

/// One of a file's fonts, by the name [`list`] gave it.
///
/// # Errors
///
/// Returns [`FontError::Missing`] for a name that is not one of the file's
/// fonts, including any name reaching outside the directory they are kept in.
pub async fn read(
    tools: &Tools,
    artefact_root: &Path,
    path: &Path,
    name: &str,
) -> Result<Vec<u8>, FontError> {
    if !is_font(name) || name.contains(['/', '\\']) || name.starts_with('.') {
        return Err(FontError::Missing);
    }

    let Some(directory) = kept(tools, artefact_root, path).await? else {
        return Err(FontError::Missing);
    };

    tokio::fs::read(directory.join(name))
        .await
        .map_err(|_| FontError::Missing)
}

#[cfg(test)]
mod tests {
    use super::{dump_arguments, is_font};
    use std::path::Path;

    #[test]
    fn dumps_each_font_under_its_stream_number_and_reads_no_video() {
        let arguments = dump_arguments(
            Path::new("/media/show.mkv"),
            &[(9, "ttf".to_owned()), (13, "otf".to_owned())],
        );

        assert!(arguments
            .windows(2)
            .any(|pair| pair[0] == "-dump_attachment:9" && pair[1] == "9.ttf"));
        assert!(arguments
            .windows(2)
            .any(|pair| pair[0] == "-dump_attachment:13" && pair[1] == "13.otf"));
        assert!(arguments
            .windows(2)
            .any(|pair| pair[0] == "-t" && pair[1] == "0"));
    }

    #[test]
    fn keeps_only_font_files() {
        assert!(is_font("Gandhi Sans.TTF"));
        assert!(is_font("sign.otf"));
        assert!(!is_font("cover.jpg"));
        assert!(!is_font("notes"));
    }
}
