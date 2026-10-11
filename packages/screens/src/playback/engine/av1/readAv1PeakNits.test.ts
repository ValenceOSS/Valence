import { describe, expect, it } from 'vitest';
import { readAv1PeakNits } from '@ValenceScreens/playback/engine/av1/readAv1PeakNits';

describe('readAv1PeakNits', () => {
  it('takes the brightest pixel a content light level OBU states', () => {
    expect(readAv1PeakNits(Uint8Array.from([0x2a, 5, 1, 0x03, 0xe8, 0x01, 0x90]))).toBe(1000);
  });

  it('takes the mastering display’s peak, in 24.8 fixed point, where there is no light level', () => {
    const mastering = Uint8Array.from([
      0x2a,
      21,
      2,
      ...Array.from({ length: 16 }, () => 0x11),
      0x00,
      0x0f,
      0xa0,
      0x00,
    ]);

    expect(readAv1PeakNits(mastering)).toBe(4000);
  });

  it('says nothing where the stream does not say', () => {
    expect(readAv1PeakNits(Uint8Array.from([0x12, 0x00]))).toBeNull();
  });
});
