import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useProgress } from '@ValenceTv/library/useProgress';
import type { ReactNode } from 'react';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const mockFetchProgress = jest.fn(() => Promise.resolve<WatchProgress[]>([]));

jest.mock('@ValenceClient/playback/watchProgress', () => ({
  ...jest.requireActual<object>('@ValenceClient/playback/watchProgress'),
  fetchWatchProgress: () => mockFetchProgress(),
}));

const PROGRESS: WatchProgress = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  positionSeconds: 600,
  durationSeconds: 6000,
  isFinished: false,
  updatedAt: '2026-09-23T00:00:00.000Z',
};

const aCache = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const WithTheCache = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  WithTheCache.displayName = 'WithTheCache';

  return WithTheCache;
};

describe('useProgress', () => {
  it('knows nothing until the progress has arrived', async () => {
    mockFetchProgress.mockImplementationOnce(() => new Promise<WatchProgress[]>(() => undefined));

    const { result } = await renderHook(() => useProgress(), { wrapper: aCache() });

    expect(result.current.isKnown).toBe(false);
    expect(result.current.progress.size).toBe(0);
  });

  it('keeps how far through each title this viewer is, by title', async () => {
    mockFetchProgress.mockResolvedValueOnce([PROGRESS]);

    const { result } = await renderHook(() => useProgress(), { wrapper: aCache() });

    await waitFor(() => {
      expect(result.current.isKnown).toBe(true);
    });
    expect(result.current.progress.get(PROGRESS.mediaId)).toEqual(PROGRESS);
  });
});
