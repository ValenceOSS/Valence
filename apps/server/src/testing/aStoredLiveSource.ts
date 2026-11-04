import type { StoredLiveSource } from '@ValenceServer/live/LiveTvStore';

/**
 * A single-stream live TV source, with anything the test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The source, as the store holds it.
 */
const aStoredLiveSource = (overrides: Partial<StoredLiveSource> = {}): StoredLiveSource => ({
  id: '6b1f0000-0000-4000-8000-000000000001',
  name: 'News',
  kind: 'stream',
  address: 'https://streams.example/news.m3u8',
  guideUrl: null,
  logoUrl: null,
  playlist: null,
  channelCount: 1,
  refreshedAt: null,
  problem: null,
  createdAt: new Date('2026-11-04T12:00:00.000Z'),
  ...overrides,
});

export { aStoredLiveSource };
