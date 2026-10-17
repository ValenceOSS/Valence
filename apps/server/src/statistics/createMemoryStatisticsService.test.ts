import { describe, expect, it } from 'vitest';
import { createMemoryStatisticsService } from './createMemoryStatisticsService';

describe('createMemoryStatisticsService', () => {
  it('counts a play started again on the same device as the same play, delivered the latest way', async () => {
    let at = new Date('2026-10-17T20:00:00Z');
    const statistics = createMemoryStatisticsService(undefined, () => at);
    const play = { profileId: 'priya', mediaItemId: 'film', reasons: [], client: 'TV' } as const;

    await statistics.recordPlay({ ...play, mode: 'DirectPlay' });
    at = new Date('2026-10-17T20:30:00Z');
    await statistics.recordPlay({
      ...play,
      mode: 'Transcode',
      reasons: ['VideoBitrateAboveLimit'],
    });

    const read = await statistics.read('week', 'UTC');

    expect(read.modes).toEqual({ DirectPlay: 0, Remux: 0, DirectStream: 0, Transcode: 1 });
    expect(read.reasons).toEqual([{ code: 'VideoBitrateAboveLimit', plays: 1 }]);
  });

  it('counts a play on another device as another play', async () => {
    const statistics = createMemoryStatisticsService();

    await statistics.recordPlay({
      profileId: 'priya',
      mediaItemId: 'film',
      mode: 'DirectPlay',
      reasons: [],
      client: 'TV',
    });
    await statistics.recordPlay({
      profileId: 'priya',
      mediaItemId: 'film',
      mode: 'DirectPlay',
      reasons: [],
      client: 'Phone',
    });

    expect((await statistics.read('week', 'UTC')).modes.DirectPlay).toBe(2);
  });
});
