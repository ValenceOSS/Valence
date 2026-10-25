import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import { dismissInPlace } from './dismissInPlace';

const setDismissed = vi.hoisted(() =>
  vi.fn<(mediaId: string, isDismissed: boolean) => Promise<boolean>>(),
);

vi.mock('@ValenceClient/library/setDismissed', () => ({ setDismissed }));

const started: WatchProgress = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  positionSeconds: 600,
  durationSeconds: 1500,
  isFinished: false,
  updatedAt: '2026-10-20T12:00:00.000Z',
};

const other: WatchProgress = { ...started, mediaId: '00000000-0000-4000-8000-000000000002' };

const nextEpisode: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000003',
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'The next one',
  year: 2026,
  durationSeconds: 1500,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: 'a-show',
};

const progressKey = viewingQueries.progress().queryKey;

const upNextKey = viewingQueries.upNext().queryKey;

const upNext = [{ episode: nextEpisode, lastWatchedAt: '2026-10-21T12:00:00.000Z' }];

let cache: QueryClient;

beforeEach(() => {
  setDismissed.mockReset();
  setDismissed.mockResolvedValue(true);
  cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  cache.setQueryData(progressKey, [started, other]);
  cache.setQueryData(upNextKey, upNext);
});

describe('dismissInPlace', () => {
  it('takes it off the row before the server answers, keeping where they got to', async () => {
    let answer: (isAgreed: boolean) => void = () => {};

    setDismissed.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    const dismissing = dismissInPlace(cache, started.mediaId, true);

    await vi.waitFor(() => {
      expect(cache.getQueryData(progressKey)).toEqual([{ ...started, isDismissed: true }, other]);
    });

    answer(true);

    await expect(dismissing).resolves.toBe(true);
    expect(setDismissed).toHaveBeenCalledWith(started.mediaId, true);
  });

  it('takes a next episode off the row, which has no progress of its own', async () => {
    await dismissInPlace(cache, nextEpisode.id, true);

    expect(cache.getQueryData(upNextKey)).toEqual([]);
    expect(cache.getQueryData(progressKey)).toEqual([started, other]);
  });

  it('puts it back as it was where the server refuses', async () => {
    setDismissed.mockResolvedValue(false);

    await expect(dismissInPlace(cache, nextEpisode.id, true)).resolves.toBe(false);

    expect(cache.getQueryData(upNextKey)).toEqual(upNext);
    expect(cache.getQueryData(progressKey)).toEqual([started, other]);
  });

  it('puts a half-watched title back on the row where the server refuses', async () => {
    setDismissed.mockResolvedValue(false);

    await expect(dismissInPlace(cache, started.mediaId, true)).resolves.toBe(false);

    expect(cache.getQueryData(progressKey)).toEqual([started, other]);
  });

  it('puts something back on the row', async () => {
    cache.setQueryData(progressKey, [{ ...started, isDismissed: true }, other]);

    await dismissInPlace(cache, started.mediaId, false);

    expect(cache.getQueryData(progressKey)).toEqual([{ ...started, isDismissed: false }, other]);
    expect(setDismissed).toHaveBeenCalledWith(started.mediaId, false);
  });

  it('reads how far through everything they are again afterwards', async () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    await dismissInPlace(cache, started.mediaId, true);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: progressKey });
  });
});
