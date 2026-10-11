import { describe, expect, it } from 'vitest';
import { readAv1Colour } from '@ValenceScreens/playback/engine/av1/readAv1Colour';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';
import { TONE_MAPPING_PROBES } from '@ValenceScreens/playback/engine/TONE_MAPPING_PROBES';

describe('readAv1Colour', () => {
  it('reads BT.2020 primaries, the PQ transfer and the BT.2020 matrix from an HDR sequence header', () => {
    const frame = bytesOf(TONE_MAPPING_PROBES[1].frame);
    const size = frame[1] ?? 0;

    expect(readAv1Colour(frame.subarray(2, 2 + size))).toEqual({
      primaries: 9,
      transfer: 16,
      matrix: 9,
      isFullRange: false,
      colourBitAt: 71,
    });
  });

  it('refuses a header that ends before it says anything', () => {
    expect(() => readAv1Colour(Uint8Array.from([0]))).toThrow(RangeError);
  });
});
