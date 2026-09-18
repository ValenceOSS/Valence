//! Music at the bitrates a phone on a slow connection can keep up with.
//!
//! A library of lossless albums is a library of files at a megabit and more,
//! and a listener away from home wants the song rather than the master. So a
//! track can be asked for at one of a few fixed bitrates, encoded once to AAC
//! and kept beside the other artefacts, and served as a plain file afterwards
//! with the same ranges the original gets.
//!
//! A rendition is named after the file it came from — where it is, how big it
//! is and when it was last written — so editing a track's tags or replacing it
//! makes a fresh rendition rather than serving the old one for ever. Nothing
//! else addresses them, so they are aged out rather than swept against a list:
//! a rendition nobody has played for a month goes the next time anything is
//! encoded.

use std::fmt::Write as _;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use sha2::{Digest, Sha256};
use thiserror::Error;
use tokio::process::Command;

use crate::probe::probe_media;
use crate::render_registry::RenderRegistry;

/// The directory under the artefact root that renditions are kept in.
pub const AUDIO_DIRECTORY: &str = "audio";

/// The extension every finished rendition carries.
pub const RENDITION_EXTENSION: &str = "m4a";

/// The extension a rendition carries while ffmpeg is still writing it.
const PARTIAL_EXTENSION: &str = "part";

/// How long a rendition may go unplayed before it is thrown away.
pub const STALE_AFTER: Duration = Duration::from_secs(30 * 24 * 60 * 60);

/// One of the bitrates a track can be asked for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AudioBitrate {
    Low,
    Medium,
    High,
}

impl AudioBitrate {
    /// The bitrate a number of kilobits a second names, where it names one.
    #[must_use]
    pub const fn from_kbps(kbps: u32) -> Option<Self> {
        match kbps {
            96 => Some(Self::Low),
            160 => Some(Self::Medium),
            320 => Some(Self::High),
            _ => None,
        }
    }

    /// The bitrate a query string names, where it names one.
    #[must_use]
    pub fn parse(value: &str) -> Option<Self> {
        value.trim().parse().ok().and_then(Self::from_kbps)
    }

    /// How many kilobits a second this is.
    #[must_use]
    pub const fn kbps(self) -> u32 {
        match self {
            Self::Low => 96,
            Self::Medium => 160,
            Self::High => 320,
        }
    }
}

/// Why a rendition could not be made.
#[derive(Debug, Error)]
pub enum AudioError {
    #[error("that file cannot be read: {0}")]
    Unreadable(std::io::Error),
    #[error("that file has no audio stream")]
    NoAudio,
    #[error("could not create the audio directory: {0}")]
    Directory(std::io::Error),
    #[error("could not start ffmpeg: {0}")]
    Spawn(std::io::Error),
    #[error("ffmpeg produced no rendition: {0}")]
    Failed(String),
    #[error("could not put the rendition in place: {0}")]
    Finish(std::io::Error),
}

impl AudioError {
    /// Whether this failure means there is nothing there to play, rather than
    /// that something went wrong making it.
    #[must_use]
    pub const fn is_missing(&self) -> bool {
        matches!(self, Self::Unreadable(_) | Self::NoAudio)
    }
}

/// Which file a rendition is made from, as it stands on disk right now.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AudioSource {
    pub canonical: PathBuf,
    pub size: u64,
    pub modified: SystemTime,
}

/// Where ffmpeg and ffprobe are.
#[derive(Clone, Copy)]
pub struct Tools<'a> {
    pub ffmpeg: &'a str,
    pub ffprobe: &'a str,
}

/// Where renditions are kept under the artefact root.
#[must_use]
pub fn directory_for(artefact_root: &Path) -> PathBuf {
    artefact_root.join(AUDIO_DIRECTORY)
}

/// The file name one rendition of one version of a file is kept under.
///
/// A hash of where the file is, how big it is, when it was last written and
/// the bitrate asked for, so any change to the file names a new rendition.
#[must_use]
pub fn rendition_name(source: &AudioSource, bitrate: AudioBitrate) -> String {
    let mut hasher = Sha256::new();
    let modified = source
        .modified
        .duration_since(UNIX_EPOCH)
        .map_or(0, |since| since.as_nanos());

    hasher.update(source.canonical.as_os_str().as_encoded_bytes());
    hasher.update([0]);
    hasher.update(source.size.to_be_bytes());
    hasher.update(modified.to_be_bytes());
    hasher.update(bitrate.kbps().to_be_bytes());

    let mut name = String::with_capacity(64 + 1 + RENDITION_EXTENSION.len());

    for byte in hasher.finalize() {
        let _ = write!(name, "{byte:02x}");
    }

    name.push('.');
    name.push_str(RENDITION_EXTENSION);

    name
}

/// Reads where a file really is, how big it is and when it was last written.
///
/// # Errors
///
/// Returns [`AudioError::Unreadable`] when the file is missing, is not a file,
/// or cannot be read.
pub async fn identify(path: &Path) -> Result<AudioSource, AudioError> {
    let canonical = tokio::fs::canonicalize(path)
        .await
        .map_err(AudioError::Unreadable)?;
    let metadata = tokio::fs::metadata(&canonical)
        .await
        .map_err(AudioError::Unreadable)?;

    if !metadata.is_file() {
        return Err(AudioError::Unreadable(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "not a file",
        )));
    }

    let modified = metadata.modified().map_err(AudioError::Unreadable)?;

    Ok(AudioSource {
        canonical,
        size: metadata.len(),
        modified,
    })
}

/// The arguments that encode a file's first audio stream as AAC in MP4.
///
/// Nothing but the one stream: no video, no cover art riding along as a video
/// stream, and none of the source's tags, which the library already knows.
#[must_use]
pub fn rendition_arguments(input: &Path, bitrate: AudioBitrate, output: &Path) -> Vec<String> {
    vec![
        "-nostdin".to_owned(),
        "-hide_banner".to_owned(),
        "-loglevel".to_owned(),
        "error".to_owned(),
        "-y".to_owned(),
        "-i".to_owned(),
        input.to_string_lossy().into_owned(),
        "-map".to_owned(),
        "0:a:0".to_owned(),
        "-vn".to_owned(),
        "-sn".to_owned(),
        "-dn".to_owned(),
        "-map_metadata".to_owned(),
        "-1".to_owned(),
        "-map_chapters".to_owned(),
        "-1".to_owned(),
        "-c:a".to_owned(),
        "aac".to_owned(),
        "-b:a".to_owned(),
        format!("{}k", bitrate.kbps()),
        "-ac".to_owned(),
        "2".to_owned(),
        "-movflags".to_owned(),
        "+faststart".to_owned(),
        "-f".to_owned(),
        "mp4".to_owned(),
        output.to_string_lossy().into_owned(),
    ]
}

/// The renditions among these that nobody has played for [`STALE_AFTER`].
///
/// A file dated in the future is kept, since there is no telling how old it is.
#[must_use]
pub fn stale_renditions(entries: &[(PathBuf, SystemTime)], now: SystemTime) -> Vec<PathBuf> {
    entries
        .iter()
        .filter(|(_, modified)| {
            now.duration_since(*modified)
                .is_ok_and(|age| age >= STALE_AFTER)
        })
        .map(|(path, _)| path.clone())
        .collect()
}

/// Removes every rendition in a directory nobody has played for
/// [`STALE_AFTER`], and says how many went.
pub async fn sweep(directory: &Path, now: SystemTime) -> usize {
    let Ok(mut listing) = tokio::fs::read_dir(directory).await else {
        return 0;
    };

    let mut entries = Vec::new();

    while let Ok(Some(entry)) = listing.next_entry().await {
        let Ok(metadata) = entry.metadata().await else {
            continue;
        };

        if !metadata.is_file() {
            continue;
        }

        if let Ok(modified) = metadata.modified() {
            entries.push((entry.path(), modified));
        }
    }

    let mut removed = 0;

    for path in stale_renditions(&entries, now) {
        if tokio::fs::remove_file(&path).await.is_ok() {
            removed += 1;
        }
    }

    removed
}

/// Marks a rendition as played just now, so the sweep leaves it be.
///
/// # Errors
///
/// Returns the error the filesystem gave when the file cannot be opened or its
/// time cannot be set.
pub async fn touch(path: &Path) -> std::io::Result<()> {
    let owned = path.to_path_buf();

    tokio::task::spawn_blocking(move || {
        std::fs::File::options()
            .append(true)
            .open(&owned)?
            .set_modified(SystemTime::now())
    })
    .await
    .map_err(std::io::Error::other)?
}

/// Encodes one rendition into place.
///
/// Written under a partial name and renamed once whole, so a reader never finds
/// half a file under the finished name.
async fn encode(
    tools: Tools<'_>,
    source: &AudioSource,
    bitrate: AudioBitrate,
    output: &Path,
) -> Result<(), AudioError> {
    let probe = probe_media(tools.ffprobe, &source.canonical)
        .await
        .map_err(|failure| AudioError::Unreadable(std::io::Error::other(failure.to_string())))?;

    if probe.audio_streams.is_empty() {
        return Err(AudioError::NoAudio);
    }

    let partial = output.with_extension(PARTIAL_EXTENSION);

    let outcome = Command::new(tools.ffmpeg)
        .args(rendition_arguments(&source.canonical, bitrate, &partial))
        .kill_on_drop(true)
        .output()
        .await
        .map_err(AudioError::Spawn)?;

    let written = tokio::fs::metadata(&partial)
        .await
        .map_or(0, |file| file.len());

    if !outcome.status.success() || written == 0 {
        let _ = tokio::fs::remove_file(&partial).await;

        return Err(AudioError::Failed(
            String::from_utf8_lossy(&outcome.stderr).trim().to_owned(),
        ));
    }

    tokio::fs::rename(&partial, output)
        .await
        .map_err(AudioError::Finish)
}

/// Keeps one rendition from being encoded twice at once.
#[derive(Clone, Default)]
pub struct AudioRegistry {
    renders: RenderRegistry,
}

impl AudioRegistry {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Hands back where a file's rendition at this bitrate is, encoding it
    /// first where it has not been made yet.
    ///
    /// Callers asking for the same rendition at once wait on one encode, and
    /// the ones behind the first find it finished. Each new encode is followed
    /// by a sweep of renditions nobody has played lately.
    ///
    /// # Errors
    ///
    /// Returns [`AudioError`] when the file cannot be read, has no audio, or
    /// ffmpeg cannot turn it into a rendition.
    pub async fn render(
        &self,
        tools: Tools<'_>,
        artefact_root: &Path,
        path: &Path,
        bitrate: AudioBitrate,
    ) -> Result<PathBuf, AudioError> {
        let source = identify(path).await?;
        let directory = directory_for(artefact_root);
        let name = rendition_name(&source, bitrate);
        let output = directory.join(&name);

        if is_made(&output).await {
            return Ok(output);
        }

        let gate = self.renders.gate(&name).await;
        let permit = gate.lock().await;

        let outcome = make(tools, &source, bitrate, &directory, output).await;

        drop(permit);
        self.renders.release(&name).await;

        outcome
    }
}

/// Encodes a rendition unless one turned up while waiting, then sweeps.
async fn make(
    tools: Tools<'_>,
    source: &AudioSource,
    bitrate: AudioBitrate,
    directory: &Path,
    output: PathBuf,
) -> Result<PathBuf, AudioError> {
    if is_made(&output).await {
        return Ok(output);
    }

    tokio::fs::create_dir_all(directory)
        .await
        .map_err(AudioError::Directory)?;

    encode(tools, source, bitrate, &output).await?;

    sweep(directory, SystemTime::now()).await;

    Ok(output)
}

/// Whether a finished rendition is already on disk.
async fn is_made(output: &Path) -> bool {
    tokio::fs::metadata(output)
        .await
        .is_ok_and(|found| found.is_file() && found.len() > 0)
}

#[cfg(test)]
mod tests {
    use super::{
        directory_for, identify, rendition_arguments, rendition_name, stale_renditions, sweep,
        touch, AudioBitrate, AudioError, AudioSource, STALE_AFTER,
    };
    use std::path::{Path, PathBuf};
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    fn source(modified_seconds: u64) -> AudioSource {
        AudioSource {
            canonical: PathBuf::from("/music/Björk/Homogenic/01 Hunter.flac"),
            size: 41_234_567,
            modified: UNIX_EPOCH + Duration::from_secs(modified_seconds),
        }
    }

    fn scratch(name: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("valence-audio-{name}"));

        std::fs::remove_dir_all(&path).ok();
        std::fs::create_dir_all(&path).expect("creates the directory");

        path
    }

    #[test]
    fn accepts_only_the_offered_bitrates() {
        assert_eq!(AudioBitrate::from_kbps(96), Some(AudioBitrate::Low));
        assert_eq!(AudioBitrate::from_kbps(160), Some(AudioBitrate::Medium));
        assert_eq!(AudioBitrate::from_kbps(320), Some(AudioBitrate::High));

        for refused in [0, 64, 95, 128, 192, 256, 321, 1411] {
            assert_eq!(AudioBitrate::from_kbps(refused), None, "{refused}");
        }
    }

    #[test]
    fn reads_a_bitrate_from_a_query_string() {
        assert_eq!(AudioBitrate::parse("160"), Some(AudioBitrate::Medium));
        assert_eq!(AudioBitrate::parse(" 320 "), Some(AudioBitrate::High));
        assert_eq!(AudioBitrate::parse("160k"), None);
        assert_eq!(AudioBitrate::parse("-96"), None);
        assert_eq!(AudioBitrate::parse(""), None);
    }

    #[test]
    fn says_how_many_kilobits_each_is() {
        for kbps in [96, 160, 320] {
            assert_eq!(
                AudioBitrate::from_kbps(kbps).map(AudioBitrate::kbps),
                Some(kbps)
            );
        }
    }

    #[test]
    fn names_a_rendition_the_same_for_the_same_file_and_bitrate() {
        let name = rendition_name(&source(1_700_000_000), AudioBitrate::Medium);

        assert_eq!(
            name,
            rendition_name(&source(1_700_000_000), AudioBitrate::Medium)
        );
        assert_eq!(name.len(), 64 + ".m4a".len());
        assert_eq!(&name[64..], ".m4a");
        assert!(name[..64].chars().all(|found| found.is_ascii_hexdigit()));
    }

    #[test]
    fn names_each_bitrate_separately() {
        let low = rendition_name(&source(1_700_000_000), AudioBitrate::Low);
        let medium = rendition_name(&source(1_700_000_000), AudioBitrate::Medium);
        let high = rendition_name(&source(1_700_000_000), AudioBitrate::High);

        assert_ne!(low, medium);
        assert_ne!(medium, high);
        assert_ne!(low, high);
    }

    #[test]
    fn names_an_edited_file_afresh() {
        assert_ne!(
            rendition_name(&source(1_700_000_000), AudioBitrate::High),
            rendition_name(&source(1_700_000_001), AudioBitrate::High)
        );
    }

    #[test]
    fn names_a_resized_or_moved_file_afresh() {
        let original = source(1_700_000_000);
        let resized = AudioSource {
            size: original.size + 1,
            ..original.clone()
        };
        let moved = AudioSource {
            canonical: PathBuf::from("/music/Björk/Homogenic/02 Jóga.flac"),
            ..original.clone()
        };

        let name = rendition_name(&original, AudioBitrate::Low);

        assert_ne!(name, rendition_name(&resized, AudioBitrate::Low));
        assert_ne!(name, rendition_name(&moved, AudioBitrate::Low));
    }

    #[test]
    fn keeps_renditions_beside_the_other_artefacts() {
        assert_eq!(
            directory_for(Path::new("/var/lib/valence/artefacts")),
            PathBuf::from("/var/lib/valence/artefacts/audio")
        );
    }

    #[test]
    fn encodes_only_the_first_audio_stream_as_aac_in_mp4() {
        let arguments = rendition_arguments(
            Path::new("/music/track.flac"),
            AudioBitrate::Medium,
            Path::new("/cache/audio/abc.part"),
        );

        for pair in [
            ["-map", "0:a:0"],
            ["-c:a", "aac"],
            ["-b:a", "160k"],
            ["-ac", "2"],
            ["-movflags", "+faststart"],
            ["-map_metadata", "-1"],
            ["-f", "mp4"],
        ] {
            assert!(
                arguments.windows(2).any(|found| found == pair),
                "{pair:?} in {arguments:?}"
            );
        }

        assert!(arguments.iter().any(|argument| argument == "-vn"));
        assert_eq!(
            arguments.last().map(String::as_str),
            Some("/cache/audio/abc.part")
        );
    }

    #[test]
    fn selects_only_renditions_unplayed_for_thirty_days() {
        let now = UNIX_EPOCH + Duration::from_secs(1_800_000_000);
        let entries = vec![
            (PathBuf::from("fresh.m4a"), now),
            (
                PathBuf::from("yesterday.m4a"),
                now - Duration::from_secs(24 * 60 * 60),
            ),
            (
                PathBuf::from("almost.m4a"),
                now - STALE_AFTER + Duration::from_secs(1),
            ),
            (PathBuf::from("exactly.m4a"), now - STALE_AFTER),
            (
                PathBuf::from("ancient.m4a"),
                now - STALE_AFTER - Duration::from_secs(365 * 24 * 60 * 60),
            ),
            (
                PathBuf::from("future.m4a"),
                now + Duration::from_secs(60 * 60),
            ),
        ];

        assert_eq!(
            stale_renditions(&entries, now),
            vec![PathBuf::from("exactly.m4a"), PathBuf::from("ancient.m4a")]
        );
    }

    #[tokio::test]
    async fn sweeps_away_only_what_has_gone_stale() {
        let directory = scratch("sweep");
        let now = SystemTime::now();
        let stale = directory.join("stale.m4a");
        let fresh = directory.join("fresh.m4a");

        std::fs::write(&stale, b"old").expect("writes the stale rendition");
        std::fs::write(&fresh, b"new").expect("writes the fresh rendition");
        std::fs::File::options()
            .append(true)
            .open(&stale)
            .expect("opens the stale rendition")
            .set_modified(now - STALE_AFTER - Duration::from_secs(60))
            .expect("ages it");

        assert_eq!(sweep(&directory, now).await, 1);
        assert!(!stale.exists());
        assert!(fresh.exists());
    }

    #[tokio::test]
    async fn sweeps_nothing_where_there_is_no_directory_yet() {
        let missing = std::env::temp_dir().join("valence-audio-never-made");

        std::fs::remove_dir_all(&missing).ok();

        assert_eq!(sweep(&missing, SystemTime::now()).await, 0);
    }

    #[tokio::test]
    async fn touching_a_rendition_rescues_it_from_the_sweep() {
        let directory = scratch("touch");
        let rendition = directory.join("played.m4a");
        let long_ago = SystemTime::now() - STALE_AFTER - Duration::from_secs(60);

        std::fs::write(&rendition, b"played").expect("writes the rendition");
        std::fs::File::options()
            .append(true)
            .open(&rendition)
            .expect("opens the rendition")
            .set_modified(long_ago)
            .expect("ages it");

        touch(&rendition).await.expect("touches it");

        assert_eq!(sweep(&directory, SystemTime::now()).await, 0);
        assert!(rendition.exists());
    }

    #[tokio::test]
    async fn cannot_identify_a_file_that_is_not_there() {
        let failure = identify(Path::new("/nowhere/at/all.flac"))
            .await
            .expect_err("a missing file has no identity");

        assert!(matches!(failure, AudioError::Unreadable(_)));
        assert!(failure.is_missing());
    }

    #[tokio::test]
    async fn cannot_identify_a_directory() {
        let directory = scratch("identify-directory");

        let failure = identify(&directory)
            .await
            .expect_err("a directory is not a track");

        assert!(failure.is_missing());
    }

    #[tokio::test]
    async fn identifies_a_file_by_where_it_really_is() {
        let directory = scratch("identify");
        let track = directory.join("track.flac");

        std::fs::write(&track, b"twelve bytes").expect("writes the track");

        let found = identify(&directory.join(".").join("track.flac"))
            .await
            .expect("identifies it");

        assert_eq!(
            found.canonical,
            std::fs::canonicalize(&track).expect("canonicalises")
        );
        assert_eq!(found.size, 12);
    }

    #[test]
    fn tells_a_missing_track_from_a_failed_encode() {
        assert!(AudioError::NoAudio.is_missing());
        assert!(!AudioError::Failed("broke".to_owned()).is_missing());
        assert!(!AudioError::Spawn(std::io::Error::other("no ffmpeg")).is_missing());
    }
}
