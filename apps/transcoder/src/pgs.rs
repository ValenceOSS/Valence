//! Reading Blu-ray subtitles, which are pictures rather than words.
//!
//! A PGS track is a run of display sets, each a few segments long: a
//! composition saying what is on screen from a moment on, the window it sits
//! in, the palette, the run-length coded objects, and an end marker. A
//! composition naming no objects takes whatever was showing off the screen.
//!
//! Each caption comes out as a greyscale picture of dark letters on white,
//! which is what a reader of printed text reads best: the subtitle's own light
//! lettering becomes the ink and its dark outline becomes paper.

use std::collections::HashMap;

const PRESENTATION: u8 = 0x16;
const PALETTE: u8 = 0x14;
const OBJECT: u8 = 0x15;
const END: u8 = 0x80;

const FIRST_IN_SEQUENCE: u8 = 0x80;

/// How far round each caption the paper reaches, in pixels, since a reader
/// misses letters that touch the edge of the page.
const MARGIN: usize = 12;

/// How bright and how opaque a pixel must be to count as lettering.
const INK_LUMA: u8 = 150;
const INK_ALPHA: u8 = 128;

/// One caption, as a picture, and when it is on screen.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Caption {
    /// When it comes on, in milliseconds.
    pub start_ms: u64,
    /// When it goes off, in milliseconds.
    pub end_ms: u64,
    /// Its width in pixels.
    pub width: usize,
    /// Its height in pixels.
    pub height: usize,
    /// Its pixels, one byte each, dark ink on white paper.
    pub pixels: Vec<u8>,
}

impl Caption {
    /// The picture as a binary PGM, which any reader of printed text takes.
    #[must_use]
    pub fn as_pgm(&self) -> Vec<u8> {
        let mut out = format!("P5\n{} {}\n255\n", self.width, self.height).into_bytes();

        out.extend_from_slice(&self.pixels);

        out
    }
}

#[derive(Debug, Clone, Copy)]
struct Placement {
    object: u16,
    x: usize,
    y: usize,
}

#[derive(Debug, Clone, Default)]
struct Object {
    width: usize,
    height: usize,
    data: Vec<u8>,
}

#[derive(Debug, Clone, Copy, Default)]
struct Colour {
    luma: u8,
    alpha: u8,
}

/// Reads a big-endian number `length` bytes long, `at` bytes into `bytes`.
fn read_be(bytes: &[u8], at: usize, length: usize) -> Option<u64> {
    let slice = bytes.get(at..at + length)?;

    Some(
        slice
            .iter()
            .fold(0_u64, |sum, byte| (sum << 8) | u64::from(*byte)),
    )
}

/// Expands one object's run-length coded pixels into one palette index each.
fn decode_runs(data: &[u8], width: usize, height: usize) -> Vec<u8> {
    let mut pixels = vec![0_u8; width * height];
    let mut at = 0;
    let mut x = 0;
    let mut y = 0;

    let mut put = |colour: u8, count: usize, x: &mut usize, y: usize| {
        for _ in 0..count {
            if *x < width && y < height {
                pixels[y * width + *x] = colour;
            }

            *x += 1;
        }
    };

    while at < data.len() && y < height {
        let first = data[at];

        at += 1;

        if first != 0 {
            put(first, 1, &mut x, y);
            continue;
        }

        let Some(&second) = data.get(at) else { break };

        at += 1;

        if second == 0 {
            x = 0;
            y += 1;
            continue;
        }

        let short = usize::from(second & 0x3F);

        match second & 0xC0 {
            0x00 => put(0, short, &mut x, y),
            0x40 => {
                let Some(&low) = data.get(at) else { break };

                at += 1;
                put(0, (short << 8) | usize::from(low), &mut x, y);
            }
            0x80 => {
                let Some(&colour) = data.get(at) else { break };

                at += 1;
                put(colour, short, &mut x, y);
            }
            _ => {
                let (Some(&low), Some(&colour)) = (data.get(at), data.get(at + 1)) else {
                    break;
                };

                at += 2;
                put(colour, (short << 8) | usize::from(low), &mut x, y);
            }
        }
    }

    pixels
}

/// Draws what a composition shows as dark ink on white paper, cropped to the
/// lettering with a margin round it.
fn draw(
    placements: &[Placement],
    objects: &HashMap<u16, Object>,
    palette: &HashMap<u8, Colour>,
) -> Option<(usize, usize, Vec<u8>)> {
    let mut left = usize::MAX;
    let mut top = usize::MAX;
    let mut right = 0;
    let mut bottom = 0;

    for placement in placements {
        let object = objects.get(&placement.object)?;

        left = left.min(placement.x);
        top = top.min(placement.y);
        right = right.max(placement.x + object.width);
        bottom = bottom.max(placement.y + object.height);
    }

    if right <= left || bottom <= top {
        return None;
    }

    let width = right - left + MARGIN * 2;
    let height = bottom - top + MARGIN * 2;
    let mut pixels = vec![255_u8; width * height];
    let mut inked = false;

    for placement in placements {
        let Some(object) = objects.get(&placement.object) else {
            continue;
        };
        let indices = decode_runs(&object.data, object.width, object.height);

        for row in 0..object.height {
            for column in 0..object.width {
                let colour = palette
                    .get(&indices[row * object.width + column])
                    .copied()
                    .unwrap_or_default();

                if colour.luma >= INK_LUMA && colour.alpha >= INK_ALPHA {
                    let x = placement.x - left + MARGIN + column;
                    let y = placement.y - top + MARGIN + row;

                    pixels[y * width + x] = 0;
                    inked = true;
                }
            }
        }
    }

    inked.then_some((width, height, pixels))
}

/// Every caption in a PGS stream, as pictures with their times.
///
/// A caption runs from the composition that shows it to the next composition,
/// whatever that does; one whose next composition never comes runs for five
/// seconds.
#[must_use]
pub fn captions(stream: &[u8]) -> Vec<Caption> {
    let mut captions = Vec::new();
    let mut palette: HashMap<u8, Colour> = HashMap::new();
    let mut objects: HashMap<u16, Object> = HashMap::new();
    let mut placements: Vec<Placement> = Vec::new();
    let mut shown: Option<(u64, usize, usize, Vec<u8>)> = None;
    let mut composed_at = 0_u64;
    let mut at = 0;

    while at + 13 <= stream.len() {
        if &stream[at..at + 2] != b"PG" {
            at += 1;
            continue;
        }

        let pts = read_be(stream, at + 2, 4).unwrap_or(0) / 90;
        let kind = stream[at + 10];
        let length = usize::try_from(read_be(stream, at + 11, 2).unwrap_or(0)).unwrap_or(0);
        let body = stream.get(at + 13..at + 13 + length).unwrap_or(&[]);

        at += 13 + length;

        match kind {
            PRESENTATION => {
                if let Some((start, width, height, pixels)) = shown.take() {
                    captions.push(Caption {
                        start_ms: start,
                        end_ms: pts,
                        width,
                        height,
                        pixels,
                    });
                }

                composed_at = pts;
                placements.clear();

                let count = usize::from(*body.get(10).unwrap_or(&0));
                let mut cursor = 11;

                for _ in 0..count {
                    let (Some(object), Some(cropped), Some(x), Some(y)) = (
                        read_be(body, cursor, 2),
                        body.get(cursor + 3),
                        read_be(body, cursor + 4, 2),
                        read_be(body, cursor + 6, 2),
                    ) else {
                        break;
                    };

                    placements.push(Placement {
                        object: u16::try_from(object).unwrap_or(0),
                        x: usize::try_from(x).unwrap_or(0),
                        y: usize::try_from(y).unwrap_or(0),
                    });
                    cursor += if cropped & 0x80 == 0 { 8 } else { 16 };
                }
            }
            PALETTE => {
                for entry in body.get(2..).unwrap_or(&[]).chunks_exact(5) {
                    palette.insert(
                        entry[0],
                        Colour {
                            luma: entry[1],
                            alpha: entry[4],
                        },
                    );
                }
            }
            OBJECT => {
                let Some(id) = read_be(body, 0, 2) else {
                    continue;
                };
                let id = u16::try_from(id).unwrap_or(0);
                let flags = *body.get(3).unwrap_or(&0);

                if flags & FIRST_IN_SEQUENCE != 0 {
                    let width = usize::try_from(read_be(body, 7, 2).unwrap_or(0)).unwrap_or(0);
                    let height = usize::try_from(read_be(body, 9, 2).unwrap_or(0)).unwrap_or(0);

                    objects.insert(
                        id,
                        Object {
                            width,
                            height,
                            data: body.get(11..).unwrap_or(&[]).to_vec(),
                        },
                    );
                } else if let Some(object) = objects.get_mut(&id) {
                    object.data.extend_from_slice(body.get(4..).unwrap_or(&[]));
                }
            }
            END if !placements.is_empty() => {
                if let Some((width, height, pixels)) = draw(&placements, &objects, &palette) {
                    shown = Some((composed_at, width, height, pixels));
                }
            }
            _ => {}
        }
    }

    if let Some((start, width, height, pixels)) = shown {
        captions.push(Caption {
            start_ms: start,
            end_ms: start + 5_000,
            width,
            height,
            pixels,
        });
    }

    captions
}

#[cfg(test)]
mod tests {
    use super::{captions, decode_runs};

    /// One segment of a PGS stream.
    fn segment(pts_ms: u32, kind: u8, body: &[u8]) -> Vec<u8> {
        let mut out = b"PG".to_vec();

        out.extend_from_slice(&(pts_ms * 90).to_be_bytes());
        out.extend_from_slice(&0_u32.to_be_bytes());
        out.push(kind);
        out.extend_from_slice(&u16::try_from(body.len()).expect("small").to_be_bytes());
        out.extend_from_slice(body);

        out
    }

    /// A composition placing object 1 at (100, 900), or placing nothing.
    fn composition(shows: bool) -> Vec<u8> {
        let mut body = vec![0x07, 0x80, 0x04, 0x38, 0x10, 0x00, 0x01, 0x80, 0x00, 0x00];

        if shows {
            body.extend_from_slice(&[1, 0x00, 0x01, 0x00, 0x00, 0x00, 0x64, 0x03, 0x84]);
        } else {
            body.push(0);
        }

        body
    }

    /// A palette with white lettering at index 1, transparent elsewhere.
    fn palette() -> Vec<u8> {
        vec![0, 0, 1, 235, 128, 128, 255]
    }

    /// A four by two object: a row of lettering over a row of nothing.
    fn object() -> Vec<u8> {
        let runs = [0x00, 0x84, 0x01, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00];
        let mut body = vec![
            0x00, 0x01, 0x00, 0xC0, 0x00, 0x00, 0x0D, 0x00, 0x04, 0x00, 0x02,
        ];

        body.extend_from_slice(&runs);

        body
    }

    #[test]
    fn expands_a_run_of_one_colour() {
        assert_eq!(
            decode_runs(&[0x00, 0x83, 0x05, 0x00, 0x00], 3, 1),
            vec![5, 5, 5]
        );
    }

    #[test]
    fn expands_a_long_run_of_nothing() {
        assert_eq!(
            decode_runs(&[0x00, 0x40, 0x03, 0x00, 0x00], 3, 1),
            vec![0, 0, 0]
        );
    }

    #[test]
    fn takes_single_pixels_as_they_come() {
        assert_eq!(decode_runs(&[0x02, 0x03, 0x00, 0x00], 2, 1), vec![2, 3]);
    }

    #[test]
    fn times_a_caption_from_when_it_shows_to_when_it_is_cleared() {
        let mut stream = Vec::new();

        stream.extend(segment(1_000, 0x16, &composition(true)));
        stream.extend(segment(1_000, 0x14, &palette()));
        stream.extend(segment(1_000, 0x15, &object()));
        stream.extend(segment(1_000, 0x80, &[]));
        stream.extend(segment(3_500, 0x16, &composition(false)));
        stream.extend(segment(3_500, 0x80, &[]));

        let found = captions(&stream);

        assert_eq!(found.len(), 1);
        assert_eq!(found[0].start_ms, 1_000);
        assert_eq!(found[0].end_ms, 3_500);
    }

    #[test]
    fn draws_the_lettering_dark_on_white_with_room_round_it() {
        let mut stream = Vec::new();

        stream.extend(segment(0, 0x16, &composition(true)));
        stream.extend(segment(0, 0x14, &palette()));
        stream.extend(segment(0, 0x15, &object()));
        stream.extend(segment(0, 0x80, &[]));

        let found = captions(&stream);
        let caption = &found[0];

        assert_eq!((caption.width, caption.height), (4 + 24, 2 + 24));
        assert_eq!(caption.pixels[12 * caption.width + 12], 0);
        assert_eq!(caption.pixels[13 * caption.width + 12], 255);
        assert!(caption.as_pgm().starts_with(b"P5\n28 26\n255\n"));
    }

    #[test]
    fn keeps_nothing_from_a_stream_that_is_not_pgs() {
        assert_eq!(captions(b"not a subtitle stream at all"), Vec::new());
    }
}
