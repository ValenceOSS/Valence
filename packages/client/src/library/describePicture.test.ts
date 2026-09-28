import { describe, expect, it } from 'vitest';
import { describePicture } from './describePicture';

describe('describePicture', () => {
  it('says a picture’s resolution, and its range where it has more than the ordinary', () => {
    expect(describePicture({ width: 3840, height: 2160, videoRange: 'DolbyVision' })).toBe(
      '4K · Dolby Vision',
    );
    expect(describePicture({ width: 1920, height: 1080, videoRange: 'SDR' })).toBe('1080p');
  });

  it('judges a widescreen picture by its width', () => {
    expect(describePicture({ width: 1920, height: 800, videoRange: 'SDR' })).toBe('1080p');
  });
});
