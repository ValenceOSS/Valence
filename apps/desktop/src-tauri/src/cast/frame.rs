//! The Cast v2 wire format: each message is a `CastMessage` protocol buffer, sent after its length
//! as four big-endian bytes.
//!
//! The one message type is small and fixed, so it is read and written here by hand rather than
//! generated from a `.proto` file at build time.

use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};

/// The largest message a Cast device sends or takes.
pub const LARGEST: usize = 64 * 1024;

const PROTOCOL_VERSION: u32 = 1;
const SOURCE_ID: u32 = 2;
const DESTINATION_ID: u32 = 3;
const NAMESPACE: u32 = 4;
const PAYLOAD_TYPE: u32 = 5;
const PAYLOAD_UTF8: u32 = 6;
const PAYLOAD_BINARY: u32 = 7;

const VARINT: u32 = 0;
const FIXED_64: u32 = 1;
const LENGTH_DELIMITED: u32 = 2;
const FIXED_32: u32 = 5;

const STRING_PAYLOAD: u64 = 0;
const BINARY_PAYLOAD: u64 = 1;

/// What a message carries: JSON as text for every namespace this app speaks, or bytes for the
/// device-authentication namespace it does not.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Payload {
    /// A UTF-8 payload.
    Text(String),
    /// A binary payload.
    Binary(Vec<u8>),
}

/// One message on a Cast connection.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CastMessage {
    /// Who sent it: a sender's own id, `receiver-0`, or an application's transport id.
    pub source: String,
    /// Who it is for, in the same terms.
    pub destination: String,
    /// The namespace it belongs to.
    pub namespace: String,
    /// What it says.
    pub payload: Payload,
}

/// Why a message could not be read.
#[derive(Debug, thiserror::Error)]
pub enum FrameError {
    /// The connection failed or closed.
    #[error("the connection failed: {0}")]
    Io(#[from] std::io::Error),
    /// A message claimed to be longer than any device sends.
    #[error("a message of {0} bytes is longer than a Cast device sends")]
    TooLong(usize),
    /// The bytes are not a `CastMessage`.
    #[error("the message could not be read")]
    Malformed,
}

/// Appends `value` as a protocol buffer varint.
fn put_varint(into: &mut Vec<u8>, mut value: u64) {
    while value >= 0x80 {
        into.push(u8::try_from(value & 0x7f).unwrap_or(0) | 0x80);
        value >>= 7;
    }

    into.push(u8::try_from(value).unwrap_or(0));
}

/// Appends a field's key.
fn put_key(into: &mut Vec<u8>, field: u32, wire: u32) {
    put_varint(into, u64::from((field << 3) | wire));
}

/// Appends a length-delimited field.
fn put_bytes(into: &mut Vec<u8>, field: u32, bytes: &[u8]) {
    put_key(into, field, LENGTH_DELIMITED);
    put_varint(into, u64::try_from(bytes.len()).unwrap_or(u64::MAX));
    into.extend_from_slice(bytes);
}

/// Reads a varint from the front of `bytes`, moving past it.
fn take_varint(bytes: &mut &[u8]) -> Result<u64, FrameError> {
    let mut value = 0_u64;

    for shift in (0..64).step_by(7) {
        let (&byte, rest) = bytes.split_first().ok_or(FrameError::Malformed)?;

        *bytes = rest;
        value |= u64::from(byte & 0x7f) << shift;

        if byte & 0x80 == 0 {
            return Ok(value);
        }
    }

    Err(FrameError::Malformed)
}

/// Takes `count` bytes from the front of `bytes`.
fn take<'a>(bytes: &mut &'a [u8], count: usize) -> Result<&'a [u8], FrameError> {
    if bytes.len() < count {
        return Err(FrameError::Malformed);
    }

    let (taken, rest) = bytes.split_at(count);

    *bytes = rest;
    Ok(taken)
}

/// Reads a length-delimited field's bytes.
fn take_delimited<'a>(bytes: &mut &'a [u8]) -> Result<&'a [u8], FrameError> {
    let length = usize::try_from(take_varint(bytes)?).map_err(|_| FrameError::Malformed)?;

    take(bytes, length)
}

/// Reads a length-delimited field as text.
fn take_text(bytes: &mut &[u8]) -> Result<String, FrameError> {
    String::from_utf8(take_delimited(bytes)?.to_vec()).map_err(|_| FrameError::Malformed)
}

impl CastMessage {
    /// A message with a JSON payload.
    #[must_use]
    pub fn text(source: &str, destination: &str, namespace: &str, payload: String) -> Self {
        Self {
            source: source.to_owned(),
            destination: destination.to_owned(),
            namespace: namespace.to_owned(),
            payload: Payload::Text(payload),
        }
    }

    /// The message as a protocol buffer.
    #[must_use]
    pub fn encode(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(64);

        put_key(&mut bytes, PROTOCOL_VERSION, VARINT);
        put_varint(&mut bytes, 0);
        put_bytes(&mut bytes, SOURCE_ID, self.source.as_bytes());
        put_bytes(&mut bytes, DESTINATION_ID, self.destination.as_bytes());
        put_bytes(&mut bytes, NAMESPACE, self.namespace.as_bytes());
        put_key(&mut bytes, PAYLOAD_TYPE, VARINT);

        match &self.payload {
            Payload::Text(text) => {
                put_varint(&mut bytes, STRING_PAYLOAD);
                put_bytes(&mut bytes, PAYLOAD_UTF8, text.as_bytes());
            }
            Payload::Binary(binary) => {
                put_varint(&mut bytes, BINARY_PAYLOAD);
                put_bytes(&mut bytes, PAYLOAD_BINARY, binary);
            }
        }

        bytes
    }

    /// Reads a message from its protocol buffer, passing over fields it does not know.
    ///
    /// # Errors
    ///
    /// When the bytes are not a `CastMessage`.
    pub fn decode(mut bytes: &[u8]) -> Result<Self, FrameError> {
        let mut source = None;
        let mut destination = None;
        let mut namespace = None;
        let mut text = None;
        let mut binary = None;

        while !bytes.is_empty() {
            let key = take_varint(&mut bytes)?;
            let field = u32::try_from(key >> 3).map_err(|_| FrameError::Malformed)?;
            let wire = u32::try_from(key & 0x7).map_err(|_| FrameError::Malformed)?;

            match (field, wire) {
                (SOURCE_ID, LENGTH_DELIMITED) => source = Some(take_text(&mut bytes)?),
                (DESTINATION_ID, LENGTH_DELIMITED) => destination = Some(take_text(&mut bytes)?),
                (NAMESPACE, LENGTH_DELIMITED) => namespace = Some(take_text(&mut bytes)?),
                (PAYLOAD_UTF8, LENGTH_DELIMITED) => text = Some(take_text(&mut bytes)?),
                (PAYLOAD_BINARY, LENGTH_DELIMITED) => {
                    binary = Some(take_delimited(&mut bytes)?.to_vec());
                }
                (_, VARINT) => {
                    take_varint(&mut bytes)?;
                }
                (_, LENGTH_DELIMITED) => {
                    take_delimited(&mut bytes)?;
                }
                (_, FIXED_64) => {
                    take(&mut bytes, 8)?;
                }
                (_, FIXED_32) => {
                    take(&mut bytes, 4)?;
                }
                _ => return Err(FrameError::Malformed),
            }
        }

        let payload = match (text, binary) {
            (Some(text), _) => Payload::Text(text),
            (None, Some(binary)) => Payload::Binary(binary),
            (None, None) => Payload::Text(String::new()),
        };

        Ok(Self {
            source: source.ok_or(FrameError::Malformed)?,
            destination: destination.ok_or(FrameError::Malformed)?,
            namespace: namespace.ok_or(FrameError::Malformed)?,
            payload,
        })
    }
}

/// Reads the next message from a connection.
///
/// # Errors
///
/// When the connection fails, or what arrives is not a message.
pub async fn read_message<R: AsyncRead + Unpin>(from: &mut R) -> Result<CastMessage, FrameError> {
    let length = usize::try_from(from.read_u32().await?).map_err(|_| FrameError::Malformed)?;

    if length > LARGEST {
        return Err(FrameError::TooLong(length));
    }

    let mut bytes = vec![0; length];

    from.read_exact(&mut bytes).await?;
    CastMessage::decode(&bytes)
}

/// Writes a message to a connection.
///
/// # Errors
///
/// When the connection fails, or the message is longer than a device takes.
pub async fn write_message<W: AsyncWrite + Unpin>(
    to: &mut W,
    message: &CastMessage,
) -> Result<(), FrameError> {
    let bytes = message.encode();

    if bytes.len() > LARGEST {
        return Err(FrameError::TooLong(bytes.len()));
    }

    to.write_u32(u32::try_from(bytes.len()).map_err(|_| FrameError::TooLong(bytes.len()))?)
        .await?;
    to.write_all(&bytes).await?;
    to.flush().await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn a_message() -> CastMessage {
        CastMessage::text(
            "sender-0",
            "receiver-0",
            "urn:x-cast:com.google.cast.tp.heartbeat",
            String::from(r#"{"type":"PING"}"#),
        )
    }

    #[test]
    fn writes_the_bytes_the_protocol_buffer_would() {
        let message = CastMessage::text("a", "b", "c", String::from("d"));

        assert_eq!(
            message.encode(),
            vec![
                0x08, 0x00, 0x12, 0x01, b'a', 0x1a, 0x01, b'b', 0x22, 0x01, b'c', 0x28, 0x00, 0x32,
                0x01, b'd'
            ]
        );
    }

    #[test]
    fn reads_back_what_it_wrote() {
        let message = a_message();

        assert_eq!(CastMessage::decode(&message.encode()).ok(), Some(message));
    }

    #[test]
    fn reads_back_a_binary_payload() {
        let message = CastMessage {
            payload: Payload::Binary(vec![0, 1, 2, 255]),
            ..a_message()
        };

        assert_eq!(CastMessage::decode(&message.encode()).ok(), Some(message));
    }

    #[test]
    fn writes_a_length_longer_than_one_byte_as_a_varint() {
        let message = CastMessage::text("a", "b", "c", "x".repeat(300));
        let bytes = message.encode();

        assert_eq!(&bytes[13..16], &[0x32, 0xac, 0x02]);
        assert_eq!(CastMessage::decode(&bytes).ok(), Some(message));
    }

    #[test]
    fn passes_over_fields_it_does_not_know() {
        let mut bytes = a_message().encode();

        bytes.extend_from_slice(&[
            0x40, 0x05, 0x4a, 0x02, b'h', b'i', 0x51, 1, 2, 3, 4, 5, 6, 7, 8,
        ]);

        assert_eq!(CastMessage::decode(&bytes).ok(), Some(a_message()));
    }

    #[test]
    fn refuses_a_message_cut_short() {
        let bytes = a_message().encode();

        assert!(CastMessage::decode(&bytes[..bytes.len() - 3]).is_err());
    }

    #[test]
    fn refuses_a_message_with_no_namespace() {
        assert!(CastMessage::decode(&[0x08, 0x00, 0x12, 0x01, b'a', 0x1a, 0x01, b'b']).is_err());
    }

    #[tokio::test]
    async fn frames_each_message_with_its_length() {
        let mut written = Vec::new();

        write_message(&mut written, &a_message()).await.unwrap();

        let length = u32::from_be_bytes([written[0], written[1], written[2], written[3]]);

        assert_eq!(usize::try_from(length).unwrap(), written.len() - 4);
        assert_eq!(
            read_message(&mut written.as_slice()).await.ok(),
            Some(a_message())
        );
    }

    #[tokio::test]
    async fn refuses_a_frame_longer_than_any_device_sends() {
        let mut bytes = u32::try_from(LARGEST + 1).unwrap().to_be_bytes().to_vec();

        bytes.extend_from_slice(&[0; 8]);

        assert!(matches!(
            read_message(&mut bytes.as_slice()).await,
            Err(FrameError::TooLong(_))
        ));
    }
}
