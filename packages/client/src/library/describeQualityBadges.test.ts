import { describe, expect, it } from 'vitest';
import { describeQualityBadges } from './describeQualityBadges';

describe('describeQualityBadges', () => {
  it('names a 4K Dolby Vision film with an Atmos track', () => {
    expect(
      describeQualityBadges({
        width: 3840,
        height: 2160,
        videoRange: 'DolbyVision',
        audioStreams: [
          { codec: 'aac', channels: 2, isAtmos: false },
          { codec: 'truehd', channels: 8, isAtmos: true },
        ],
      }),
    ).toEqual(['4K', 'Dolby Vision', 'Dolby Atmos', '7.1']);
  });

  it('names an ordinary HD film with a 5.1 Dolby Digital track', () => {
    expect(
      describeQualityBadges({
        width: 1920,
        height: 1080,
        videoRange: 'SDR',
        audioStreams: [{ codec: 'ac3', channels: 6, isAtmos: false }],
      }),
    ).toEqual(['HD', 'Dolby Digital', '5.1']);
  });

  it('says nothing about stereo, which everything has', () => {
    expect(
      describeQualityBadges({
        width: 720,
        height: 480,
        videoRange: 'SDR',
        audioStreams: [{ codec: 'aac', channels: 2, isAtmos: false }],
      }),
    ).toEqual(['SD']);
  });

  it('manages without knowing the soundtracks', () => {
    expect(describeQualityBadges({ width: 1920, height: 800, videoRange: 'HDR10' })).toEqual([
      'HD',
      'HDR10',
    ]);
  });
});
