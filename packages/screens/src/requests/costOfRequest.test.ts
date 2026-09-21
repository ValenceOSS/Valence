import { describe, expect, it } from 'vitest';
import { costOfRequest } from '@ValenceScreens/requests/costOfRequest';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const anItem = (downloadedBytes: number | null, downloadSeconds: number | null): RequestItem => ({
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  musicBrainzId: null,
  season: null,
  episode: null,
  title: 'Dune',
  airDate: null,
  state: 'filed',
  problem: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  downloadedBytes,
  downloadSeconds,
  lastSearchedAt: null,
  updatedAt: '2026-09-21T00:00:00.000Z',
});

describe('costOfRequest', () => {
  it('adds up what a whole season cost to fetch', () => {
    expect(costOfRequest({ items: [anItem(100, 60), anItem(250, 30)] }).bytes).toBe(350);
  });

  it('reports the longest wait rather than the sum, since episodes come at once', () => {
    expect(costOfRequest({ items: [anItem(100, 60), anItem(250, 30)] }).seconds).toBe(60);
  });

  it('ignores an item that brought nothing', () => {
    expect(costOfRequest({ items: [anItem(100, 60), anItem(null, null)] })).toEqual({
      bytes: 100,
      seconds: 60,
    });
  });

  it('says nothing where nothing has been downloaded', () => {
    expect(costOfRequest({ items: [anItem(null, null)] })).toEqual({ bytes: null, seconds: null });
    expect(costOfRequest({ items: [] })).toEqual({ bytes: null, seconds: null });
  });

  it('keeps a size known without a wait, and a wait without a size', () => {
    expect(costOfRequest({ items: [anItem(100, null)] })).toEqual({ bytes: 100, seconds: null });
    expect(costOfRequest({ items: [anItem(null, 60)] })).toEqual({ bytes: null, seconds: 60 });
  });
});
