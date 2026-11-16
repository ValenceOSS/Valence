//! Looking after the files kept in the held folder.

use std::path::Path;

/// The file of the index vtt inside a kept film's thumbnail folder.
pub const KEPT_TRICKPLAY_INDEX: &str = "thumbnails.vtt";

/// How much of a file is on the disk, or nothing where it is not there.
pub async fn how_much_is_there(path: &Path) -> u64 {
    tokio::fs::metadata(path)
        .await
        .map_or(0, |there| there.len())
}

/// Removes a file, and is content where it was already gone.
///
/// # Errors
///
/// When the file is there and cannot be removed.
pub async fn remove_the_file(path: &Path) -> std::io::Result<()> {
    match tokio::fs::remove_file(path).await {
        Err(problem) if problem.kind() != std::io::ErrorKind::NotFound => Err(problem),
        _ => Ok(()),
    }
}

/// Removes a folder and everything in it, and is content where it was already gone.
///
/// # Errors
///
/// When the folder is there and cannot be removed.
pub async fn remove_the_folder(path: &Path) -> std::io::Result<()> {
    match tokio::fs::remove_dir_all(path).await {
        Err(problem) if problem.kind() != std::io::ErrorKind::NotFound => Err(problem),
        _ => Ok(()),
    }
}
