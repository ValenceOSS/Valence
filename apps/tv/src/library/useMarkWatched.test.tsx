import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { markWatched } from '@ValenceClient/playback/markWatched';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { useMarkWatched } from '@ValenceTv/library/useMarkWatched';

jest.mock('@ValenceClient/playback/markWatched', () => ({
  markWatched: jest.fn().mockResolvedValue(undefined),
}));

describe('useMarkWatched', () => {
  it('records it, then asks for progress again so what is shown follows', async () => {
    const cache = new QueryClient();
    const asked = jest.spyOn(cache, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cache}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useMarkWatched(), { wrapper });
    const film = aMediaSummary();

    result.current([film], true);

    expect(markWatched).toHaveBeenCalledWith([film], true);

    await waitFor(() => {
      expect(asked).toHaveBeenCalledWith({ queryKey: viewingQueries.progress().queryKey });
    });
  });
});
