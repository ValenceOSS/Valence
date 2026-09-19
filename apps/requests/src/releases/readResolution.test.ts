import { describe, expect, it } from 'vitest';
import { readResolution } from './readResolution';

describe('readResolution', () => {
  it.each([
    ['Movie 2160p WEB', '2160p'],
    ['Movie 1080i HDTV', '1080p'],
    ['Show FHD 1920x1080', '1080p'],
    ['Show HD 1280x720', '720p'],
    ['Show SD 854x480', '480p'],
    ['Movie 576p DVD', '576p'],
    ['Movie 4K HDR', '2160p'],
    ['Movie UHD BluRay', '2160p'],
    ['Movie FHD WEB', '1080p'],
    ['One Piece SD', '480p'],
  ] as const)('reads %s as %s', (name, resolution) => {
    expect(readResolution(name)).toBe(resolution);
  });

  it('says nothing where a name does not', () => {
    expect(readResolution('The Matrix 1999 DVDRip')).toBeNull();
  });
});
