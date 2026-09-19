import { describe, expect, it } from 'vitest';
import { progressOfRequest } from './progressOfRequest';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const ONE = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const TWO = '3f2504e0-4f89-41d3-9a0c-0305e82c3302';

/**
 * A download going as told.
 */
const going = (downloadId: string, doneBytes: number, secondsLeft: number | null) => ({
  downloadId,
  state: 'downloading' as const,
  progress: doneBytes / 100,
  sizeBytes: 100,
  doneBytes,
  downloadBytesPerSecond: 10,
  secondsLeft,
});

/**
 * An item waiting on the download given.
 */
const anItem = (
  downloadId: string | null,
  state: RequestItem['state'] = 'downloading',
): RequestItem => ({
  id: '1c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d',
  musicBrainzId: null,
  season: 1,
  episode: 1,
  title: '',
  airDate: null,
  state,
  problem: null,
  releaseTitle: null,
  downloadId,
  filePath: null,
  score: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
});

describe('progressOfRequest', () => {
  it('adds a request’s downloads together, waiting on the slowest', () => {
    expect(
      progressOfRequest({ items: [anItem(ONE), anItem(ONE), anItem(TWO)] }, [
        going(ONE, 50, 10),
        going(TWO, 100, 30),
        going('elsewhere', 0, 999),
      ]),
    ).toEqual({
      downloadId: ONE,
      state: 'downloading',
      progress: 0.75,
      sizeBytes: 200,
      doneBytes: 150,
      downloadBytesPerSecond: 20,
      secondsLeft: 30,
    });
  });

  it('says nothing of a request with nothing downloading', () => {
    expect(progressOfRequest({ items: [anItem(ONE, 'filed')] }, [going(ONE, 50, 10)])).toBeNull();
    expect(progressOfRequest({ items: [anItem(null)] }, [])).toBeNull();
  });
});
