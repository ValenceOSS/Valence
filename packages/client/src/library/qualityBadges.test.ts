import { describe, expect, it } from 'vitest';
import { qualityBadges } from './qualityBadges';

describe('qualityBadges', () => {
  it('lets Atmos speak for the soundtrack on its own', () => {
    expect(
      qualityBadges({
        width: 3840,
        height: 2160,
        videoRange: 'DolbyVision',
        audioStreams: [
          { codec: 'aac', channels: 2, isAtmos: false },
          { codec: 'truehd', channels: 8, isAtmos: true },
        ],
      }),
    ).toEqual(['4K', 'Dolby Vision', 'Dolby Atmos']);
  });

  it('names a soundtrack without Atmos by its format and its channels', () => {
    expect(
      qualityBadges({
        width: 1920,
        height: 1080,
        videoRange: 'SDR',
        audioStreams: [{ codec: 'eac3', channels: 6, isAtmos: false }],
      }),
    ).toEqual(['HD', 'Dolby Digital+', '5.1']);
  });

  it('tells lossless DTS from the rest', () => {
    expect(
      qualityBadges({
        width: 1920,
        height: 1080,
        videoRange: 'SDR',
        audioStreams: [{ codec: 'dts', channels: 8, isAtmos: false, profile: 'DTS-HD MA' }],
      }),
    ).toEqual(['HD', 'DTS-HD MA', '7.1']);
  });

  it('judges a widescreen film by its width', () => {
    expect(qualityBadges({ width: 3840, height: 1600, videoRange: 'HDR10' })).toEqual([
      '4K',
      'HDR10',
    ]);
  });

  it('calls a small picture SD and says nothing about stereo', () => {
    expect(
      qualityBadges({
        width: 720,
        height: 480,
        videoRange: 'SDR',
        audioStreams: [{ codec: 'aac', channels: 2, isAtmos: false }],
      }),
    ).toEqual(['SD']);
  });
});
