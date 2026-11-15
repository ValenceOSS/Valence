import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { PixelRatio } from 'react-native';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { useArtworkSize } from './useArtworkSize';

const mockFetchServerBuildInfo = jest.fn(() => new Promise<never>(() => undefined));

jest.mock('@ValenceClient/about/fetchServerBuildInfo', () => ({
  fetchServerBuildInfo: () => mockFetchServerBuildInfo(),
}));

/**
 * Draws a hook inside a cache that already knows what the server makes, or knows nothing yet.
 *
 * @param features - What the server says it makes, or null where it has not said.
 * @returns What to wrap the hook in.
 */
const knowing = (features: string[] | null) => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  if (features !== null) {
    cache.setQueryData(aboutQueries.server().queryKey, { features });
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cache}>{children}</QueryClientProvider>
  );

  Wrapper.displayName = 'Wrapper';

  return Wrapper;
};

beforeEach(() => {
  jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
  mockFetchServerBuildInfo.mockImplementation(() => new Promise<never>(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useArtworkSize', () => {
  it('asks for the small copy for a picture drawn small', async () => {
    const { result } = await renderHook(() => useArtworkSize(100), { wrapper: knowing(null) });

    expect(result.current).toBe('small');
  });

  it('asks for the medium copy for a picture drawn wider than the small one', async () => {
    const { result } = await renderHook(() => useArtworkSize(200), { wrapper: knowing(null) });

    expect(result.current).toBe('medium');
  });

  it('asks for the large copy for a picture across the screen', async () => {
    const { result } = await renderHook(() => useArtworkSize(400), {
      wrapper: knowing(['library.largeArtwork']),
    });

    expect(result.current).toBe('large');
  });

  it('asks for the whole picture from a server that makes no large copy', async () => {
    const { result } = await renderHook(() => useArtworkSize(400), { wrapper: knowing([]) });

    expect(result.current).toBe('whole');
  });

  it('asks for nothing yet until the server has said what it makes', async () => {
    const { result } = await renderHook(() => useArtworkSize(400), { wrapper: knowing(null) });

    expect(result.current).toBeNull();
  });

  it('asks for the whole picture where the server cannot say what it makes', async () => {
    mockFetchServerBuildInfo.mockImplementation(() => Promise.reject(new Error('offline')));

    const { result } = await renderHook(() => useArtworkSize(400), { wrapper: knowing(null) });

    await waitFor(() => {
      expect(result.current).toBe('whole');
    });
  });
});
