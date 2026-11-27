import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { aViewing } from '@ValenceClient/testing/aViewing';
import { groupHistory } from '@ValenceClient/history/groupHistory';
import type { InfiniteData } from '@tanstack/react-query';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';
import { forgetTitleInPlace } from './forgetTitleInPlace';

const { forgetViewing, fetchHistory, forgetWatchedTitle } = vi.hoisted(() => ({
  forgetViewing: vi.fn<(viewingId: string) => Promise<boolean>>(),
  fetchHistory: vi.fn<(offset?: number) => Promise<Viewing[]>>(),
  forgetWatchedTitle: vi.fn<(mediaId: string) => Promise<number>>(),
}));

vi.mock('@ValenceClient/history/fetchHistory', () => ({
  forgetViewing,
  fetchHistory,
  forgetHistory: vi.fn(),
  A_PAGE: 2,
}));

vi.mock('@ValenceClient/history/forgetWatchedTitle', () => ({ forgetWatchedTitle }));

const historyKey = viewingQueries.history().queryKey;

const episode = (id: string, at: string) =>
  aViewing({
    id,
    mediaItemId: `media-${id}`,
    title: id,
    seriesTitle: 'Severance',
    seriesId: 'severance',
    lastWatchedAt: at,
  });

const LATEST = episode('three', '2026-09-03T20:00:00.000Z');

const FILM = aViewing({ id: 'film', lastWatchedAt: '2026-09-02T20:00:00.000Z' });

const OLDER = episode('one', '2026-08-01T20:00:00.000Z');

const severance = groupHistory([LATEST, FILM]).find((one) => one.latest.id === 'three');

let cache: QueryClient;

beforeEach(() => {
  vi.clearAllMocks();
  cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  cache.setQueryData(historyKey, { pages: [[LATEST, FILM]], pageParams: [0] });
});

/**
 * The ids of the viewings the cache holds now.
 *
 * @returns The ids.
 */
const heldIds = () =>
  cache
    .getQueryData<InfiniteData<Viewing[]>>(historyKey)
    ?.pages.flat()
    .map((one) => one.id);

describe('forgetTitleInPlace', () => {
  it('asks a server that can to forget the whole programme by one of its episodes', async () => {
    forgetWatchedTitle.mockResolvedValue(5);

    if (severance === undefined) {
      throw new Error('no programme');
    }

    await expect(forgetTitleInPlace(cache, severance, true)).resolves.toBe(true);

    expect(heldIds()).toEqual(['film']);
    expect(forgetWatchedTitle).toHaveBeenCalledWith('media-three');
    expect(fetchHistory).not.toHaveBeenCalled();
    expect(forgetViewing).not.toHaveBeenCalled();
  });

  it('reads an older server’s whole history and forgets every viewing of the programme in it', async () => {
    forgetViewing.mockResolvedValue(true);
    fetchHistory.mockImplementation((offset = 0) =>
      Promise.resolve(offset === 0 ? [LATEST, FILM] : offset === 2 ? [OLDER] : []),
    );

    if (severance === undefined) {
      throw new Error('no programme');
    }

    await expect(forgetTitleInPlace(cache, severance, false)).resolves.toBe(true);

    expect(fetchHistory.mock.calls.map(([offset]) => offset)).toEqual([0, 2]);
    expect(forgetViewing.mock.calls.map(([id]) => id).sort()).toEqual(['one', 'three']);
    expect(heldIds()).toEqual(['film']);
  });

  it('reads the history again where the server kept any of it', async () => {
    forgetWatchedTitle.mockRejectedValue(new Error('refused'));

    if (severance === undefined) {
      throw new Error('no programme');
    }

    await expect(forgetTitleInPlace(cache, severance, true)).resolves.toBe(false);

    expect(cache.getQueryState(historyKey)?.isInvalidated).toBe(true);
  });
});
