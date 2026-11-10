//! Which pictures a graphics chip can be trusted to decode.
//!
//! A chip's decoder takes the common shapes of each codec and nothing else, and asking it for
//! another does not fail: on an Intel iGPU a ten-bit 4:4:4 H.264 episode decodes on the device into
//! frames of green blocks, which a preview, a sheet and a transcoded film all faithfully show. The
//! bit depths a device proved it can carry say nothing about this, since the proof was an HEVC
//! picture. So a picture is decoded on the device only where every decoder of its codec takes it —
//! 4:2:0, and eight bits for H.264 — and by the processor otherwise, which decodes anything ffmpeg
//! does before the frames go up to the device to be encoded.

use std::path::Path;

use tokio::process::Command;

use crate::media::bit_depth_from_pix_fmt;

/// How the names of the 4:2:0 pixel formats begin, the only chroma every hardware decoder takes.
const FOUR_TWO_ZERO: [&str; 6] = ["yuv420p", "yuvj420p", "nv12", "nv21", "p010", "p016"];

/// Whether a graphics chip can decode a picture of this codec and pixel format.
///
/// A picture whose pixel format is not known is taken to be decodable, which is what every
/// picture was taken to be before this was asked.
///
/// # Arguments
///
/// * `codec` - The codec, as ffprobe names it, where it is known.
/// * `pixel_format` - The pixel format, as ffprobe names it, where it is known.
#[must_use]
pub fn device_decodes(codec: Option<&str>, pixel_format: Option<&str>) -> bool {
    let Some(format) = pixel_format else {
        return true;
    };

    if !FOUR_TWO_ZERO
        .iter()
        .any(|prefix| format.starts_with(prefix))
    {
        return false;
    }

    codec != Some("h264") || bit_depth_from_pix_fmt(format).is_none_or(|depth| depth <= 8)
}

/// The codec and pixel format of a file's first picture, read from its header alone.
///
/// Asked only of a session about to decode on the device, so a film the device can decode
/// starts as quickly as it did, and one it cannot is caught before its first segment.
///
/// # Arguments
///
/// * `ffprobe` - The ffprobe to run.
/// * `path` - The file.
///
/// # Returns
///
/// The codec and the pixel format, or nothing where ffprobe could not say.
pub async fn picture_format_of(ffprobe: &str, path: &Path) -> Option<(String, String)> {
    let output = Command::new(ffprobe)
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=codec_name,pix_fmt",
            "-of",
            "csv=p=0",
        ])
        .arg(path)
        .kill_on_drop(true)
        .output()
        .await
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let answer = String::from_utf8_lossy(&output.stdout);
    let mut fields = answer.lines().next()?.split(',');
    let codec = fields.next()?.trim();
    let format = fields.next()?.trim();

    (!codec.is_empty() && !format.is_empty()).then(|| (codec.to_owned(), format.to_owned()))
}

#[cfg(test)]
mod tests {
    use super::device_decodes;

    #[test]
    fn decodes_the_common_shapes_on_the_device() {
        assert!(device_decodes(Some("h264"), Some("yuv420p")));
        assert!(device_decodes(Some("h264"), Some("yuvj420p")));
        assert!(device_decodes(Some("hevc"), Some("yuv420p10le")));
        assert!(device_decodes(Some("hevc"), Some("p010le")));
        assert!(device_decodes(Some("av1"), Some("yuv420p10le")));
        assert!(device_decodes(Some("h264"), Some("nv12")));
    }

    #[test]
    fn decodes_ten_bit_h264_and_anything_but_four_two_zero_on_the_processor() {
        assert!(!device_decodes(Some("h264"), Some("yuv444p10le")));
        assert!(!device_decodes(Some("h264"), Some("yuv420p10le")));
        assert!(!device_decodes(Some("h264"), Some("yuv422p")));
        assert!(!device_decodes(Some("hevc"), Some("yuv444p")));
        assert!(!device_decodes(Some("hevc"), Some("yuv422p10le")));
        assert!(!device_decodes(None, Some("gbrp")));
    }

    #[test]
    fn takes_a_picture_it_knows_nothing_of_to_be_decodable() {
        assert!(device_decodes(Some("h264"), None));
        assert!(device_decodes(None, None));
    }
}
