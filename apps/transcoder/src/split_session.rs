//! A session whose picture and sound are sent apart.
//!
//! Two ordinary sessions do the work, one carrying the picture and one the
//! sound, and a player sees one: every file is asked for under the picture's
//! session, and the names say which half it belongs to. See VAL-307.

use crate::media::AudioStream;
use crate::playlist::{
    AudioRendition, AUDIO_INIT_NAME, AUDIO_PLAYLIST_NAME, AUDIO_SEGMENT_PREFIX, VIDEO_PLAYLIST_NAME,
};
use crate::transcode_plan::{
    AudioAction, SegmentContainer, SessionSpec, Track, VideoAction, INIT_SEGMENT_NAME,
    MANIFEST_NAME,
};

/// How long each segment of the sound is, in seconds.
///
/// Four seconds is 125 frames of Dolby Digital exactly, so the segments the muxer
/// cuts are the lengths the playlist declares.
pub const AUDIO_SEGMENT_SECONDS: u32 = 4;

/// Where the playlist tying the two halves together is kept, beside the picture.
pub const MULTIVARIANT_NAME: &str = "multivariant.m3u8";

/// Which half of a split session a file belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Half {
    Video,
    Audio,
}

/// Whether a session asked for this way is sent as picture and sound apart.
///
/// Only fragmented MP4: transport streams carry their own timing and go to
/// clients that were never given the choice.
#[must_use]
pub fn splits(spec: &SessionSpec, is_enabled: bool) -> bool {
    is_enabled && spec.track == Track::Both && spec.container == SegmentContainer::Fmp4
}

/// Which half a file asked for belongs to, and what that half calls it.
///
/// The picture's session writes its own playlist as `index.m3u8`, which is the
/// name a player asks for first and so has to be the playlist that ties the two
/// together. Everything of the sound is named for what it is and renamed back
/// to what its own session wrote.
#[must_use]
pub fn route(name: &str) -> (Half, String) {
    if name == MANIFEST_NAME {
        return (Half::Video, MULTIVARIANT_NAME.to_owned());
    }

    if name == VIDEO_PLAYLIST_NAME {
        return (Half::Video, MANIFEST_NAME.to_owned());
    }

    if name == AUDIO_PLAYLIST_NAME {
        return (Half::Audio, MANIFEST_NAME.to_owned());
    }

    if name == AUDIO_INIT_NAME {
        return (Half::Audio, INIT_SEGMENT_NAME.to_owned());
    }

    if let Some(rest) = name.strip_prefix(AUDIO_SEGMENT_PREFIX) {
        if rest.starts_with(|character: char| character.is_ascii_digit()) {
            return (Half::Audio, format!("segment{rest}"));
        }
    }

    (Half::Video, name.to_owned())
}

/// The sound's playlist, declaring the same target duration as the picture's.
///
/// Every media playlist a player is given together must declare the same one,
/// and a copied picture's is as long as the source's keyframes make it while the
/// sound's is four seconds. The sound is shared between every quality of a film,
/// so its file cannot carry any one picture's number, and it is given it as it
/// is sent.
#[must_use]
pub fn with_target_of(audio: &str, video: &str) -> String {
    let Some(target) = target_duration_of(video) else {
        return audio.to_owned();
    };

    audio
        .lines()
        .map(|line| {
            if line.starts_with(TARGET_DURATION) {
                format!("{TARGET_DURATION}{target}")
            } else {
                line.to_owned()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
        + "\n"
}

/// The tag a media playlist declares its longest segment with.
const TARGET_DURATION: &str = "#EXT-X-TARGETDURATION:";

/// The target duration a media playlist declares.
fn target_duration_of(playlist: &str) -> Option<u64> {
    playlist
        .lines()
        .find_map(|line| line.strip_prefix(TARGET_DURATION))
        .and_then(|value| value.trim().parse().ok())
}

/// The audio stream a session carries, as the file describes it.
///
/// The one asked for by index, or else the one the file marks as the default,
/// or else the first: the same choice ffmpeg makes when it is told nothing.
#[must_use]
pub fn chosen_audio(streams: &[AudioStream], index: Option<u32>) -> Option<&AudioStream> {
    match index {
        Some(index) => streams.iter().find(|stream| stream.index == index),
        None => streams
            .iter()
            .find(|stream| stream.is_default)
            .or_else(|| streams.first()),
    }
}

/// The sound as the playlist describes it to a player.
#[must_use]
pub fn audio_rendition(
    stream: &AudioStream,
    action: &AudioAction,
    codec: String,
) -> AudioRendition {
    let channels = match action {
        AudioAction::Copy => stream.channels,
        AudioAction::Encode { channels, .. } => *channels,
    };

    let name = stream
        .title
        .clone()
        .or_else(|| stream.language.clone())
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| "Audio".to_owned());

    AudioRendition {
        codec,
        channels: channels.max(1),
        language: stream.language.clone(),
        name,
    }
}

/// Roughly the most the picture and sound together run at, in bits a second.
///
/// A copied file is given twice its average, since a film's busiest scenes run
/// well above it. With one variant a player has nothing to choose between, so
/// this only has to be the right size, not exact.
#[must_use]
pub fn bandwidth(spec: &SessionSpec, file_kbps: Option<u32>) -> u64 {
    let audio = match &spec.audio {
        AudioAction::Encode {
            max_bitrate_kbps, ..
        } => u64::from(*max_bitrate_kbps) * 1_000,
        AudioAction::Copy => 1_000_000,
    };

    match &spec.video {
        VideoAction::Encode {
            max_bitrate_kbps, ..
        } => u64::from(*max_bitrate_kbps) * 1_000 + audio,
        VideoAction::Copy => file_kbps.map_or(20_000_000, |kbps| u64::from(kbps) * 2_000),
    }
}

#[cfg(test)]
mod tests {
    use super::{audio_rendition, bandwidth, chosen_audio, route, splits, with_target_of, Half};
    use crate::media::AudioStream;
    use crate::transcode_plan::{
        AudioAction, HardwareAccel, SegmentContainer, SessionSpec, SubtitleAction, Track,
        VideoAction,
    };

    fn spec() -> SessionSpec {
        SessionSpec {
            input_path: "/media/film.mkv".into(),
            start_seconds: 0,
            segment_seconds: 4,
            hardware_accel: HardwareAccel::None,
            video: VideoAction::Copy,
            audio: AudioAction::Copy,
            audio_stream_index: None,
            subtitles: SubtitleAction::None,
            source_size: None,
            container: SegmentContainer::Fmp4,
            source_video_codec: None,
            track: Track::Both,
        }
    }

    fn stream(index: u32, is_default: bool) -> AudioStream {
        AudioStream {
            index,
            codec: "eac3".into(),
            channels: 6,
            sample_rate: Some(48_000),
            profile: None,
            language: Some("eng".into()),
            title: Some("Main Movie".into()),
            is_default,
            is_atmos: false,
        }
    }

    #[test]
    fn splits_a_fragmented_session_carrying_both() {
        assert!(splits(&spec(), true));
    }

    /// An operator who turned it off gets one set of segments carrying both.
    #[test]
    fn leaves_a_session_whole_when_splitting_is_off() {
        assert!(!splits(&spec(), false));
    }

    /// Transport streams go to clients that were never offered the choice.
    #[test]
    fn leaves_transport_streams_whole() {
        let ts = SessionSpec {
            container: SegmentContainer::MpegTs,
            ..spec()
        };

        assert!(!splits(&ts, true));
    }

    /// A half is never split again.
    #[test]
    fn never_splits_a_half() {
        assert!(!splits(&spec().video_alone(), true));
        assert!(!splits(&spec().audio_alone(4), true));
    }

    /// The name a player asks for first is the playlist tying the halves together.
    #[test]
    fn answers_the_first_playlist_with_both_halves() {
        assert_eq!(
            route("index.m3u8"),
            (Half::Video, "multivariant.m3u8".into())
        );
        assert_eq!(route("video.m3u8"), (Half::Video, "index.m3u8".into()));
        assert_eq!(route("audio.m3u8"), (Half::Audio, "index.m3u8".into()));
    }

    /// Each half's files, renamed back to what its own session wrote.
    #[test]
    fn sends_each_file_to_the_half_that_wrote_it() {
        assert_eq!(route("init.mp4"), (Half::Video, "init.mp4".into()));
        assert_eq!(
            route("segment00012.m4s"),
            (Half::Video, "segment00012.m4s".into())
        );
        assert_eq!(route("init-audio.mp4"), (Half::Audio, "init.mp4".into()));
        assert_eq!(
            route("audio00012.m4s"),
            (Half::Audio, "segment00012.m4s".into())
        );
    }

    /// Only a numbered segment of the sound is the sound's.
    #[test]
    fn keeps_other_names_beginning_with_audio_on_the_picture() {
        assert_eq!(route("audio.json"), (Half::Video, "audio.json".into()));
    }

    #[test]
    fn carries_the_stream_asked_for() {
        let streams = [stream(1, true), stream(2, false)];

        assert_eq!(chosen_audio(&streams, Some(2)).map(|s| s.index), Some(2));
        assert_eq!(chosen_audio(&streams, Some(9)).map(|s| s.index), None);
    }

    /// Nothing asked for is the file's default, as ffmpeg would choose.
    #[test]
    fn carries_the_default_stream_when_none_was_asked_for() {
        let streams = [stream(1, false), stream(2, true)];

        assert_eq!(chosen_audio(&streams, None).map(|s| s.index), Some(2));
        assert_eq!(
            chosen_audio(&[stream(1, false)], None).map(|s| s.index),
            Some(1)
        );
        assert!(chosen_audio(&[], None).is_none());
    }

    #[test]
    fn describes_the_sound_as_the_file_names_it() {
        let rendition = audio_rendition(&stream(1, true), &AudioAction::Copy, "ec-3".into());

        assert_eq!(rendition.name, "Main Movie");
        assert_eq!(rendition.channels, 6);
        assert_eq!(rendition.language.as_deref(), Some("eng"));
        assert_eq!(rendition.codec, "ec-3");
    }

    /// Encoded sound has the channels it was encoded to, not the source's.
    #[test]
    fn describes_encoded_sound_by_what_it_became() {
        let encoded = AudioAction::Encode {
            encoder: "aac".into(),
            channels: 2,
            max_bitrate_kbps: 192,
        };

        assert_eq!(
            audio_rendition(&stream(1, true), &encoded, "mp4a.40.2".into()).channels,
            2
        );
    }

    /// A track with neither title nor language still has a name to show.
    #[test]
    fn names_an_untitled_track() {
        let bare = AudioStream {
            title: None,
            language: None,
            ..stream(1, true)
        };

        assert_eq!(
            audio_rendition(&bare, &AudioAction::Copy, "ec-3".into()).name,
            "Audio"
        );
    }

    #[test]
    fn allows_a_copied_film_twice_its_average() {
        assert_eq!(bandwidth(&spec(), Some(8_879)), 17_758_000);
    }

    #[test]
    fn allows_an_encode_its_ceiling_and_its_sound() {
        let encoded = SessionSpec {
            video: VideoAction::Encode {
                encoder: "libx264".into(),
                max_bitrate_kbps: 4_000,
                max_width: 1280,
                max_height: 720,
                tone_map: None,
                deinterlace: false,
                square_pixels: false,
            },
            audio: AudioAction::Encode {
                encoder: "aac".into(),
                channels: 2,
                max_bitrate_kbps: 192,
            },
            ..spec()
        };

        assert_eq!(bandwidth(&encoded, Some(8_879)), 4_192_000);
    }

    /// Both media playlists a player is given must declare the same target.
    #[test]
    fn gives_the_sound_the_pictures_target_duration() {
        let video = "#EXTM3U\n#EXT-X-TARGETDURATION:11\n#EXTINF:10.135000,\nsegment00000.m4s\n";
        let audio = "#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4.000000,\naudio00000.m4s\n";

        assert_eq!(
            with_target_of(audio, video),
            "#EXTM3U\n#EXT-X-TARGETDURATION:11\n#EXTINF:4.000000,\naudio00000.m4s\n"
        );
    }

    /// A picture playlist that declares nothing leaves the sound's as it was.
    #[test]
    fn leaves_the_sound_alone_without_a_target_to_match() {
        let audio = "#EXTM3U\n#EXT-X-TARGETDURATION:4\n";

        assert_eq!(with_target_of(audio, "#EXTM3U\n"), audio);
    }
}
