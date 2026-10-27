//! Where a Matroska file can be cut, read from its own index rather than from its packets.
//!
//! Reading keyframes from the packets demuxes the whole file, which for a file
//! played straight from a remote service means downloading most of twenty or
//! sixty gigabytes before the first segment. A Matroska file carries an index of
//! its own, the cues, which list the time of each keyframe a player may seek to.
//! Reading them takes a few small range requests: the start of the file, to find
//! where the cues are and which track is the picture, and then the cues
//! themselves.
//!
//! Only what this needs of the format is read: the segment, its seek head, its
//! info (for the time scale and length), its tracks (for which one is video) and
//! its cues. Anything else is stepped over by its size.

use std::future::Future;

use crate::keyframes::{Cut, Keyframes};

const EBML: u32 = 0x1A45_DFA3;
const SEGMENT: u32 = 0x1853_8067;
const SEEK_HEAD: u32 = 0x114D_9B74;
const SEEK: u32 = 0x4DBB;
const SEEK_ID: u32 = 0x53AB;
const SEEK_POSITION: u32 = 0x53AC;
const INFO: u32 = 0x1549_A966;
const TIMESTAMP_SCALE: u32 = 0x2A_D7B1;
const DURATION: u32 = 0x4489;
const TRACKS: u32 = 0x1654_AE6B;
const TRACK_ENTRY: u32 = 0xAE;
const TRACK_NUMBER: u32 = 0xD7;
const TRACK_TYPE: u32 = 0x83;
const CUES: u32 = 0x1C53_BB6B;
const CUE_POINT: u32 = 0xBB;
const CUE_TIME: u32 = 0xB3;
const CUE_TRACK_POSITIONS: u32 = 0xB7;
const CUE_TRACK: u32 = 0xF7;
const CLUSTER: u32 = 0x1F43_B675;

const VIDEO_TRACK: u64 = 1;

/// How much of the start of a file is read to find the segment's head.
pub const HEAD_BYTES: u64 = 256 * 1024;

/// The most a file's cues are allowed to take, so a broken size cannot ask for gigabytes.
pub const MOST_CUE_BYTES: u64 = 16 * 1024 * 1024;

/// One element's header: what it is, how long its body is, and where the body begins.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Header {
    id: u32,
    size: Option<u64>,
    body: usize,
}

/// What the start of a file says about where its cues are and how to read them.
#[derive(Debug, Clone, PartialEq)]
pub struct Head {
    /// Where the cues begin, from the start of the file.
    pub cues_at: u64,
    /// How many nanoseconds one tick of a timestamp is.
    pub scale_nanoseconds: f64,
    /// How long the film runs, where the file says.
    pub duration_seconds: Option<f64>,
    /// Which track is the picture.
    pub video_track: u64,
}

/// Reads a variable-length integer, keeping its marker bit when it is an element's id.
fn vint(bytes: &[u8], at: usize, keep_marker: bool) -> Option<(u64, usize)> {
    let first = *bytes.get(at)?;
    let length = first.leading_zeros() as usize + 1;

    if length > 8 {
        return None;
    }

    let mut value = u64::from(if keep_marker {
        first
    } else {
        first
            & 0xFF_u8
                .checked_shr(u32::try_from(length).ok()?)
                .unwrap_or(0)
    });

    for offset in 1..length {
        value = (value << 8) | u64::from(*bytes.get(at + offset)?);
    }

    Some((value, length))
}

/// A count of ticks as a float, which a time scale and a cue time always fit in exactly: neither
/// comes near the 2^53 a float stops counting every whole number at.
#[allow(
    clippy::cast_precision_loss,
    reason = "ticks of a film's timeline, far below 2^53"
)]
fn ticks_as_float(ticks: u64) -> f64 {
    ticks as f64
}

/// Reads an element's header, where the bytes hold one whole.
fn header(bytes: &[u8], at: usize) -> Option<Header> {
    let (id, id_length) = vint(bytes, at, true)?;
    let (size, size_length) = vint(bytes, at + id_length, false)?;
    let unknown = (1u64 << (7 * size_length)) - 1;

    Some(Header {
        id: u32::try_from(id).ok()?,
        size: (size != unknown).then_some(size),
        body: at + id_length + size_length,
    })
}

/// Reads an unsigned integer element's body.
fn unsigned(body: &[u8]) -> Option<u64> {
    (body.len() <= 8).then(|| {
        body.iter()
            .fold(0, |value, byte| (value << 8) | u64::from(*byte))
    })
}

/// Reads a float element's body, which is four or eight bytes.
fn float(body: &[u8]) -> Option<f64> {
    match body.len() {
        4 => Some(f64::from(f32::from_be_bytes(body.try_into().ok()?))),
        8 => Some(f64::from_be_bytes(body.try_into().ok()?)),
        _ => None,
    }
}

/// Every child of an element whose body is whole in the bytes, as each one's id and body.
fn children(bytes: &[u8], from: usize, to: usize) -> Vec<(u32, &[u8])> {
    let mut found = Vec::new();
    let mut at = from;

    while at < to {
        let Some(child) = header(bytes, at) else {
            break;
        };
        let Some(size) = child.size else {
            break;
        };
        let Ok(size) = usize::try_from(size) else {
            break;
        };
        let end = child.body + size;

        if end > to {
            break;
        }

        found.push((child.id, &bytes[child.body..end]));
        at = end;
    }

    found
}

/// Reads what the start of a Matroska file says about its cues.
///
/// Nothing is answered where the bytes are not Matroska, the seek head does not
/// say where the cues are, or there is no video track.
#[must_use]
pub fn read_head(bytes: &[u8]) -> Option<Head> {
    let ebml = header(bytes, 0)?;

    if ebml.id != EBML {
        return None;
    }

    let segment = header(bytes, ebml.body + usize::try_from(ebml.size?).ok()?)?;

    if segment.id != SEGMENT {
        return None;
    }

    let segment_start = segment.body;
    let mut cues_at = None;
    let mut scale = 1_000_000.0;
    let mut duration = None;
    let mut video_track = None;
    let mut at = segment_start;

    while let Some(element) = header(bytes, at) {
        if element.id == CLUSTER {
            break;
        }

        let Some(size) = element.size.and_then(|size| usize::try_from(size).ok()) else {
            break;
        };
        let end = element.body + size;

        if end > bytes.len() {
            break;
        }

        match element.id {
            SEEK_HEAD => {
                for (id, seek) in children(bytes, element.body, end) {
                    if id != SEEK {
                        continue;
                    }

                    let fields = children(seek, 0, seek.len());
                    let names = fields
                        .iter()
                        .find(|(field, _)| *field == SEEK_ID)
                        .and_then(|(_, body)| unsigned(body));
                    let position = fields
                        .iter()
                        .find(|(field, _)| *field == SEEK_POSITION)
                        .and_then(|(_, body)| unsigned(body));

                    if names == Some(u64::from(CUES)) {
                        cues_at = position
                            .and_then(|position| (segment_start as u64).checked_add(position));
                    }
                }
            }
            INFO => {
                let fields = children(bytes, element.body, end);

                if let Some(read) = fields
                    .iter()
                    .find(|(field, _)| *field == TIMESTAMP_SCALE)
                    .and_then(|(_, body)| unsigned(body))
                {
                    scale = ticks_as_float(read);
                }

                duration = fields
                    .iter()
                    .find(|(field, _)| *field == DURATION)
                    .and_then(|(_, body)| float(body));
            }
            TRACKS => {
                for (id, entry) in children(bytes, element.body, end) {
                    if id != TRACK_ENTRY || video_track.is_some() {
                        continue;
                    }

                    let fields = children(entry, 0, entry.len());
                    let kind = fields
                        .iter()
                        .find(|(field, _)| *field == TRACK_TYPE)
                        .and_then(|(_, body)| unsigned(body));

                    if kind == Some(VIDEO_TRACK) {
                        video_track = fields
                            .iter()
                            .find(|(field, _)| *field == TRACK_NUMBER)
                            .and_then(|(_, body)| unsigned(body));
                    }
                }
            }
            CUES => {
                cues_at.get_or_insert(at as u64);
            }
            _ => {}
        }

        at = end;
    }

    Some(Head {
        cues_at: cues_at?,
        scale_nanoseconds: scale,
        duration_seconds: duration.map(|ticks| ticks * scale / 1e9),
        video_track: video_track?,
    })
}

/// How many bytes the cues element at the start of these bytes takes, header and all.
#[must_use]
pub fn cues_length(bytes: &[u8]) -> Option<u64> {
    let cues = header(bytes, 0)?;

    if cues.id != CUES {
        return None;
    }

    (cues.body as u64).checked_add(cues.size.unwrap_or(0))
}

/// Reads the cue times of the video track out of a whole cues element.
///
/// Answered in seconds, ascending, each time once.
#[must_use]
pub fn read_cue_times(bytes: &[u8], head: &Head) -> Vec<f64> {
    let Some(cues) = header(bytes, 0) else {
        return Vec::new();
    };
    let Some(end) = cues
        .size
        .and_then(|size| usize::try_from(size).ok())
        .map(|size| (cues.body + size).min(bytes.len()))
    else {
        return Vec::new();
    };

    let mut times: Vec<f64> = children(bytes, cues.body, end)
        .into_iter()
        .filter(|(id, _)| *id == CUE_POINT)
        .filter_map(|(_, point)| {
            let fields = children(point, 0, point.len());
            let time = fields
                .iter()
                .find(|(field, _)| *field == CUE_TIME)
                .and_then(|(_, body)| unsigned(body))?;
            let is_video = fields
                .iter()
                .filter(|(field, _)| *field == CUE_TRACK_POSITIONS)
                .any(|(_, positions)| {
                    children(positions, 0, positions.len())
                        .iter()
                        .any(|(field, body)| {
                            *field == CUE_TRACK && unsigned(body) == Some(head.video_track)
                        })
                });

            is_video.then(|| ticks_as_float(time) * head.scale_nanoseconds / 1e9)
        })
        .collect();

    times.sort_by(f64::total_cmp);
    times.dedup_by(|later, earlier| (*later - *earlier).abs() < 1e-6);

    times
}

/// The keyframes a file's cues describe, as a session cuts on them.
///
/// Each cue is a keyframe a player may start at, so its segment begins there.
/// Nothing is answered where there are too few cues to cut a film into
/// segments, which leaves the session to encode instead.
#[must_use]
pub fn keyframes_from(times: &[f64], duration_seconds: f64) -> Option<Keyframes> {
    let first = *times.first()?;

    (times.len() >= 2 && duration_seconds > first).then(|| Keyframes {
        cuts: times
            .iter()
            .map(|&at| Cut {
                at_seconds: at,
                starts_at_seconds: at,
            })
            .collect(),
        starts_at_seconds: first,
        duration_seconds,
    })
}

/// Reads a remote Matroska file's keyframes through its cues, with whatever
/// reads a stretch of it.
///
/// Two or three reads: the head, then the cues' own header and body.
pub async fn read_remote_keyframes<Read, Reading>(read: Read) -> Option<Keyframes>
where
    Read: Fn(u64, u64) -> Reading,
    Reading: Future<Output = Option<Vec<u8>>>,
{
    let head = read_head(&read(0, HEAD_BYTES).await?)?;
    let first = read(head.cues_at, 64).await?;
    let length = cues_length(&first)?.min(MOST_CUE_BYTES);
    let cues = read(head.cues_at, length).await?;
    let times = read_cue_times(&cues, &head);
    let duration = head.duration_seconds?;

    keyframes_from(&times, duration)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// An element: its id, a size of eight bytes, and its body.
    fn element(id: u32, body: &[u8]) -> Vec<u8> {
        let mut bytes: Vec<u8> = id
            .to_be_bytes()
            .into_iter()
            .skip_while(|byte| *byte == 0)
            .collect();

        bytes.push(0x01);
        bytes.extend_from_slice(&(body.len() as u64).to_be_bytes()[1..]);
        bytes.extend_from_slice(body);

        bytes
    }

    fn number(id: u32, value: u64) -> Vec<u8> {
        element(id, &value.to_be_bytes())
    }

    /// A Matroska file with a video track, a seek head pointing at cues placed
    /// after a filler, and the cues given.
    fn a_file(cue_times: &[u64], filler: usize) -> Vec<u8> {
        let cues = element(
            CUES,
            &cue_times
                .iter()
                .flat_map(|time| {
                    element(
                        CUE_POINT,
                        &[
                            number(CUE_TIME, *time),
                            element(
                                CUE_TRACK_POSITIONS,
                                &[number(CUE_TRACK, 1), number(0xF1, 100)].concat(),
                            ),
                        ]
                        .concat(),
                    )
                })
                .chain(element(
                    CUE_POINT,
                    &[
                        number(CUE_TIME, 999),
                        element(CUE_TRACK_POSITIONS, &number(CUE_TRACK, 2)),
                    ]
                    .concat(),
                ))
                .collect::<Vec<u8>>(),
        );
        let info = element(
            INFO,
            &[
                number(TIMESTAMP_SCALE, 1_000_000),
                element(DURATION, &90_000.0f64.to_be_bytes()),
            ]
            .concat(),
        );
        let tracks = element(
            TRACKS,
            &[
                element(
                    TRACK_ENTRY,
                    &[number(TRACK_NUMBER, 2), number(TRACK_TYPE, 2)].concat(),
                ),
                element(
                    TRACK_ENTRY,
                    &[number(TRACK_NUMBER, 1), number(TRACK_TYPE, 1)].concat(),
                ),
            ]
            .concat(),
        );
        let seek_head_length = element(
            SEEK_HEAD,
            &element(
                SEEK,
                &[number(SEEK_ID, u64::from(CUES)), number(SEEK_POSITION, 0)].concat(),
            ),
        )
        .len();
        let cues_position = (seek_head_length + info.len() + tracks.len() + filler) as u64;
        let seek_head = element(
            SEEK_HEAD,
            &element(
                SEEK,
                &[
                    number(SEEK_ID, u64::from(CUES)),
                    number(SEEK_POSITION, cues_position),
                ]
                .concat(),
            ),
        );
        let body = [
            seek_head,
            info,
            tracks,
            element(0xEC, &vec![0; filler - 9]),
            cues,
        ]
        .concat();

        [
            element(EBML, &[0x42, 0x86, 0x81, 0x01]),
            element(SEGMENT, &body),
        ]
        .concat()
    }

    #[test]
    fn reads_where_the_cues_are_and_which_track_is_the_picture() {
        let file = a_file(&[0, 4000], 100);
        let head = read_head(&file).expect("reads the head");

        assert_eq!(head.video_track, 1);
        assert_eq!(head.duration_seconds, Some(90.0));
        assert!(cues_length(&file[usize::try_from(head.cues_at).expect("fits")..]).is_some());
    }

    #[test]
    fn reads_the_picture_tracks_cue_times_in_seconds_once_each() {
        let file = a_file(&[0, 4000, 4000, 2000], 100);
        let head = read_head(&file).expect("reads the head");
        let cues = &file[usize::try_from(head.cues_at).expect("fits")..];

        assert_eq!(read_cue_times(cues, &head), vec![0.0, 2.0, 4.0]);
    }

    #[test]
    fn makes_keyframes_a_session_can_cut_on() {
        let keyframes = keyframes_from(&[0.0, 2.0, 4.0], 90.0).expect("cuts");

        assert_eq!(keyframes.cuts.len(), 3);
        assert!(keyframes.cuts.iter().all(|cut| cut.is_safe()));
        assert!((keyframes.duration_seconds - 90.0).abs() < 1e-9);
        assert!(keyframes_from(&[0.0], 90.0).is_none());
    }

    #[test]
    fn refuses_what_is_not_matroska() {
        assert!(read_head(b"not a film at all").is_none());
        assert!(read_head(&[]).is_none());
    }

    #[tokio::test]
    async fn reads_a_remote_files_keyframes_in_a_few_reads() {
        let file = a_file(&[0, 2000, 6000], 200);
        let reads = std::sync::Mutex::new(Vec::new());
        let keyframes = read_remote_keyframes(|from, length| {
            reads.lock().expect("not poisoned").push((from, length));
            let start = usize::try_from(from).expect("fits").min(file.len());
            let end = usize::try_from(from + length)
                .expect("fits")
                .min(file.len());
            let stretch = file[start..end].to_vec();

            async move { Some(stretch) }
        })
        .await
        .expect("reads them");

        assert_eq!(
            keyframes
                .cuts
                .iter()
                .map(|cut| cut.at_seconds)
                .collect::<Vec<_>>(),
            vec![0.0, 2.0, 6.0]
        );
        assert_eq!(reads.lock().expect("not poisoned").len(), 3);
    }
}
