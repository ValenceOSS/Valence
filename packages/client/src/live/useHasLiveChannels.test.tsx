import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHasLiveChannels } from '@ValenceClient/live/useHasLiveChannels';
import { aLiveChannel } from '@ValenceClient/testing/aLiveChannel';
import type { ReactNode } from 'react';
import type { LiveChannel } from '@ValenceContracts/schemas/LiveTv';

const readFromServer = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/query/readFromServer', () => ({ readFromServer }));

const guideOf = (channels: LiveChannel[]) => ({ hasProxy: false, channels, programmes: [] });

const drawn = () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let draws = 0;
  const hook = renderHook(
    () => {
      draws += 1;

      return useHasLiveChannels();
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={cache}>{children}</QueryClientProvider>
      ),
    },
  );

  return { hook, draws: () => draws };
};

describe('useHasLiveChannels', () => {
  beforeEach(() => {
    readFromServer.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says so once the guide has a channel', async () => {
    readFromServer.mockResolvedValue(guideOf([aLiveChannel()]));

    const { hook } = drawn();

    await waitFor(() => {
      expect(hook.result.current).toBe(true);
    });
  });

  it('says not while the guide is empty', async () => {
    readFromServer.mockResolvedValue(guideOf([]));

    const { hook } = drawn();

    await waitFor(() => {
      expect(readFromServer).toHaveBeenCalled();
    });
    expect(hook.result.current).toBe(false);
  });

  it('asks for the half hour now and moves on only when the next one comes', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(Date.parse('2026-10-28T20:58:00Z'));
    readFromServer.mockResolvedValue(guideOf([aLiveChannel()]));

    const { hook, draws } = drawn();

    await act(
      () =>
        new Promise((settle) => {
          setTimeout(settle, 20);
        }),
    );

    expect(hook.result.current).toBe(true);
    expect(readFromServer).toHaveBeenLastCalledWith(
      `/api/live/guide?${new URLSearchParams({
        from: '2026-10-28T20:30:00.000Z',
        until: '2026-10-29T00:30:00.000Z',
      }).toString()}`,
      expect.anything(),
    );

    const settled = draws();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(draws()).toBe(settled);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(readFromServer).toHaveBeenLastCalledWith(
      `/api/live/guide?${new URLSearchParams({
        from: '2026-10-28T21:00:00.000Z',
        until: '2026-10-29T01:00:00.000Z',
      }).toString()}`,
      expect.anything(),
    );
  });
});
