import { describe, expect, it } from 'vitest';
import { partsOfVideoQuality } from './partsOfVideoQuality';

describe('partsOfVideoQuality', () => {
  it('splits a quality into its source and resolution', () => {
    expect(partsOfVideoQuality('bluray-720p')).toEqual({ source: 'bluray', resolution: '720p' });
  });

  it('gives a cinema recording no resolution', () => {
    expect(partsOfVideoQuality('cam')).toEqual({ source: 'cam', resolution: null });
  });
});
