import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLookAgainWhenShown } from './useLookAgainWhenShown';
import type { QueryKey } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const KEY: QueryKey = ['admin', 'everyFile', []];

let cache: QueryClient;

const showing = (read: () => Promise<number>, isShownAtFirst: boolean, keyAtFirst = KEY) =>
  renderHook(
    ({ isShown, queryKey }: { isShown: boolean; queryKey: QueryKey }) => {
      useQuery({ queryKey, queryFn: read, staleTime: Infinity });

      return useLookAgainWhenShown(isShown, [queryKey]);
    },
    {
      initialProps: { isShown: isShownAtFirst, queryKey: keyAtFirst },
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: cache }, children),
    },
  );

beforeEach(() => {
  cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
});

afterEach(() => {
  cache.clear();
});

describe('useLookAgainWhenShown', () => {
  it('asks again each time the part comes into view, however fresh the answer', async () => {
    const read = vi.fn(() => Promise.resolve(1));
    const { rerender } = showing(read, false);

    await waitFor(() => {
      expect(read).toHaveBeenCalledTimes(1);
    });

    rerender({ isShown: true, queryKey: KEY });

    await waitFor(() => {
      expect(read).toHaveBeenCalledTimes(2);
    });

    rerender({ isShown: false, queryKey: KEY });
    rerender({ isShown: true, queryKey: KEY });

    await waitFor(() => {
      expect(read).toHaveBeenCalledTimes(3);
    });
  });

  it('joins a question already being asked rather than asking twice', async () => {
    let answer: (value: number) => void = () => {};
    const read = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          answer = resolve;
        }),
    );

    showing(read, true);
    answer(1);

    await waitFor(() => {
      expect(cache.getQueryData(KEY)).toBe(1);
    });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('says it is waiting until the answer it asked again arrives', async () => {
    let answer: (value: number) => void = () => {};
    const read = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          answer = resolve;
        }),
    );
    const { result } = showing(read, true);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    answer(1);

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('asks again for an answer that joins the part while it is in view, and only that one', async () => {
    const read = vi.fn(() => Promise.resolve(1));
    const later: QueryKey = ['admin', 'everyFile', ['library-1']];
    const { rerender } = showing(read, true);

    await waitFor(() => {
      expect(cache.getQueryData(KEY)).toBe(1);
    });

    const refetch = vi.spyOn(cache, 'refetchQueries');

    rerender({ isShown: true, queryKey: later });

    await waitFor(() => {
      expect(cache.getQueryData(later)).toBe(1);
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith(
      { queryKey: later, type: 'active' },
      { cancelRefetch: false },
    );
  });

  it('asks nothing while the part is out of view', async () => {
    const read = vi.fn(() => Promise.resolve(1));

    showing(read, false);

    await waitFor(() => {
      expect(cache.getQueryData(KEY)).toBe(1);
    });
    expect(read).toHaveBeenCalledTimes(1);
  });
});
