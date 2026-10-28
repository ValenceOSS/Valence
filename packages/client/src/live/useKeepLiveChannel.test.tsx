import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKeepLiveChannel } from '@ValenceClient/live/useKeepLiveChannel';
import { liveQueries } from '@ValenceClient/query/liveQueries';
import { aLiveChannel } from '@ValenceClient/testing/aLiveChannel';
import type { ReactNode } from 'react';
import type { LiveGuide } from '@ValenceContracts/schemas/LiveTv';

const keepLiveChannel = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/live/keepLiveChannel', () => ({ keepLiveChannel }));

const CHANNEL = aLiveChannel();

const FIRST = liveQueries.guide('2026-10-28T20:00:00.000Z', '2026-10-28T22:00:00.000Z');

const NEXT = liveQueries.guide('2026-10-28T21:00:00.000Z', '2026-10-28T23:00:00.000Z');

const GUIDE: LiveGuide = { hasProxy: false, channels: [CHANNEL], programmes: [] };

const drawn = (onFailed: () => void) => {
  const cache = new QueryClient();

  for (const asked of [FIRST, NEXT]) {
    cache.setQueryData(asked.queryKey, GUIDE);
  }

  const hook = renderHook(() => useKeepLiveChannel(onFailed), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cache}>{children}</QueryClientProvider>
    ),
  });

  return { cache, keep: hook.result.current };
};

const isKeptIn = (cache: QueryClient, asked: typeof FIRST) =>
  cache.getQueryData(asked.queryKey)?.channels[0]?.isFavourite;

describe('useKeepLiveChannel', () => {
  beforeEach(() => {
    keepLiveChannel.mockReset();
  });

  it('marks the channel kept in every stretch of the guide held, before the server answers', async () => {
    keepLiveChannel.mockReturnValue(new Promise(() => {}));

    const { cache, keep } = drawn(vi.fn());

    keep(CHANNEL);

    await waitFor(() => {
      expect(keepLiveChannel).toHaveBeenCalledWith(CHANNEL.id, true);
    });
    expect(isKeptIn(cache, FIRST)).toBe(true);
    expect(isKeptIn(cache, NEXT)).toBe(true);
  });

  it('keeps the mark over a read of the guide that was on its way with the old answer', async () => {
    keepLiveChannel.mockReturnValue(new Promise(() => {}));

    const { cache, keep } = drawn(vi.fn());

    void cache.fetchQuery({
      ...FIRST,
      staleTime: 0,
      queryFn: () =>
        new Promise<LiveGuide>((settle) => {
          setTimeout(() => {
            settle(GUIDE);
          }, 20);
        }),
    });
    keep(CHANNEL);

    await waitFor(() => {
      expect(keepLiveChannel).toHaveBeenCalled();
    });
    await new Promise((settle) => {
      setTimeout(settle, 40);
    });

    expect(isKeptIn(cache, FIRST)).toBe(true);
  });

  it('says so and reads the guide again when the server refuses', async () => {
    keepLiveChannel.mockResolvedValue(false);

    const onFailed = vi.fn();
    const { cache, keep } = drawn(onFailed);
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    keep(CHANNEL);

    await waitFor(() => {
      expect(onFailed).toHaveBeenCalled();
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: liveQueries.guides });
  });

  it('reads the guide again once the server has kept it', async () => {
    keepLiveChannel.mockResolvedValue(true);

    const onFailed = vi.fn();
    const { cache, keep } = drawn(onFailed);
    const invalidate = vi.spyOn(cache, 'invalidateQueries');

    keep(CHANNEL);

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: liveQueries.guides });
    });
    expect(onFailed).not.toHaveBeenCalled();
  });
});
