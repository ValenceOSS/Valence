//! Bytes written the way passkeys write them: `base64url`, without padding.

use base64::alphabet::URL_SAFE;
use base64::engine::general_purpose::{GeneralPurpose, GeneralPurposeConfig};
use base64::engine::DecodePaddingMode;
use base64::Engine;

/// The engine, which writes no padding and reads text with or without it.
const ENGINE: GeneralPurpose = GeneralPurpose::new(
    &URL_SAFE,
    GeneralPurposeConfig::new()
        .with_encode_padding(false)
        .with_decode_padding_mode(DecodePaddingMode::Indifferent),
);

/// Writes bytes as base64url.
#[must_use]
pub fn encode(bytes: &[u8]) -> String {
    ENGINE.encode(bytes)
}

/// Reads base64url, or nothing where it is not.
#[must_use]
pub fn decode(text: &str) -> Option<Vec<u8>> {
    ENGINE.decode(text).ok()
}

#[cfg(test)]
mod tests {
    use super::{decode, encode};

    #[test]
    fn writes_without_padding_and_reads_either_way() {
        assert_eq!(encode(b"key"), "a2V5");
        assert_eq!(encode(b"ke"), "a2U");
        assert_eq!(decode("a2U"), Some(b"ke".to_vec()));
        assert_eq!(decode("a2U="), Some(b"ke".to_vec()));
        assert_eq!(decode("not base64!"), None);
    }
}
