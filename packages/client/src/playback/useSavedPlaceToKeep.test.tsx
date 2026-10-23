import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { useSavedPlaceToKeep } from './useSavedPlaceToKeep';
import type { ReactNode } from 'react';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const MEDIA_ID = '00000000-0000-4000-8000-000000000001';

const SAVED: WatchProgress = {
  mediaId: MEDIA_ID,
  positionSeconds: 3000,
  durationSeconds: 7200,
  isFinished: false,
  updatedAt: '2026-10-01T00:00:00.000Z',
};

/**
 * A cache that has, or has not yet, heard where this viewer got to.
 *
 * @param progress - What the server said, or nothing where it has not answered yet.
 * @returns The cache and a wrapper drawing inside it.
 */
const aCache = (progress?: WatchProgress[]) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, enabled: false } },
  });

  if (progress !== undefined) {
    cache.setQueryData(viewingQueries.progress().queryKey, progress);
  }

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cache}>{children}</QueryClientProvider>
  );

  return { cache, wrapper };
};

describe('useSavedPlaceToKeep', () => {
  it('keeps the saved place where the player started at the top before it had arrived', async () => {
    const { cache, wrapper } = aCache();
    const { result } = renderHook(() => useSavedPlaceToKeep(MEDIA_ID, 0), { wrapper });

    expect(result.current()).toBeNull();

    cache.setQueryData(viewingQueries.progress().queryKey, [SAVED]);

    await waitFor(() => {
      expect(result.current()).toBe(3000);
    });
  });

  it('keeps nothing where the player started at the top knowing where they were', () => {
    const { wrapper } = aCache([SAVED]);
    const { result } = renderHook(() => useSavedPlaceToKeep(MEDIA_ID, 0), { wrapper });

    expect(result.current()).toBeNull();
  });

  it('keeps nothing where the player started part way through', async () => {
    const { cache, wrapper } = aCache();
    const { result } = renderHook(() => useSavedPlaceToKeep(MEDIA_ID, 600), { wrapper });

    cache.setQueryData(viewingQueries.progress().queryKey, [SAVED]);

    await waitFor(() => {
      expect(result.current()).toBeNull();
    });
  });
});
