import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useHasScrubPreviews } from './useHasScrubPreviews';
import type { ReactNode } from 'react';
import type * as FetchTrickplay from '@ValenceScreens/playback/fetchTrickplay';

const asked = vi.hoisted(() => ({ fetchTrickplay: vi.fn() }));

vi.mock('@ValenceScreens/playback/fetchTrickplay', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchTrickplay>()),
  fetchTrickplay: asked.fetchTrickplay,
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const BUILT = { thumbnails: [], width: 320, height: 180 };

describe('useHasScrubPreviews', () => {
  it('says the previews are built once the server has them', async () => {
    asked.fetchTrickplay.mockResolvedValue(BUILT);

    const { result } = renderHook(() => useHasScrubPreviews('media-1', true), { wrapper });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('says they are not built while the server has none', async () => {
    asked.fetchTrickplay.mockReset().mockResolvedValue(null);

    const { result } = renderHook(() => useHasScrubPreviews('media-1', true), { wrapper });

    await waitFor(() => {
      expect(asked.fetchTrickplay).toHaveBeenCalledWith('media-1');
    });

    expect(result.current).toBe(false);
  });

  it('does not ask for a viewer who would not be offered the control', () => {
    asked.fetchTrickplay.mockReset();

    const { result } = renderHook(() => useHasScrubPreviews('media-1', false), { wrapper });

    expect(asked.fetchTrickplay).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
  });

  it('does not ask before there is an item', () => {
    asked.fetchTrickplay.mockReset();

    renderHook(() => useHasScrubPreviews(null, true), { wrapper });

    expect(asked.fetchTrickplay).not.toHaveBeenCalled();
  });
});
