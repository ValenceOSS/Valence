import { describe, expect, it } from 'vitest';
import { decoderColourOf } from '@ValenceScreens/playback/engine/decoderColourOf';

describe('decoderColourOf', () => {
  it('tells the decoder sRGB so the browser leaves the HDR signal alone, with the real matrix', () => {
    expect(decoderColourOf(true, false)).toEqual({
      primaries: 'bt709',
      transfer: 'iec61966-2-1',
      matrix: 'bt2020-ncl',
      fullRange: false,
    });
  });

  it('keeps the BT.709 matrix and full range where the stream uses them', () => {
    expect(decoderColourOf(false, true)).toMatchObject({ matrix: 'bt709', fullRange: true });
  });
});
