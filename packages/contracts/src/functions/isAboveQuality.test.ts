import { describe, expect, it } from 'vitest';
import { isAboveQuality } from './isAboveQuality';

describe('isAboveQuality', () => {
  it('puts a sharper quality above the ceiling', () => {
    expect(isAboveQuality('2160p', '1080p')).toBe(true);
    expect(isAboveQuality('1440p', '1080p')).toBe(true);
  });

  it('keeps the ceiling itself and anything below it within reach', () => {
    expect(isAboveQuality('1080p', '1080p')).toBe(false);
    expect(isAboveQuality('720p', '1080p')).toBe(false);
    expect(isAboveQuality('144p', '1080p')).toBe(false);
  });

  it('puts nothing above where no ceiling is set', () => {
    expect(isAboveQuality('2160p', null)).toBe(false);
  });
});
