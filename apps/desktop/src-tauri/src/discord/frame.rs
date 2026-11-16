//! Messages as Discord's socket reads and writes them.
//!
//! Two little-endian thirty-two bit numbers and then the JSON: what kind of message it is, and how
//! many bytes of it there are. There is no delimiter and no terminator, so the length is the only
//! thing separating one message from the next.

/// The length of a message's header.
const HEADER: usize = 8;

/// The first message, which says who is talking.
pub const HANDSHAKE: i32 = 0;

/// Every message after it.
pub const FRAME: i32 = 1;

/// The longest message Discord ever sends.
const MOST_PAYLOAD_BYTES: i32 = 64 * 1024;

/// One whole message.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DiscordFrame {
    /// What kind of message it is.
    pub opcode: i32,
    /// Its JSON.
    pub payload: String,
}

/// What could be read out of what has arrived so far.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Read {
    /// The whole messages.
    pub frames: Vec<DiscordFrame>,
    /// What is left, to read again once more arrives.
    pub rest: Vec<u8>,
    /// Whether the bytes are no protocol at all.
    pub is_broken: bool,
}

/// Wraps a message the way Discord's socket expects to read one, counting its length in bytes
/// rather than characters.
#[must_use]
pub fn a_discord_frame(opcode: i32, payload: &str) -> Vec<u8> {
    let body = payload.as_bytes();
    let length = i32::try_from(body.len()).unwrap_or(i32::MAX);
    let mut framed = Vec::with_capacity(HEADER + body.len());

    framed.extend_from_slice(&opcode.to_le_bytes());
    framed.extend_from_slice(&length.to_le_bytes());
    framed.extend_from_slice(body);

    framed
}

/// A little-endian thirty-two bit number at a place in some bytes.
fn number_at(bytes: &[u8], at: usize) -> Option<i32> {
    bytes
        .get(at..at + 4)
        .and_then(|four| four.try_into().ok())
        .map(i32::from_le_bytes)
}

/// Reads whole messages out of whatever has arrived so far.
///
/// A socket hands over bytes rather than messages, so a read can carry half of one, or three and a
/// bit. Anything short of a whole message is handed back to be read again once more arrives. A
/// message that says it is shorter than nothing or longer than Discord ever sends is not one: the
/// reading stops there and says the peer is not speaking the protocol.
#[must_use]
pub fn read_discord_frames(arrived: &[u8]) -> Read {
    let mut frames = Vec::new();
    let mut at = 0;

    while arrived.len() - at >= HEADER {
        let (Some(opcode), Some(length)) = (number_at(arrived, at), number_at(arrived, at + 4))
        else {
            break;
        };

        if !(0..=MOST_PAYLOAD_BYTES).contains(&length) {
            return Read {
                frames,
                rest: Vec::new(),
                is_broken: true,
            };
        }

        let length = usize::try_from(length).unwrap_or_default();

        if arrived.len() - at - HEADER < length {
            break;
        }

        frames.push(DiscordFrame {
            opcode,
            payload: String::from_utf8_lossy(&arrived[at + HEADER..at + HEADER + length])
                .into_owned(),
        });

        at += HEADER + length;
    }

    Read {
        frames,
        rest: arrived[at..].to_vec(),
        is_broken: false,
    }
}

#[cfg(test)]
mod tests {
    use super::{a_discord_frame, number_at, read_discord_frames, DiscordFrame, FRAME, HANDSHAKE};

    fn header(opcode: i32, length: i32) -> Vec<u8> {
        let mut said = opcode.to_le_bytes().to_vec();

        said.extend_from_slice(&length.to_le_bytes());

        said
    }

    #[test]
    fn says_what_kind_of_message_it_is_and_how_long_it_is() {
        let framed = a_discord_frame(HANDSHAKE, r#"{"v":1}"#);

        assert_eq!(number_at(&framed, 0), Some(HANDSHAKE));
        assert_eq!(number_at(&framed, 4), Some(7));
        assert_eq!(&framed[8..], br#"{"v":1}"#);
    }

    #[test]
    fn counts_bytes_rather_than_characters() {
        let framed = a_discord_frame(FRAME, r#"{"t":"café"}"#);

        assert_eq!(
            number_at(&framed, 4),
            Some(i32::try_from(r#"{"t":"café"}"#.len()).unwrap_or_default())
        );
    }

    #[test]
    fn reads_a_whole_message_back_out() {
        let read = read_discord_frames(&a_discord_frame(FRAME, r#"{"cmd":"DISPATCH"}"#));

        assert_eq!(
            read.frames,
            vec![DiscordFrame {
                opcode: FRAME,
                payload: r#"{"cmd":"DISPATCH"}"#.to_owned()
            }]
        );
        assert!(read.rest.is_empty());
    }

    #[test]
    fn reads_several_that_arrived_together() {
        let mut both = a_discord_frame(FRAME, r#"{"a":1}"#);

        both.extend(a_discord_frame(FRAME, r#"{"b":2}"#));

        assert_eq!(
            read_discord_frames(&both)
                .frames
                .into_iter()
                .map(|frame| frame.payload)
                .collect::<Vec<_>>(),
            vec![r#"{"a":1}"#.to_owned(), r#"{"b":2}"#.to_owned()]
        );
    }

    #[test]
    fn keeps_half_a_message_to_read_again() {
        let whole = a_discord_frame(FRAME, r#"{"cmd":"DISPATCH"}"#);
        let read = read_discord_frames(&whole[..12]);

        assert!(read.frames.is_empty());
        assert_eq!(read.rest.len(), 12);
    }

    #[test]
    fn keeps_a_header_that_has_not_finished_arriving() {
        let read = read_discord_frames(&[1, 0, 0]);

        assert!(read.frames.is_empty());
        assert_eq!(read.rest.len(), 3);
    }

    #[test]
    fn reads_what_it_can_and_keeps_the_rest() {
        let mut arrived = a_discord_frame(FRAME, r#"{"a":1}"#);

        arrived.extend(&a_discord_frame(FRAME, r#"{"b":2}"#)[..5]);

        let read = read_discord_frames(&arrived);

        assert_eq!(read.frames.len(), 1);
        assert_eq!(read.rest.len(), 5);
    }

    #[test]
    fn reads_nothing_out_of_nothing() {
        assert!(read_discord_frames(&[]).frames.is_empty());
    }

    #[test]
    fn stops_at_a_length_that_is_negative() {
        let mut said = header(FRAME, -8);

        said.extend([0; 8]);

        let read = read_discord_frames(&said);

        assert!(read.frames.is_empty());
        assert!(read.is_broken);
    }

    #[test]
    fn stops_at_a_length_no_message_of_discords_is_as_long_as() {
        assert!(read_discord_frames(&header(FRAME, 0x7fff_ffff)).is_broken);
        assert!(!read_discord_frames(&a_discord_frame(FRAME, "{}")).is_broken);
    }
}
