import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import { markWatchedInPlace } from './markWatchedInPlace';

const markWatched = vi.hoisted(() =>
  vi.fn<(items: readonly { id: string }[], isWatched: boolean) => Promise<void>>(),
);

vi.mock('@ValenceClient/playback/markWatched', () => ({ markWatched }));

const NOW = new Date('2026-10-22T12:00:00.000Z');

const started: WatchProgress = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  positionSeconds: 600,
  durationSeconds: 1500,
  isFinished: false,
  updatedAt: '2026-10-20T12:00:00.000Z',
};

const other: WatchProgress = {
  mediaId: '00000000-0000-4000-8000-000000000002',
  positionSeconds: 100,
  durationSeconds: 1000,
  isFinished: false,
  updatedAt: '2026-10-19T12:00:00.000Z',
};

const progressKey = viewingQueries.progress().queryKey;

let cache: QueryClient;

beforeEach(() => {
  markWatched.mockReset();
  markWatched.mockResolvedValue(undefined);
  cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  cache.setQueryData(progressKey, [started, other]);
});

describe('markWatchedInPlace', () => {
  it('shows it as finished before the server answers', async () => {
    let answer: () => void = () => {};

    markWatched.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    const marking = markWatchedInPlace(
      cache,
      [{ id: started.mediaId, durationSeconds: 1500 }],
      true,
      () => NOW,
    );

    await vi.waitFor(() => {
      expect(cache.getQueryData(progressKey)).toEqual([
        other,
        {
          mediaId: started.mediaId,
          positionSeconds: 1500,
          durationSeconds: 1500,
          isFinished: true,
          updatedAt: NOW.toISOString(),
        },
      ]);
    });

    answer();
    await marking;
  });

  it('forgets how far they got when marked unwatched', async () => {
    let answer: () => void = () => {};

    markWatched.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    const marking = markWatchedInPlace(
      cache,
      [{ id: started.mediaId, durationSeconds: 1500 }],
      false,
    );

    await vi.waitFor(() => {
      expect(cache.getQueryData(progressKey)).toEqual([other]);
    });

    answer();
    await marking;
  });

  it('puts the marks back and throws when the server refuses', async () => {
    markWatched.mockRejectedValue(new Error('refused'));

    await expect(
      markWatchedInPlace(cache, [{ id: started.mediaId, durationSeconds: 1500 }], true),
    ).rejects.toThrow('refused');

    expect(cache.getQueryData(progressKey)).toEqual([started, other]);
  });

  it('reads progress and programmes again, but not the rest of the library', async () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    await markWatchedInPlace(cache, [{ id: started.mediaId, durationSeconds: 1500 }], true);

    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      progressKey,
      ['library', 'shows'],
      ['library', 'show'],
    ]);
  });

  it('marks what was asked even when nothing has been read yet', async () => {
    cache.clear();

    await markWatchedInPlace(cache, [{ id: started.mediaId, durationSeconds: 1500 }], true);

    expect(markWatched).toHaveBeenCalledWith(
      [{ id: started.mediaId, durationSeconds: 1500 }],
      true,
    );
    expect(cache.getQueryData(progressKey)).toBeUndefined();
  });
});
