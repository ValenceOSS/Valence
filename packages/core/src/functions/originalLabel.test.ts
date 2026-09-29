import { describe, expect, it } from 'vitest';
import { originalLabel } from './originalLabel';

describe('originalLabel', () => {
  it('names the resolution of a film cropped wider than the screen', () => {
    expect(originalLabel({ width: 1920, height: 800 })).toBe('Original (1080p)');
  });

  it('calls a 4K file 4K, as the rest of the list does', () => {
    expect(originalLabel({ width: 3840, height: 2160 })).toBe('Original (4K)');
  });

  it('says only "Original" for a picture too small to name', () => {
    expect(originalLabel({ width: 160, height: 90 })).toBe('Original');
  });
});
