//! The same film described as MPEG-DASH, beside its HLS playlists.
//!
//! A session's segments are fragmented MP4 — CMAF, in all but name — and so
//! are exactly what a DASH player reads. Nothing is transcoded twice: the
//! picture's qualities and the sound a split session already writes are named
//! again in an MPD, with every segment's length as the keyframes made it, and
//! a player that prefers DASH reads that instead of the HLS playlist.
//!
//! Every address in it is relative to where the MPD is served, which is beside
//! the picture's own playlist, so the names it uses are the names the session
//! already answers to: the picture's `init.mp4` and `segmentNNNNN.m4s`, another
//! quality's under `../<its session>/`, and the sound's `init-audio.mp4` and
//! `audioNNNNN.m4s`. See VAL-387.

use std::fmt::Write as _;

use crate::playlist::{AUDIO_INIT_NAME, AUDIO_SEGMENT_PREFIX};
use crate::transcode_plan::INIT_SEGMENT_NAME;

/// What the MPD is called, beside the picture's playlist.
pub const DASH_MANIFEST_NAME: &str = "manifest.mpd";

/// Milliseconds, which is the clock every timeline here keeps.
const TIMESCALE: f64 = 1000.0;

/// One quality of the picture.
#[derive(Debug, Clone, PartialEq)]
pub struct DashVideo {
    /// The codec string, as the initialisation segment describes it.
    pub codec: String,
    /// The most it runs at, in bits a second.
    pub bandwidth: u64,
    pub size: Option<(u32, u32)>,
    /// Where its files are, relative to the MPD: nothing for the picture's own
    /// session, or `../<session>/` for another quality's.
    pub base: String,
    /// Every segment's length in seconds, in order.
    pub lengths: Vec<f64>,
}

/// The sound every quality of the picture shares.
#[derive(Debug, Clone, PartialEq)]
pub struct DashAudio {
    pub codec: String,
    pub channels: u8,
    /// The language as the file tags it, where it does.
    pub language: Option<String>,
    /// What a viewer is shown as the track's name.
    pub name: String,
    /// Every segment's length in seconds, in order.
    pub lengths: Vec<f64>,
}

/// Reads every segment's length back out of an HLS media playlist.
#[must_use]
pub fn lengths_of(playlist: &str) -> Vec<f64> {
    playlist
        .lines()
        .filter_map(|line| line.strip_prefix("#EXTINF:"))
        .filter_map(|rest| rest.split(',').next()?.trim().parse::<f64>().ok())
        .filter(|length| length.is_finite() && *length > 0.0)
        .collect()
}

/// Turns seconds into the timeline's milliseconds.
#[allow(
    clippy::cast_possible_truncation,
    clippy::cast_sign_loss,
    reason = "a film's length in milliseconds, never negative and nowhere near u64's limit"
)]
fn milliseconds(seconds: f64) -> u64 {
    (seconds.max(0.0) * TIMESCALE).round() as u64
}

/// The `SegmentTimeline` for segments of these lengths.
///
/// Each start is the running total rounded once, rather than each length
/// rounded and added, so a film of thousands of segments ends where it does
/// instead of drifting a millisecond a segment. Runs of equal lengths share one
/// entry, which is most of a transcode.
#[must_use]
pub fn timeline(lengths: &[f64]) -> String {
    let mut entries: Vec<(u64, u64, u64)> = Vec::new();
    let mut elapsed = 0.0_f64;

    for length in lengths {
        let start = milliseconds(elapsed);

        elapsed += length;

        let duration = milliseconds(elapsed).saturating_sub(start);

        match entries.last_mut() {
            Some((_, last, repeats)) if *last == duration => *repeats += 1,
            _ => entries.push((start, duration, 0)),
        }
    }

    let mut out = String::from("<SegmentTimeline>");

    for (start, duration, repeats) in entries {
        if repeats == 0 {
            let _ = write!(out, "<S t=\"{start}\" d=\"{duration}\"/>");
        } else {
            let _ = write!(out, "<S t=\"{start}\" d=\"{duration}\" r=\"{repeats}\"/>");
        }
    }

    out.push_str("</SegmentTimeline>");
    out
}

/// A value made safe to sit inside an XML attribute or element.
fn escaped(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

/// Writes a length of time as an MPD writes one.
fn duration(seconds: f64) -> String {
    format!("PT{:.3}S", seconds.max(0.0))
}

/// Builds the MPD naming every quality of the picture and the sound beside it.
#[must_use]
pub fn build_mpd(videos: &[DashVideo], audio: &DashAudio) -> String {
    let total = videos
        .iter()
        .map(|video| video.lengths.iter().sum::<f64>())
        .chain(std::iter::once(audio.lengths.iter().sum::<f64>()))
        .fold(0.0_f64, f64::max);
    let longest = videos
        .iter()
        .flat_map(|video| video.lengths.iter())
        .chain(audio.lengths.iter())
        .copied()
        .fold(1.0_f64, f64::max);

    let mut mpd = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    let _ = writeln!(
        mpd,
        "<MPD xmlns=\"urn:mpeg:dash:schema:mpd:2011\" profiles=\"urn:mpeg:dash:profile:isoff-live:2011\" \
         type=\"static\" mediaPresentationDuration=\"{}\" minBufferTime=\"{}\">",
        duration(total),
        duration(longest.ceil())
    );
    mpd.push_str("<Period id=\"0\" start=\"PT0S\">\n");
    mpd.push_str(
        "<AdaptationSet id=\"0\" contentType=\"video\" mimeType=\"video/mp4\" segmentAlignment=\"false\">\n",
    );

    let mut ordered: Vec<&DashVideo> = videos.iter().collect();

    ordered.sort_by_key(|video| std::cmp::Reverse(video.bandwidth));

    for (index, video) in ordered.into_iter().enumerate() {
        let size = video
            .size
            .map(|(width, height)| format!(" width=\"{width}\" height=\"{height}\""))
            .unwrap_or_default();

        let _ = writeln!(
            mpd,
            "<Representation id=\"v{index}\" codecs=\"{}\" bandwidth=\"{}\"{size}>\
             <SegmentTemplate timescale=\"1000\" initialization=\"{}{INIT_SEGMENT_NAME}\" \
             media=\"{}segment$Number%05d$.m4s\" startNumber=\"0\">{}</SegmentTemplate></Representation>",
            escaped(&video.codec),
            video.bandwidth.max(1),
            escaped(&video.base),
            escaped(&video.base),
            timeline(&video.lengths)
        );
    }

    mpd.push_str("</AdaptationSet>\n");

    let language = audio
        .language
        .as_deref()
        .filter(|language| !language.is_empty() && *language != "und")
        .map(|language| format!(" lang=\"{}\"", escaped(language)))
        .unwrap_or_default();

    let _ = writeln!(
        mpd,
        "<AdaptationSet id=\"1\" contentType=\"audio\" mimeType=\"audio/mp4\"{language}>\
         <Label>{}</Label>\
         <Representation id=\"a0\" codecs=\"{}\" bandwidth=\"256000\">\
         <AudioChannelConfiguration schemeIdUri=\"urn:mpeg:dash:23003:3:audio_channel_configuration:2011\" value=\"{}\"/>\
         <SegmentTemplate timescale=\"1000\" initialization=\"{AUDIO_INIT_NAME}\" \
         media=\"{AUDIO_SEGMENT_PREFIX}$Number%05d$.m4s\" startNumber=\"0\">{}</SegmentTemplate></Representation>\
         </AdaptationSet>",
        escaped(&audio.name),
        escaped(&audio.codec),
        audio.channels,
        timeline(&audio.lengths)
    );

    mpd.push_str("</Period>\n</MPD>\n");
    mpd
}

#[cfg(test)]
mod tests {
    use super::*;

    fn picture(base: &str, bandwidth: u64, lengths: Vec<f64>) -> DashVideo {
        DashVideo {
            codec: "avc1.640028".to_owned(),
            bandwidth,
            size: Some((1920, 1080)),
            base: base.to_owned(),
            lengths,
        }
    }

    fn sound() -> DashAudio {
        DashAudio {
            codec: "mp4a.40.2".to_owned(),
            channels: 2,
            language: Some("eng".to_owned()),
            name: "English & \"Commentary\"".to_owned(),
            lengths: vec![4.0, 4.0, 2.5],
        }
    }

    #[test]
    fn reads_every_segment_length_back_out_of_a_playlist() {
        assert_eq!(
            lengths_of(
                "#EXTM3U\n#EXTINF:4.000000,\nsegment00000.m4s\n#EXTINF:2.5,\nsegment00001.m4s\n"
            ),
            vec![4.0, 2.5]
        );
    }

    #[test]
    fn folds_runs_of_equal_segments_into_one_entry() {
        assert_eq!(
            timeline(&[4.0, 4.0, 4.0, 2.5]),
            "<SegmentTimeline><S t=\"0\" d=\"4000\" r=\"2\"/><S t=\"12000\" d=\"2500\"/></SegmentTimeline>"
        );
    }

    #[test]
    fn keeps_a_long_film_from_drifting_a_millisecond_a_segment() {
        assert_eq!(
            timeline(&[1.0004, 1.0004, 1.0004]),
            "<SegmentTimeline><S t=\"0\" d=\"1000\"/><S t=\"1000\" d=\"1001\"/><S t=\"2001\" d=\"1000\"/></SegmentTimeline>"
        );
    }

    #[test]
    fn names_each_quality_by_its_own_session_and_the_sound_by_its_names() {
        let mpd = build_mpd(
            &[
                picture("", 8_000_000, vec![4.0, 4.0, 2.5]),
                picture("../rung/", 2_000_000, vec![4.0, 4.0, 2.5]),
            ],
            &sound(),
        );

        assert!(mpd.contains("initialization=\"init.mp4\" media=\"segment$Number%05d$.m4s\""));
        assert!(mpd.contains(
            "initialization=\"../rung/init.mp4\" media=\"../rung/segment$Number%05d$.m4s\""
        ));
        assert!(mpd.contains("initialization=\"init-audio.mp4\" media=\"audio$Number%05d$.m4s\""));
        assert!(mpd.contains("mediaPresentationDuration=\"PT10.500S\""));
        assert!(mpd.find("bandwidth=\"8000000\"") < mpd.find("bandwidth=\"2000000\""));
    }

    #[test]
    fn writes_a_track_title_safely_into_the_xml() {
        let mpd = build_mpd(&[picture("", 1, vec![4.0])], &sound());

        assert!(mpd.contains("<Label>English &amp; &quot;Commentary&quot;</Label>"));
        assert!(mpd.contains("lang=\"eng\""));
    }
}
