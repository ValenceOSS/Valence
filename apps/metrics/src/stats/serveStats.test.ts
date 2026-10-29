import { describe, expect, it, vi } from 'vitest';
import { someStats } from '@ValenceMetrics/testing/someStats';
import { serveStats } from './serveStats';

vi.mock('./readCachedStats', () => ({
  readCachedStats: vi.fn(() => Promise.resolve(someStats())),
}));

vi.mock('@ValenceMetrics/downloads/readDownloads', () => ({
  readDownloads: vi.fn(() => Promise.resolve({ isKnown: true, total: 9, releases: [] })),
}));

describe('serveStats', () => {
  it('answers with the figures and the downloads, for caches to keep for five minutes', async () => {
    const response = await serveStats();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('max-age=300');
    expect(await response.json()).toStrictEqual({
      ...someStats(),
      downloads: { isKnown: true, total: 9, releases: [] },
    });
  });
});
