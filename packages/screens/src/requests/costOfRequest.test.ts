import { describe, expect, it } from 'vitest';
import { costOfRequest } from '@ValenceScreens/requests/costOfRequest';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

let made = 0;

const anItem = (
  downloadedBytes: number | null,
  downloadSeconds: number | null,
  from: Partial<Pick<RequestItem, 'downloadId' | 'releaseTitle'>> = {},
): RequestItem => ({
  id: `6ba7b810-9dad-11d1-80b4-${(made++).toString().padStart(12, '0')}`,
  musicBrainzId: null,
  season: null,
  episode: null,
  title: 'Dune',
  airDate: null,
  state: 'filed',
  problem: null,
  problemCode: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  downloadedBytes,
  downloadSeconds,
  isFollowed: true,
  lastSearchedAt: null,
  updatedAt: '2026-09-21T00:00:00.000Z',
  ...from,
});

const PACK = 'a1b2c3d4-0000-4000-8000-000000000001';

const GIGABYTE = 1_000_000_000;

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

  it('counts a season pack once, though every episode in it carries its size', () => {
    const season = Array.from({ length: 33 }, () =>
      anItem(30 * GIGABYTE, 1800, { downloadId: PACK, releaseTitle: 'Show.S01.1080p' }),
    );

    expect(costOfRequest({ items: season }).bytes).toBe(30 * GIGABYTE);
  });

  it('adds a season pack to the episodes fetched on their own', () => {
    expect(
      costOfRequest({
        items: [
          anItem(30, 60, { downloadId: PACK, releaseTitle: 'Show.S01' }),
          anItem(30, 60, { downloadId: PACK, releaseTitle: 'Show.S01' }),
          anItem(4, 20, { downloadId: 'a1b2c3d4-0000-4000-8000-000000000002' }),
          anItem(5, 20, { downloadId: 'a1b2c3d4-0000-4000-8000-000000000003' }),
        ],
      }).bytes,
    ).toBe(39);
  });

  it('counts a pack once by its release where another app fetched it and names no download', () => {
    expect(
      costOfRequest({
        items: [
          anItem(30, null, { releaseTitle: 'Show.S02.1080p' }),
          anItem(30, null, { releaseTitle: 'Show.S02.1080p' }),
          anItem(2, null, { releaseTitle: 'Show.S02E09.1080p' }),
        ],
      }).bytes,
    ).toBe(32);
  });

  it('takes the most a download is said to have brought, where its items were told at different times', () => {
    expect(
      costOfRequest({
        items: [anItem(10, null, { downloadId: PACK }), anItem(25, null, { downloadId: PACK })],
      }).bytes,
    ).toBe(25);
  });
});
