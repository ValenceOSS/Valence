//! What a source file's derived artefacts are filed under.
//!
//! Some answers are a property of the file rather than of whoever asked —
//! where its keyframes fall, what its subtitle tracks say — and reading them
//! means demuxing the whole thing. Those are kept, and addressed by what would
//! make them wrong: the path, the size and the time it was last written. A file
//! replaced in place gets a new address and is read again.

use std::path::Path;
use std::time::UNIX_EPOCH;

/// The address a file's kept answers are filed under.
///
/// Size and modified time because a library is edited in place: a remux
/// written over the same path must not be answered from the old one. The time
/// is taken as a point rather than as an age, because an age grows every
/// second and would give the same file a new address each time it was asked
/// about. Nothing is returned where the file cannot be read, which leaves the
/// caller to read it the slow way rather than to answer wrongly.
pub async fn of(path: &Path) -> Option<String> {
    use std::hash::{DefaultHasher, Hash, Hasher};

    let metadata = tokio::fs::metadata(path).await.ok()?;
    let modified = metadata
        .modified()
        .ok()?
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|since| since.as_nanos());

    let mut hasher = DefaultHasher::new();

    path.hash(&mut hasher);
    metadata.len().hash(&mut hasher);
    modified.hash(&mut hasher);

    Some(format!("{:016x}", hasher.finish()))
}

#[cfg(test)]
mod tests {
    use super::of;
    use std::time::{Duration, SystemTime};

    fn written(name: &str, contents: &[u8]) -> std::path::PathBuf {
        let path = std::env::temp_dir().join(format!(
            "valence-source-address-{name}-{}",
            std::process::id()
        ));

        std::fs::write(&path, contents).expect("writes the file");
        std::fs::File::options()
            .write(true)
            .open(&path)
            .expect("opens the file")
            .set_modified(SystemTime::UNIX_EPOCH + Duration::from_secs(1_700_000_000))
            .expect("dates the file");

        path
    }

    #[tokio::test]
    async fn gives_the_same_file_the_same_address_as_time_passes() {
        let path = written("stable", b"film");

        let first = of(&path).await;
        tokio::time::sleep(Duration::from_millis(1100)).await;
        let second = of(&path).await;

        assert!(first.is_some());
        assert_eq!(first, second);
    }

    #[tokio::test]
    async fn gives_a_file_written_over_a_new_address() {
        let path = written("replaced", b"film");
        let before = of(&path).await;

        std::fs::write(&path, b"a longer remux").expect("writes over it");

        assert_ne!(before, of(&path).await);
    }

    #[tokio::test]
    async fn gives_no_address_for_a_file_that_is_not_there() {
        assert_eq!(
            of(std::path::Path::new("/nowhere/valence/film.mkv")).await,
            None
        );
    }
}
