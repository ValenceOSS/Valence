import { describe, expect, it } from 'vitest';
import { placeOfVideoQuality } from './placeOfVideoQuality';

const QUALITIES = ['bluray-1080p', 'webdl-1080p', 'webdl-720p'] as const;

describe('placeOfVideoQuality', () => {
  it('places a video by the quality its source and resolution make', () => {
    expect(placeOfVideoQuality({ source: 'webdl', resolution: '1080p' }, QUALITIES)).toBe(1);
  });

  it('places one that gives no source as the lowest the list takes at its resolution', () => {
    expect(placeOfVideoQuality({ source: null, resolution: '1080p' }, QUALITIES)).toBe(1);
  });

  it('places nothing the list does not take', () => {
    expect(placeOfVideoQuality({ source: 'hdtv', resolution: '1080p' }, QUALITIES)).toBeNull();
    expect(placeOfVideoQuality({ source: null, resolution: '2160p' }, QUALITIES)).toBeNull();
    expect(placeOfVideoQuality({ source: 'webdl', resolution: null }, QUALITIES)).toBeNull();
  });
});
