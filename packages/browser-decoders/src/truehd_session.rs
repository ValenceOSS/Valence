//! Decodes a Dolby `TrueHD` stream to interleaved 32-bit float samples, in the channel order
//! `WAVE` and `FFmpeg` use, for the page to hand on to an encoder.

use truehd::process::decode::Decoder;
use truehd::process::extract::Extractor;
use truehd::process::parse::Parser;
use truehd::structs::channel::ChannelLabel;

const MOST_CHANNELS: usize = 8;

const FULL_SCALE: f32 = 8_388_608.0;

const WAVE_ORDER: [ChannelLabel; MOST_CHANNELS] = [
    ChannelLabel::L,
    ChannelLabel::R,
    ChannelLabel::C,
    ChannelLabel::LFE,
    ChannelLabel::Lb,
    ChannelLabel::Rb,
    ChannelLabel::Ls,
    ChannelLabel::Rs,
];

const SURROUND_ORDER: [ChannelLabel; 6] = [
    ChannelLabel::L,
    ChannelLabel::R,
    ChannelLabel::C,
    ChannelLabel::LFE,
    ChannelLabel::Ls,
    ChannelLabel::Rs,
];

/// A 24-bit sample as a float in the range minus one to one.
#[expect(
    clippy::cast_precision_loss,
    reason = "the samples are 24-bit, which a float's 24-bit significand holds exactly"
)]
fn to_float(sample: i32) -> f32 {
    sample as f32 / FULL_SCALE
}

/// One `TrueHD` stream being decoded, and the samples it has produced since the page last took them.
pub struct TrueHdSession {
    extractor: Extractor,
    parser: Parser,
    decoder: Decoder,
    samples: Vec<f32>,
    channels: u32,
    sample_rate: u32,
}

impl TrueHdSession {
    fn new() -> Self {
        Self {
            extractor: Extractor::default(),
            parser: Parser::default(),
            decoder: Decoder::default(),
            samples: Vec::new(),
            channels: 0,
            sample_rate: 0,
        }
    }

    /// The order to read a presentation's channels in so they come out in `WAVE` order: the
    /// channels it has from the order `WAVE` gives them, then anything else it has as it lists them.
    fn wave_positions(labels: &[ChannelLabel]) -> Vec<usize> {
        let order: &[ChannelLabel] = if labels.len() > SURROUND_ORDER.len() {
            &WAVE_ORDER
        } else {
            &SURROUND_ORDER
        };
        let mut positions: Vec<usize> = order
            .iter()
            .filter_map(|wanted| labels.iter().position(|label| label == wanted))
            .collect();

        for (at, _) in labels.iter().enumerate() {
            if !positions.contains(&at) {
                positions.push(at);
            }
        }

        positions
    }

    /// Feeds the session the next packet's bytes and decodes every access unit they complete,
    /// keeping the largest presentation of at most eight channels each one carries.
    ///
    /// Returns how many frames of samples were added.
    fn push(&mut self, bytes: &[u8]) -> usize {
        self.extractor.push_bytes(bytes);

        let mut added = 0;
        let required = [true, true, true, false];

        for extracted in self.extractor.by_ref() {
            let Ok(frame) = extracted else { continue };
            let Some(unit) = self.parser.parse_recovering(&frame) else {
                continue;
            };
            let Ok(decoded) = self.decoder.decode_presentations(&unit, &required) else {
                continue;
            };
            let Some(best) = decoded
                .iter()
                .flatten()
                .filter(|one| one.channel_count <= MOST_CHANNELS)
                .max_by_key(|one| one.channel_count)
            else {
                continue;
            };

            let positions = Self::wave_positions(&best.channel_labels);

            self.channels = u32::try_from(positions.len()).unwrap_or(0);
            self.sample_rate = best.sampling_frequency;

            for row in best.pcm_data.iter().take(best.sample_length) {
                for &position in &positions {
                    self.samples
                        .push(to_float(row.get(position).copied().unwrap_or(0)));
                }
            }

            added += best.sample_length;
        }

        added
    }
}

/// Starts decoding a `TrueHD` stream.
#[no_mangle]
pub extern "C" fn truehd_new() -> *mut TrueHdSession {
    Box::into_raw(Box::new(TrueHdSession::new()))
}

/// Stops decoding a stream `truehd_new` started.
///
/// # Safety
///
/// `session` must be null or a session `truehd_new` returned and `truehd_free` has not yet freed,
/// not in use elsewhere while this runs.
#[no_mangle]
pub unsafe extern "C" fn truehd_free(session: *mut TrueHdSession) {
    if !session.is_null() {
        // SAFETY: the caller hands back a session `truehd_new` made, and only once.
        drop(unsafe { Box::from_raw(session) });
    }
}

/// Decodes the packet of `length` bytes at `bytes`, returning how many frames of samples it added.
///
/// # Safety
///
/// `session` must be null or a session `truehd_new` returned and `truehd_free` has not yet freed,
/// not in use elsewhere while this runs. `bytes` must be null or
/// point to `length` readable bytes.
#[no_mangle]
pub unsafe extern "C" fn truehd_push(
    session: *mut TrueHdSession,
    bytes: *const u8,
    length: usize,
) -> usize {
    if session.is_null() || bytes.is_null() {
        return 0;
    }

    // SAFETY: the caller promises an unshared `truehd_new` session and `length` readable bytes.
    let (session, packet) = unsafe { (&mut *session, std::slice::from_raw_parts(bytes, length)) };

    session.push(packet)
}

/// Where the samples decoded since they were last taken start, interleaved.
///
/// # Safety
///
/// `session` must be null or a session `truehd_new` returned and `truehd_free` has not yet freed,
/// not in use elsewhere while this runs.
#[no_mangle]
pub unsafe extern "C" fn truehd_samples(session: *const TrueHdSession) -> *const f32 {
    if session.is_null() {
        return std::ptr::null();
    }

    // SAFETY: the session came from `truehd_new` and has not been freed.
    unsafe { (*session).samples.as_ptr() }
}

/// How many samples, counting every channel, have been decoded since they were last taken.
///
/// # Safety
///
/// `session` must be null or a session `truehd_new` returned and `truehd_free` has not yet freed,
/// not in use elsewhere while this runs.
#[no_mangle]
pub unsafe extern "C" fn truehd_sample_count(session: *const TrueHdSession) -> usize {
    if session.is_null() {
        return 0;
    }

    // SAFETY: the session came from `truehd_new` and has not been freed.
    unsafe { (*session).samples.len() }
}

/// Forgets the samples the page has taken.
///
/// # Safety
///
/// `session` must be null or a session `truehd_new` returned and `truehd_free` has not yet freed,
/// not in use elsewhere while this runs.
#[no_mangle]
pub unsafe extern "C" fn truehd_take(session: *mut TrueHdSession) {
    if !session.is_null() {
        // SAFETY: the session came from `truehd_new` and nothing else holds it while this runs.
        unsafe { (*session).samples.clear() }
    }
}

/// How many channels the decoded samples have, or zero before any have been decoded.
///
/// # Safety
///
/// `session` must be null or a session `truehd_new` returned and `truehd_free` has not yet freed,
/// not in use elsewhere while this runs.
#[no_mangle]
pub unsafe extern "C" fn truehd_channels(session: *const TrueHdSession) -> u32 {
    if session.is_null() {
        return 0;
    }

    // SAFETY: the session came from `truehd_new` and has not been freed.
    unsafe { (*session).channels }
}

/// The decoded samples' rate in hertz, or zero before any have been decoded.
///
/// # Safety
///
/// `session` must be null or a session `truehd_new` returned and `truehd_free` has not yet freed,
/// not in use elsewhere while this runs.
#[no_mangle]
pub unsafe extern "C" fn truehd_sample_rate(session: *const TrueHdSession) -> u32 {
    if session.is_null() {
        return 0;
    }

    // SAFETY: the session came from `truehd_new` and has not been freed.
    unsafe { (*session).sample_rate }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_seven_one_in_wave_order() {
        let labels = [
            ChannelLabel::L,
            ChannelLabel::R,
            ChannelLabel::C,
            ChannelLabel::LFE,
            ChannelLabel::Ls,
            ChannelLabel::Rs,
            ChannelLabel::Lb,
            ChannelLabel::Rb,
        ];

        assert_eq!(
            TrueHdSession::wave_positions(&labels),
            vec![0, 1, 2, 3, 6, 7, 4, 5]
        );
    }

    #[test]
    fn reads_five_one_as_it_is() {
        assert_eq!(
            TrueHdSession::wave_positions(&SURROUND_ORDER),
            vec![0, 1, 2, 3, 4, 5]
        );
    }

    #[test]
    fn decodes_nothing_from_nothing() {
        let mut session = TrueHdSession::new();

        assert_eq!(session.push(&[]), 0);
    }
}
