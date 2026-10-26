import { describe, expect, it } from 'vitest';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { AUDIO_QUALITY_DETAILS, AUDIO_QUALITY_LABELS } from '@ValenceContracts/schemas/Music';
import { waysToKeepMusic } from './waysToKeepMusic';

describe('waysToKeepMusic', () => {
  it('offers every quality, best first, each with roughly the room it takes', () => {
    expect(waysToKeepMusic([aTrack(1), aTrack(2)])).toEqual([
      {
        quality: 'lossless',
        label: AUDIO_QUALITY_LABELS.lossless,
        detail: AUDIO_QUALITY_DETAILS.lossless,
        bytes: 70_525_000,
      },
      {
        quality: 'high',
        label: AUDIO_QUALITY_LABELS.high,
        detail: '320 kbps',
        bytes: 16_120_000,
      },
      {
        quality: 'normal',
        label: AUDIO_QUALITY_LABELS.normal,
        detail: '160 kbps',
        bytes: 8_060_000,
      },
      {
        quality: 'low',
        label: AUDIO_QUALITY_LABELS.low,
        detail: '96 kbps',
        bytes: 4_836_000,
      },
    ]);
  });

  it('cannot say how much room the files as they are take where a song’s rate is not known', () => {
    const ways = waysToKeepMusic([aTrack(1), aTrack(2, { bitrateKbps: null })]);

    expect(ways[0]?.bytes).toBeNull();
    expect(ways[1]?.bytes).toBe(16_120_000);
  });

  it('takes no room at all for no songs', () => {
    expect(waysToKeepMusic([]).map((way) => way.bytes)).toEqual([0, 0, 0, 0]);
  });
});
