import { describe, expect, it } from 'vitest';
import { videoRangeOfJellyfin } from './videoRangeOfJellyfin';

describe('videoRangeOfJellyfin', () => {
  it('names Jellyfin’s ranges as Valence names them', () => {
    expect(videoRangeOfJellyfin('HDR10')).toBe('HDR10');
    expect(videoRangeOfJellyfin('DOVIWithHDR10')).toBe('DolbyVision');
    expect(videoRangeOfJellyfin('Unknown')).toBe('SDR');
    expect(videoRangeOfJellyfin(null)).toBe('SDR');
  });
});
