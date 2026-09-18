import { describe, expect, it } from 'vitest';
import { isAlreadyAsSmall } from './isAlreadyAsSmall';

describe('isAlreadyAsSmall', () => {
  it('sends a lossy file at the bitrate asked for as it is', () => {
    expect(isAlreadyAsSmall({ isLossless: false, bitrateKbps: 320 }, 320)).toBe(true);
    expect(isAlreadyAsSmall({ isLossless: false, bitrateKbps: 340 }, 320)).toBe(true);
  });

  it('encodes a lossy file much bigger than asked for', () => {
    expect(isAlreadyAsSmall({ isLossless: false, bitrateKbps: 320 }, 160)).toBe(false);
  });

  it('always encodes a lossless file', () => {
    expect(isAlreadyAsSmall({ isLossless: true, bitrateKbps: 900 }, 320)).toBe(false);
  });

  it('encodes a file whose bitrate is not known', () => {
    expect(isAlreadyAsSmall({ isLossless: false, bitrateKbps: null }, 320)).toBe(false);
  });
});
