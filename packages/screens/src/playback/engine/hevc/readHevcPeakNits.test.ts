import { describe, expect, it } from 'vitest';
import { readHevcPeakNits } from '@ValenceScreens/playback/engine/hevc/readHevcPeakNits';

const CONTENT_LIGHT_LEVEL = Uint8Array.from([0x4e, 0x01, 0x90, 4, 0x06, 0x40, 0x01, 0x90, 0x80]);

const MASTERING_DISPLAY = Uint8Array.from([
  0x4e,
  0x01,
  0x89,
  24,
  ...Array.from({ length: 16 }, () => 0x11),
  0x00,
  0x98,
  0x96,
  0x80,
  0x00,
  0x00,
  0x00,
  0x32,
  0x80,
]);

describe('readHevcPeakNits', () => {
  it('takes the brightest pixel the content light level states', () => {
    expect(readHevcPeakNits([CONTENT_LIGHT_LEVEL])).toBe(1600);
  });

  it('takes the mastering display’s peak where there is no content light level', () => {
    expect(readHevcPeakNits([MASTERING_DISPLAY])).toBe(1000);
  });

  it('prefers the content light level to the mastering display', () => {
    expect(readHevcPeakNits([MASTERING_DISPLAY, CONTENT_LIGHT_LEVEL])).toBe(1600);
  });

  it('says nothing where the stream does not say', () => {
    expect(readHevcPeakNits([Uint8Array.from([0x40, 0x01, 0x0c])])).toBeNull();
  });
});
