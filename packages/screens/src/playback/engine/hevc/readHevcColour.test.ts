import { describe, expect, it } from 'vitest';
import { readHevcColour } from '@ValenceScreens/playback/engine/hevc/readHevcColour';
import { unescapeNal } from '@ValenceScreens/playback/engine/hevc/unescapeNal';
import { bytesOf } from '@ValenceScreens/playback/engine/hevc/bytesOf';
import { PQ_SPS } from '@ValenceScreens/playback/engine/hevc/PQ_SPS';

describe('readHevcColour', () => {
  it('reads BT.2020 primaries, the PQ transfer and the BT.2020 matrix from an HDR10 sequence', () => {
    expect(readHevcColour(unescapeNal(bytesOf(PQ_SPS)))).toEqual({
      primaries: 9,
      transfer: 16,
      matrix: 9,
      isFullRange: false,
      colourBitAt: 233,
    });
  });

  it('refuses a sequence that ends before it says anything', () => {
    expect(() => readHevcColour(bytesOf('4201'))).toThrow(RangeError);
  });
});
