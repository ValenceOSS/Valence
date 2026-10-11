//! Live channels: a stream that never ends, made into a rolling HLS playlist.
//!
//! A film is a file with a length, cut into segments planned from its
//! keyframes. A live channel is neither: it has no length and no keyframe
//! index, and it cannot be seeked. So it gets its own path — one `ffmpeg` per
//! channel reading the stream as it arrives and writing the last few segments
//! of it, shared by everybody watching that channel, and stopped once nobody
//! has asked for a segment in a while.

use std::collections::HashMap;
use std::fmt::Write;
use std::path::{Component, Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use std::time::{Duration, Instant};

use sha2::{Digest, Sha256};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;

/// The address schemes a channel may stream from.
///
/// Only network streams. `ffmpeg` will read a local path just as happily as a
/// URL, and this service has no authentication of its own, so an address that
/// named a file would be a way to read it.
const SCHEMES: [&str; 6] = [
    "http://", "https://", "rtsp://", "rtmp://", "udp://", "rtp://",
];

/// How long a channel nobody is watching keeps running.
const IDLE_FOR: Duration = Duration::from_secs(60);

/// How long a viewer waits for the first segment before the channel is said to have failed.
const FIRST_SEGMENT_WITHIN: Duration = Duration::from_secs(25);

/// How long the stream is given to say what it carries.
const PROBE_WITHIN: Duration = Duration::from_secs(15);

/// Why a channel could not be started.
#[derive(Debug, thiserror::Error)]
pub enum LiveError {
    #[error("the address is not a network stream")]
    NotAStream,
    #[error("could not prepare the channel's directory: {0}")]
    Directory(#[from] std::io::Error),
    #[error("ffmpeg stopped before the channel started")]
    Stopped,
    #[error("the channel did not start in time")]
    TooSlow,
}

#[derive(Debug)]
struct Channel {
    directory: PathBuf,
    child: Child,
    last_read: Instant,
}

/// The channels being made into HLS right now.
#[derive(Debug, Clone)]
pub struct LiveRegistry {
    ffmpeg: String,
    ffprobe: String,
    root: PathBuf,
    channels: Arc<Mutex<HashMap<String, Channel>>>,
}

/// Whether a name is one file in a channel's directory, and nothing that climbs out of it.
fn is_one_file(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 64
        && Path::new(name).components().count() == 1
        && Path::new(name)
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
}

/// The id a channel is kept under, made from where it streams from, so everybody watching one stream shares it.
fn id_of(address: &str) -> String {
    let digest = Sha256::digest(address.as_bytes());

    digest.iter().take(12).fold(String::new(), |mut id, byte| {
        let _ = write!(id, "{byte:02x}");

        id
    })
}

/// What a stream insists on being asked with, as its playlist said.
#[derive(Debug, Clone, Default)]
pub struct Asking {
    pub user_agent: Option<String>,
    pub referrer: Option<String>,
    /// An HTTP proxy to fetch through, such as a VPN's, so a stream blocked
    /// in this server's country can be read from another.
    pub proxy: Option<String>,
}

/// The options that make a stream read over HTTP survive a hiccup rather
/// than end the channel, and ask for it with the user agent and referrer it
/// insists on.
fn reading_options(address: &str, asking: &Asking) -> Vec<String> {
    let mut options = vec!["-fflags".into(), "+genpts+discardcorrupt".into()];

    if let Some(user_agent) = &asking.user_agent {
        options.extend(["-user_agent".into(), user_agent.clone()]);
    }

    if let Some(referrer) = &asking.referrer {
        options.extend(["-referer".into(), referrer.clone()]);
    }

    if let Some(proxy) = asking
        .proxy
        .as_ref()
        .filter(|_| address.starts_with("http://") || address.starts_with("https://"))
    {
        options.extend(["-http_proxy".into(), proxy.clone()]);
    }

    if address.starts_with("http://") || address.starts_with("https://") {
        options.extend(
            [
                "-reconnect",
                "1",
                "-reconnect_streamed",
                "1",
                "-reconnect_delay_max",
                "5",
                "-rw_timeout",
                "15000000",
            ]
            .map(String::from),
        );
    }

    if address.starts_with("rtsp://") {
        options.extend(["-rtsp_transport", "tcp"].map(String::from));
    }

    options
}

/// The arguments for `ffmpeg`: the video copied where it is already H.264,
/// which every browser plays, and otherwise encoded to it — deinterlaced
/// where it is interlaced, as a tuner's broadcast MPEG-2 usually is — and the
/// sound always made AAC, written as a rolling playlist of the last few
/// segments.
fn ffmpeg_arguments(
    address: &str,
    asking: &Asking,
    directory: &Path,
    copies_video: bool,
) -> Vec<String> {
    let mut arguments: Vec<String> = ["-hide_banner", "-loglevel", "error", "-nostdin"]
        .map(String::from)
        .to_vec();

    arguments.extend(reading_options(address, asking));
    arguments.extend(["-i".into(), address.into()]);
    arguments.extend(["-map", "0:v:0?", "-map", "0:a:0?"].map(String::from));

    if copies_video {
        arguments.extend(["-c:v", "copy"].map(String::from));
    } else {
        arguments.extend(
            [
                "-vf",
                "yadif=0:-1:1,format=yuv420p",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "21",
                "-maxrate",
                "8M",
                "-bufsize",
                "16M",
                "-g",
                "50",
                "-sc_threshold",
                "0",
            ]
            .map(String::from),
        );
    }

    arguments.extend(
        [
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-ac",
            "2",
            "-f",
            "hls",
            "-hls_time",
            "4",
            "-hls_list_size",
            "8",
            "-hls_flags",
            "delete_segments+independent_segments+omit_endlist",
        ]
        .map(String::from),
    );
    arguments.push("-hls_segment_filename".into());
    arguments.push(
        directory
            .join("segment%06d.ts")
            .to_string_lossy()
            .into_owned(),
    );
    arguments.push(directory.join("index.m3u8").to_string_lossy().into_owned());

    arguments
}

impl LiveRegistry {
    #[must_use]
    pub fn new(ffmpeg: String, ffprobe: String, root: PathBuf) -> Self {
        Self {
            ffmpeg,
            ffprobe,
            root,
            channels: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Whether the stream's video is already H.264, asked of the stream itself.
    async fn is_h264(&self, address: &str, asking: &Asking) -> bool {
        let mut command = Command::new(&self.ffprobe);

        command
            .args(["-v", "error"])
            .args(reading_options(address, asking))
            .args([
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=codec_name",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
            ])
            .arg(address)
            .stdin(Stdio::null())
            .stderr(Stdio::null())
            .kill_on_drop(true);

        let Ok(Ok(output)) = tokio::time::timeout(PROBE_WITHIN, command.output()).await else {
            return false;
        };

        String::from_utf8_lossy(&output.stdout).trim() == "h264"
    }

    /// Starts a channel, or joins it where it is already running.
    ///
    /// # Errors
    ///
    /// Returns [`LiveError`] when the address is not a network stream, or the
    /// stream does not give a first segment in time.
    pub async fn start(&self, address: &str, asking: &Asking) -> Result<String, LiveError> {
        if !SCHEMES.iter().any(|scheme| address.starts_with(scheme)) {
            return Err(LiveError::NotAStream);
        }

        self.sweep().await;

        let id = id_of(address);

        {
            let mut channels = self.channels.lock().await;

            if let Some(channel) = channels.get_mut(&id) {
                if matches!(channel.child.try_wait(), Ok(None)) {
                    channel.last_read = Instant::now();

                    return Ok(id);
                }

                channels.remove(&id);
            }
        }

        let directory = self.root.join(&id);
        let _ = tokio::fs::remove_dir_all(&directory).await;

        tokio::fs::create_dir_all(&directory).await?;

        let copies_video = self.is_h264(address, asking).await;
        let child = Command::new(&self.ffmpeg)
            .args(ffmpeg_arguments(address, asking, &directory, copies_video))
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .kill_on_drop(true)
            .spawn()?;

        self.channels.lock().await.insert(
            id.clone(),
            Channel {
                directory: directory.clone(),
                child,
                last_read: Instant::now(),
            },
        );

        let deadline = Instant::now() + FIRST_SEGMENT_WITHIN;

        loop {
            if tokio::fs::try_exists(directory.join("index.m3u8"))
                .await
                .unwrap_or(false)
            {
                return Ok(id);
            }

            {
                let mut channels = self.channels.lock().await;
                let has_stopped = channels
                    .get_mut(&id)
                    .is_none_or(|channel| !matches!(channel.child.try_wait(), Ok(None)));

                if has_stopped {
                    channels.remove(&id);

                    return Err(LiveError::Stopped);
                }
            }

            if Instant::now() >= deadline {
                self.stop(&id).await;

                return Err(LiveError::TooSlow);
            }

            tokio::time::sleep(Duration::from_millis(250)).await;
        }
    }

    /// Where one of a running channel's files is, marking the channel as still watched.
    pub async fn file(&self, id: &str, name: &str) -> Option<PathBuf> {
        if !is_one_file(name) {
            return None;
        }

        let mut channels = self.channels.lock().await;
        let channel = channels.get_mut(id)?;

        channel.last_read = Instant::now();

        Some(channel.directory.join(name))
    }

    /// Stops one channel and clears away what it wrote.
    async fn stop(&self, id: &str) {
        let removed = self.channels.lock().await.remove(id);

        if let Some(mut channel) = removed {
            let _ = channel.child.kill().await;
            let _ = tokio::fs::remove_dir_all(&channel.directory).await;
        }
    }

    /// Stops every channel nobody has asked for a segment of lately, and any whose `ffmpeg` has ended.
    pub async fn sweep(&self) {
        let idle: Vec<String> = {
            let mut channels = self.channels.lock().await;
            let mut idle = Vec::new();

            for (id, channel) in channels.iter_mut() {
                if channel.last_read.elapsed() > IDLE_FOR
                    || !matches!(channel.child.try_wait(), Ok(None))
                {
                    idle.push(id.clone());
                }
            }

            idle
        };

        for id in idle {
            self.stop(&id).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{ffmpeg_arguments, id_of, is_one_file, Asking, LiveRegistry};
    use std::path::{Path, PathBuf};

    #[test]
    fn keeps_one_stream_under_one_id() {
        assert_eq!(
            id_of("https://a.example/live.ts"),
            id_of("https://a.example/live.ts")
        );
        assert_ne!(
            id_of("https://a.example/live.ts"),
            id_of("https://b.example/live.ts")
        );
        assert_eq!(id_of("https://a.example/live.ts").len(), 24);
    }

    #[test]
    fn serves_only_files_inside_a_channel() {
        assert!(is_one_file("index.m3u8"));
        assert!(is_one_file("segment000001.ts"));
        assert!(!is_one_file("../secret"));
        assert!(!is_one_file("/etc/passwd"));
        assert!(!is_one_file(""));
    }

    #[test]
    fn copies_h264_and_encodes_anything_else() {
        let asking = Asking {
            user_agent: Some("Enigma2".into()),
            referrer: None,
            proxy: Some("http://gluetun:8888".into()),
        };
        let copied = ffmpeg_arguments("https://a.example/x.ts", &asking, Path::new("/tmp/x"), true);
        let encoded = ffmpeg_arguments(
            "http://tuner/auto/v5.1",
            &Asking::default(),
            Path::new("/tmp/x"),
            false,
        );

        assert!(copied.windows(2).any(|pair| pair == ["-c:v", "copy"]));
        assert!(encoded.windows(2).any(|pair| pair == ["-c:v", "libx264"]));
        assert!(encoded.iter().any(|argument| argument.starts_with("yadif")));
        assert!(copied.windows(2).any(|pair| pair == ["-reconnect", "1"]));
        assert!(copied
            .windows(2)
            .any(|pair| pair == ["-user_agent", "Enigma2"]));
    }

    #[tokio::test]
    async fn refuses_an_address_that_is_not_a_network_stream() {
        let registry = LiveRegistry::new("ffmpeg".into(), "ffprobe".into(), PathBuf::from("/tmp"));

        assert!(registry
            .start("/etc/passwd", &Asking::default())
            .await
            .is_err());
        assert!(registry
            .start("file:///etc/passwd", &Asking::default())
            .await
            .is_err());
    }
}
