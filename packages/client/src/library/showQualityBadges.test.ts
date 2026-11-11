import { describe, expect, it } from 'vitest';
import { showQualityBadges } from './showQualityBadges';

const episode = (width: number, height: number, videoRange = 'SDR', channels = 2) => ({
  width,
  height,
  videoRange,
  audio: { codec: 'aac', channels, isAtmos: false },
});

describe('showQualityBadges', () => {
  it('gives one plain badge where every episode agrees', () => {
    expect(showQualityBadges([episode(3840, 2160), episode(3840, 2160)])).toEqual([
      { label: '4K', isMixed: false },
    ]);
  });

  it('lists every sharpness, best first, on one badge marked as mixed', () => {
    expect(showQualityBadges([episode(1920, 1080), episode(3840, 2160)])[0]).toEqual({
      label: '4K / HD',
      isMixed: true,
    });
  });

  it('says standard range beside HDR where only some episodes have it', () => {
    const badges = showQualityBadges([episode(3840, 2160, 'HDR10'), episode(3840, 2160)]);

    expect(badges[1]).toEqual({ label: 'HDR10 / SDR', isMixed: true });
  });

  it('says stereo beside surround where only some episodes have it', () => {
    const badges = showQualityBadges([episode(1920, 1080, 'SDR', 6), episode(1920, 1080)]);

    expect(badges.at(-1)?.label.startsWith('5.1 / ')).toBe(true);
  });

  it('gives nothing for a programme with no episodes', () => {
    expect(showQualityBadges([])).toEqual([]);
  });
});
