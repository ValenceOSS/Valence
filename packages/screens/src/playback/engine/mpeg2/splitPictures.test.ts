import { describe, expect, it } from 'vitest';
import { splitPictures } from '@ValenceScreens/playback/engine/mpeg2/splitPictures';

const STREAM = Uint8Array.from([
  0, 0, 1, 0xb3, 0x2d, 0, 0, 1, 0xb5, 0x14, 0, 0, 1, 0xb8, 0x00, 0, 0, 1, 0x00, 0x00, 0x08, 0, 0, 1,
  0x01, 0xaa, 0, 0, 1, 0x00, 0x00, 0x18, 0, 0, 1, 0x01, 0xbb,
]);

describe('splitPictures', () => {
  it('cuts a stream into its headers and pictures, each keeping the slices that follow it', () => {
    const units = splitPictures(STREAM);

    expect(units.map((unit) => [unit.start, unit.end])).toEqual([
      [0, 10],
      [10, 15],
      [15, 26],
      [26, STREAM.length],
    ]);
  });

  it('marks the sequence header, the pictures and which of them is a B-picture', () => {
    const units = splitPictures(STREAM);

    expect(
      units.map((unit) => [unit.isSequenceHeader, unit.isPicture, unit.isBidirectional]),
    ).toEqual([
      [true, false, false],
      [false, false, false],
      [false, true, false],
      [false, true, true],
    ]);
  });
});
