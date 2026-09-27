//! Keeping what a source's keyframes are, so a viewer never waits for them twice.
//!
//! Reading them demuxes the whole file. That is seconds for an ordinary film
//! and a minute for a large one, and until this existed every play of a copied
//! stream paid it again from nothing — a viewer who gave up killed the scan,
//! and the next attempt started where the first had.
//!
//! The answer is a property of the file rather than of the session that asked,
//! so it is kept beside the other artefacts that cost minutes to make and are
//! read for as long as the film is in the library, under the file's
//! [`source_address`](crate::source_address).

use std::path::{Path, PathBuf};

use crate::keyframes::Keyframes;

const DIRECTORY: &str = "keyframes";

/// Where a file's index would be kept.
fn at(artefact_root: &Path, address: &str) -> PathBuf {
    artefact_root
        .join(DIRECTORY)
        .join(format!("{address}.json"))
}

/// The keyframes already read for a source, where they have been.
pub async fn read(artefact_root: &Path, path: &Path) -> Option<Keyframes> {
    let address = crate::source_address::of(path).await?;
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
    let Some(address) = crate::source_address::of(path).await else {
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
