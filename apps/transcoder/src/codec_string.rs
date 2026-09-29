//! What a player is told a stream is, read from the stream itself.
//!
//! A multivariant playlist names each rendition's codec in `CODECS`, and a
//! player sets up its decoders from that before fetching a byte. ffmpeg writes
//! the string for audio and for H.264 but not for HEVC, and a copied stream's
//! profile and level are whatever the source had, so the only place to read them
//! is the initialisation segment ffmpeg wrote. See RFC 6381 and VAL-307.

use std::fmt::Write as _;

/// Boxes that hold other boxes on the way down to a track's sample entry.
const CONTAINERS: [[u8; 4]; 6] = [*b"moov", *b"trak", *b"mdia", *b"minf", *b"stbl", *b"stsd"];

/// Where a visual sample entry's own boxes begin, past its fixed fields.
const VISUAL_ENTRY_FIELDS: usize = 70;

/// Where an audio sample entry's own boxes begin, past its fixed fields.
const AUDIO_ENTRY_FIELDS: usize = 20;

/// The codec string for the first track of an initialisation segment.
///
/// `None` where the segment cannot be read or its codec has no string Valence
/// knows how to write, which a caller should treat as a reason not to name one
/// rather than a reason to guess.
#[must_use]
pub fn codec_string(init: &[u8]) -> Option<String> {
    let (kind, entry) = sample_entry(init)?;
    let visual = || entry.get(VISUAL_ENTRY_FIELDS..);

    match &kind {
        b"hvc1" | b"hev1" => hevc(kind, child(visual()?, *b"hvcC")?),
        b"avc1" | b"avc3" => avc(kind, child(visual()?, *b"avcC")?),
        b"av01" => av1(child(visual()?, *b"av1C")?),
        b"dvh1" | b"dvhe" => dolby_vision(kind, visual()?),
        b"ec-3" => Some("ec-3".to_owned()),
        b"ac-3" => Some("ac-3".to_owned()),
        b"Opus" => Some("opus".to_owned()),
        b"fLaC" => Some("flac".to_owned()),
        b"alac" => Some("alac".to_owned()),
        b"mp4a" => mpeg4_audio(child(entry.get(AUDIO_ENTRY_FIELDS..)?, *b"esds")?),
        _ => None,
    }
}

/// The type and body of the first sample entry, found by walking down to `stsd`.
fn sample_entry(bytes: &[u8]) -> Option<([u8; 4], &[u8])> {
    let mut level = bytes;

    for container in CONTAINERS {
        let body = child(level, container)?;

        level = if container == *b"stsd" {
            body.get(8..)?
        } else {
            body
        };
    }

    let (kind, body, _) = next_box(level)?;

    Some((kind, body.get(8..)?))
}

/// The body of the first box of this type among a run of boxes.
fn child(mut boxes: &[u8], wanted: [u8; 4]) -> Option<&[u8]> {
    while let Some((kind, body, rest)) = next_box(boxes) {
        if kind == wanted {
            return Some(body);
        }

        boxes = rest;
    }

    None
}

/// The first box in a run: its type, its body and what follows it.
fn next_box(bytes: &[u8]) -> Option<([u8; 4], &[u8], &[u8])> {
    let size = usize::try_from(u32::from_be_bytes(bytes.get(..4)?.try_into().ok()?)).ok()?;
    let kind: [u8; 4] = bytes.get(4..8)?.try_into().ok()?;

    let (header, size) = match size {
        1 => {
            let large = u64::from_be_bytes(bytes.get(8..16)?.try_into().ok()?);

            (16, usize::try_from(large).ok()?)
        }
        0 => (8, bytes.len()),
        size => (8, size),
    };

    if size < header || size > bytes.len() {
        return None;
    }

    Some((kind, &bytes[header..size], &bytes[size..]))
}

/// `hvc1.2.4.L120.90`, from an HEVC decoder configuration record.
fn hevc(kind: [u8; 4], record: &[u8]) -> Option<String> {
    let profile = *record.get(1)?;
    let compatibility = u32::from_be_bytes(record.get(2..6)?.try_into().ok()?);
    let constraints = record.get(6..12)?;
    let level = *record.get(12)?;

    let space = match profile >> 6 {
        1 => "A",
        2 => "B",
        3 => "C",
        _ => "",
    };
    let tier = if profile & 0x20 == 0 { 'L' } else { 'H' };

    let mut string = format!(
        "{}.{space}{}.{:X}.{tier}{level}",
        fourcc(kind),
        profile & 0x1F,
        compatibility.reverse_bits()
    );

    let kept = constraints
        .iter()
        .rposition(|byte| *byte != 0)
        .map_or(0, |last| last + 1);

    for byte in &constraints[..kept] {
        let _ = write!(string, ".{byte:X}");
    }

    Some(string)
}

/// `avc1.640028`, from an H.264 decoder configuration record.
fn avc(kind: [u8; 4], record: &[u8]) -> Option<String> {
    let [profile, compatibility, level] = record.get(1..4)?.try_into().ok()?;

    Some(format!(
        "{}.{profile:02X}{compatibility:02X}{level:02X}",
        fourcc(kind)
    ))
}

/// `av01.0.08M.10`, from an AV1 codec configuration record.
fn av1(record: &[u8]) -> Option<String> {
    let first = *record.get(1)?;
    let second = *record.get(2)?;

    let profile = first >> 5;
    let level = first & 0x1F;
    let tier = if second & 0x80 == 0 { 'M' } else { 'H' };
    let depth = match (second & 0x40 != 0, second & 0x20 != 0) {
        (true, true) => 12,
        (true, false) => 10,
        _ => 8,
    };

    Some(format!("av01.{profile}.{level:02}{tier}.{depth:02}"))
}

/// `dvh1.08.06`, from a Dolby Vision configuration record.
fn dolby_vision(kind: [u8; 4], boxes: &[u8]) -> Option<String> {
    let record = child(boxes, *b"dvcC").or_else(|| child(boxes, *b"dvvC"))?;
    let packed = u16::from_be_bytes(record.get(2..4)?.try_into().ok()?);

    Some(format!(
        "{}.{:02}.{:02}",
        fourcc(kind),
        packed >> 9,
        (packed >> 3) & 0x3F
    ))
}

/// `mp4a.40.2`, from an elementary stream descriptor.
fn mpeg4_audio(descriptor: &[u8]) -> Option<String> {
    let decoder = find_descriptor(descriptor.get(4..)?, 0x03).and_then(|es| {
        let flags = *es.get(2)?;
        let mut at = 3;

        if flags & 0x80 != 0 {
            at += 2;
        }

        if flags & 0x40 != 0 {
            at += 1 + usize::from(*es.get(at)?);
        }

        if flags & 0x20 != 0 {
            at += 2;
        }

        find_descriptor(es.get(at..)?, 0x04)
    })?;

    let object = *decoder.first()?;

    if object != 0x40 {
        return Some(format!("mp4a.{object:X}"));
    }

    let specific = find_descriptor(decoder.get(13..)?, 0x05)?;
    let audio_object = specific.first()? >> 3;

    Some(format!("mp4a.40.{audio_object}"))
}

/// The body of the first descriptor with this tag, where one starts the bytes.
fn find_descriptor(bytes: &[u8], tag: u8) -> Option<&[u8]> {
    if *bytes.first()? != tag {
        return None;
    }

    let mut length = 0_usize;
    let mut at = 1;

    loop {
        let byte = *bytes.get(at)?;

        length = (length << 7) | usize::from(byte & 0x7F);
        at += 1;

        if byte & 0x80 == 0 || at > 4 {
            break;
        }
    }

    bytes.get(at..at.checked_add(length)?)
}

/// A four character code as text.
fn fourcc(kind: [u8; 4]) -> String {
    String::from_utf8_lossy(&kind).into_owned()
}

#[cfg(test)]
mod tests {
    use super::codec_string;

    fn boxed(kind: [u8; 4], body: &[u8]) -> Vec<u8> {
        let size = u32::try_from(body.len() + 8).expect("small");
        let mut out = size.to_be_bytes().to_vec();

        out.extend_from_slice(&kind);
        out.extend_from_slice(body);

        out
    }

    /// An initialisation segment whose only track has this sample entry.
    fn init_with(entry: &[u8]) -> Vec<u8> {
        let mut stsd = vec![0, 0, 0, 0, 0, 0, 0, 1];
        stsd.extend_from_slice(entry);

        let stbl = boxed(*b"stbl", &boxed(*b"stsd", &stsd));
        let minf = boxed(*b"minf", &stbl);
        let mdia = boxed(*b"mdia", &minf);
        let trak = boxed(*b"trak", &mdia);
        let mut init = boxed(*b"ftyp", b"iso6mp41");

        init.extend(boxed(*b"moov", &trak));

        init
    }

    fn visual(kind: [u8; 4], children: &[u8]) -> Vec<u8> {
        let mut body = vec![0_u8; 8 + 70];
        body.extend_from_slice(children);

        boxed(kind, &body)
    }

    fn audio(kind: [u8; 4], children: &[u8]) -> Vec<u8> {
        let mut body = vec![0_u8; 8 + 20];
        body.extend_from_slice(children);

        boxed(kind, &body)
    }

    /// The copied Bluray this was written for: HEVC Main 10, level 4.
    #[test]
    fn reads_a_copied_hevc_main_10_stream() {
        let record = [1, 0x02, 0x20, 0, 0, 0, 0x90, 0, 0, 0, 0, 0, 120];
        let init = init_with(&visual(*b"hvc1", &boxed(*b"hvcC", &record)));

        assert_eq!(codec_string(&init).as_deref(), Some("hvc1.2.4.L120.90"));
    }

    /// Main profile at the high tier, with every constraint byte kept.
    #[test]
    fn reads_the_tier_and_every_constraint_that_is_set() {
        let record = [1, 0x21, 0x60, 0, 0, 0, 0xB0, 0, 0, 0, 0, 0x01, 153];
        let init = init_with(&visual(*b"hev1", &boxed(*b"hvcC", &record)));

        assert_eq!(
            codec_string(&init).as_deref(),
            Some("hev1.1.6.H153.B0.0.0.0.0.1")
        );
    }

    #[test]
    fn reads_an_h264_stream() {
        let record = [1, 0x64, 0x00, 0x28];
        let init = init_with(&visual(*b"avc1", &boxed(*b"avcC", &record)));

        assert_eq!(codec_string(&init).as_deref(), Some("avc1.640028"));
    }

    #[test]
    fn reads_a_ten_bit_av1_stream() {
        let record = [0x81, 0x08, 0x40, 0];
        let init = init_with(&visual(*b"av01", &boxed(*b"av1C", &record)));

        assert_eq!(codec_string(&init).as_deref(), Some("av01.0.08M.10"));
    }

    #[test]
    fn reads_a_dolby_vision_profile_and_level() {
        let packed: u16 = (8 << 9) | (6 << 3);
        let mut record = vec![1, 0];
        record.extend_from_slice(&packed.to_be_bytes());
        let init = init_with(&visual(*b"dvh1", &boxed(*b"dvcC", &record)));

        assert_eq!(codec_string(&init).as_deref(), Some("dvh1.08.06"));
    }

    /// Dolby Digital Plus and friends need no parameters.
    #[test]
    fn names_the_dolby_and_open_audio_codecs() {
        assert_eq!(
            codec_string(&init_with(&audio(*b"ec-3", &[]))).as_deref(),
            Some("ec-3")
        );
        assert_eq!(
            codec_string(&init_with(&audio(*b"ac-3", &[]))).as_deref(),
            Some("ac-3")
        );
        assert_eq!(
            codec_string(&init_with(&audio(*b"Opus", &[]))).as_deref(),
            Some("opus")
        );
        assert_eq!(
            codec_string(&init_with(&audio(*b"fLaC", &[]))).as_deref(),
            Some("flac")
        );
    }

    /// AAC names its object type, which is what separates LC from HE-AAC.
    #[test]
    fn reads_the_aac_object_type() {
        let specific = [0x05, 2, 0x11, 0x90];
        let mut decoder = vec![0x04, u8::try_from(13 + specific.len()).expect("small")];
        decoder.extend_from_slice(&[0x40, 0x15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        decoder.extend_from_slice(&specific);
        let mut es = vec![
            0x03,
            u8::try_from(3 + decoder.len()).expect("small"),
            0,
            1,
            0,
        ];
        es.extend_from_slice(&decoder);
        let mut esds = vec![0, 0, 0, 0];
        esds.extend_from_slice(&es);

        let init = init_with(&audio(*b"mp4a", &boxed(*b"esds", &esds)));

        assert_eq!(codec_string(&init).as_deref(), Some("mp4a.40.2"));
    }

    /// Nothing is better than a guess.
    #[test]
    fn names_nothing_it_cannot_read() {
        assert_eq!(codec_string(&[]), None);
        assert_eq!(codec_string(b"not an mp4 at all"), None);
        assert_eq!(codec_string(&init_with(&visual(*b"hvc1", &[]))), None);
        assert_eq!(codec_string(&init_with(&audio(*b"mhm1", &[]))), None);
    }

    /// A picture's sample entry cut short is unreadable, not a crash.
    #[test]
    fn names_nothing_for_a_sample_entry_cut_short() {
        let truncated = boxed(*b"hvc1", &[0_u8; 20]);

        assert_eq!(codec_string(&init_with(&truncated)), None);
    }
}
