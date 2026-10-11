//! Decodes MPEG-2 video a group of pictures at a time, to planar 4:2:0 frames in display order.

use oxideav_mpeg12video::frame_assembly::FrameBuffer;
use oxideav_mpeg12video::sequence_extension::ChromaFormat;
use oxideav_mpeg12video::video_sequence::decode_video_sequence;

/// The frames the last group of pictures decoded to, one after another, each a luma plane then its
/// two chroma planes, tightly packed.
pub struct Mpeg2Session {
    frames: Vec<u8>,
    frame_count: u32,
    width: u32,
    height: u32,
}

impl Mpeg2Session {
    fn new() -> Self {
        Self {
            frames: Vec::new(),
            frame_count: 0,
            width: 0,
            height: 0,
        }
    }

    /// Appends one frame's three planes, refusing any frame that is not 4:2:0.
    fn keep(&mut self, frame: &FrameBuffer) -> bool {
        if !matches!(frame.chroma_format, ChromaFormat::Yuv420) {
            return false;
        }

        let (width, height) = (frame.width, frame.height);
        let (chroma_width, chroma_height) = (width.div_ceil(2), height.div_ceil(2));

        self.frames.extend(frame.y.packed_rect(width, height));
        self.frames
            .extend(frame.cb.packed_rect(chroma_width, chroma_height));
        self.frames
            .extend(frame.cr.packed_rect(chroma_width, chroma_height));
        self.width = u32::try_from(width).unwrap_or(0);
        self.height = u32::try_from(height).unwrap_or(0);
        self.frame_count += 1;

        true
    }

    /// Decodes one self-contained run of the elementary stream — a sequence header and the
    /// pictures after it — replacing whatever the last run left.
    ///
    /// Returns how many frames it decoded, or none where the run cannot be decoded.
    fn decode(&mut self, stream: &[u8]) -> u32 {
        self.frames.clear();
        self.frame_count = 0;

        let Ok(frames) = decode_video_sequence(stream) else {
            return 0;
        };

        for decoded in &frames {
            if !self.keep(&decoded.frame) {
                self.frames.clear();
                self.frame_count = 0;

                return 0;
            }
        }

        self.frame_count
    }
}

/// Starts decoding an MPEG-2 stream.
#[no_mangle]
pub extern "C" fn mpeg2_new() -> *mut Mpeg2Session {
    Box::into_raw(Box::new(Mpeg2Session::new()))
}

/// Stops decoding a stream `mpeg2_new` started.
///
/// # Safety
///
/// `session` must be null or a session `mpeg2_new` returned and `mpeg2_free` has not yet freed.
#[no_mangle]
pub unsafe extern "C" fn mpeg2_free(session: *mut Mpeg2Session) {
    if !session.is_null() {
        // SAFETY: the caller hands back a session `mpeg2_new` made, and only once.
        drop(unsafe { Box::from_raw(session) });
    }
}

/// Decodes the run of `length` bytes at `bytes`, returning how many frames it decoded.
///
/// # Safety
///
/// `session` must be null or a live session from `mpeg2_new` not in use elsewhere, and `bytes`
/// must be null or point to `length` readable bytes.
#[no_mangle]
pub unsafe extern "C" fn mpeg2_decode(
    session: *mut Mpeg2Session,
    bytes: *const u8,
    length: usize,
) -> u32 {
    if session.is_null() || bytes.is_null() {
        return 0;
    }

    // SAFETY: the caller promises the session is live and unshared, and the bytes readable.
    let (session, stream) = unsafe { (&mut *session, std::slice::from_raw_parts(bytes, length)) };

    session.decode(stream)
}

/// Where the decoded frames start.
///
/// # Safety
///
/// `session` must be null or a live session from `mpeg2_new`.
#[no_mangle]
pub unsafe extern "C" fn mpeg2_frames(session: *const Mpeg2Session) -> *const u8 {
    if session.is_null() {
        return std::ptr::null();
    }

    // SAFETY: the caller promises the session is live.
    unsafe { (*session).frames.as_ptr() }
}

/// The decoded frames' width in pixels.
///
/// # Safety
///
/// `session` must be null or a live session from `mpeg2_new`.
#[no_mangle]
pub unsafe extern "C" fn mpeg2_width(session: *const Mpeg2Session) -> u32 {
    if session.is_null() {
        return 0;
    }

    // SAFETY: the caller promises the session is live.
    unsafe { (*session).width }
}

/// The decoded frames' height in pixels.
///
/// # Safety
///
/// `session` must be null or a live session from `mpeg2_new`.
#[no_mangle]
pub unsafe extern "C" fn mpeg2_height(session: *const Mpeg2Session) -> u32 {
    if session.is_null() {
        return 0;
    }

    // SAFETY: the caller promises the session is live.
    unsafe { (*session).height }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_nothing_from_nothing() {
        assert_eq!(Mpeg2Session::new().decode(&[]), 0);
    }
}
