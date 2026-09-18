//! Keeping what a source's keyframes are, so a viewer never waits for them twice.
//!
//! Reading them demuxes the whole file. That is seconds for an ordinary film
//! and a minute for a large one, and until this existed every play of a copied
//! stream paid it again from nothing — a viewer who gave up killed the scan,
//! and the next attempt started where the first had.
//!
//! The answer is a property of the file rather than of the session that asked,
//! so it is kept beside the other artefacts that cost minutes to make and are
//! read for as long as the film is in the library, and addressed by what would
//! make it wrong: the path, the size and the time it was last written. A file
//! replaced in place gets a new address and is read again.

use std::path::{Path, PathBuf};

use crate::keyframes::Keyframes;

const DIRECTORY: &str = "keyframes";

/// What a file's index is filed under.
///
/// Size and modified time because a library is edited in place: a remux
/// written over the same path has different keyframes and must not be answered
/// from the old ones. Nothing is returned where the file cannot be read, which
/// leaves the caller to read it the slow way rather than to answer wrongly.
async fn address(path: &Path) -> Option<String> {
    use std::hash::{DefaultHasher, Hash, Hasher};

    let metadata = tokio::fs::metadata(path).await.ok()?;
    let modified = metadata
        .modified()
        .ok()?
        .elapsed()
        .ok()
        .map(|since| since.as_secs());

    let mut hasher = DefaultHasher::new();

    path.hash(&mut hasher);
    metadata.len().hash(&mut hasher);
    modified.hash(&mut hasher);

    Some(format!("{:016x}", hasher.finish()))
}

/// Where a file's index would be kept.
fn at(artefact_root: &Path, address: &str) -> PathBuf {
    artefact_root
        .join(DIRECTORY)
        .join(format!("{address}.json"))
}

/// The keyframes already read for a source, where they have been.
pub async fn read(artefact_root: &Path, path: &Path) -> Option<Keyframes> {
    let address = address(path).await?;
    let held = tokio::fs::read_to_string(at(artefact_root, &address))
        .await
        .ok()?;

    serde_json::from_str(&held).ok()
}

/// Keeps what was read, so nothing reads it again.
///
/// Written through a neighbouring name and moved into place, because a session
/// starting while this is half written would otherwise read a truncated index
/// and cut the film in the wrong places.
pub async fn write(artefact_root: &Path, path: &Path, keyframes: &Keyframes) {
    let Some(address) = address(path).await else {
        return;
    };

    let Ok(payload) = serde_json::to_string(keyframes) else {
        return;
    };

    let kept = at(artefact_root, &address);

    if tokio::fs::create_dir_all(artefact_root.join(DIRECTORY))
        .await
        .is_err()
    {
        return;
    }

    let partial = kept.with_extension("partial");

    if tokio::fs::write(&partial, payload).await.is_ok() {
        let _ = tokio::fs::rename(&partial, &kept).await;
    }
}
