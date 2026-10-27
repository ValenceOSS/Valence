import { describe, expect, it } from 'vitest';
import { isLowerQuality } from './isLowerQuality';

describe('isLowerQuality', () => {
  it('sets apart a copy filmed in a cinema, and nothing else', () => {
    expect(isLowerQuality({ source: 'cam' })).toBe(true);
    expect(isLowerQuality({ source: 'telesync' })).toBe(true);
    expect(isLowerQuality({ source: 'webdl' })).toBe(false);
    expect(isLowerQuality({ source: null })).toBe(false);
  });
});
