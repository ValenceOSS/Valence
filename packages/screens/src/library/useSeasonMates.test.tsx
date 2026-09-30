import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { useSeasonMates } from './useSeasonMates';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ReactNode } from 'react';
import type * as LibraryQueriesModule from '@ValenceClient/query/libraryQueries';

const episode = (id: string, episodeNumber: number, seasonNumber = 1): MediaSummary => ({
  id,
  libraryId: '11111111-1111-4111-8111-111111111111',
  title: `Episode ${episodeNumber.toString()}`,
  year: 2023,
  durationSeconds: 1385,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: 'The Dangers in My Heart',
  seasonNumber,
  episodeNumber,
});

const fetchShows = vi.hoisted(() => vi.fn());
const fetchShow = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/query/libraryQueries', async (importOriginal) => {
  const actual = await importOriginal<typeof LibraryQueriesModule>();

  return {
    libraryQueries: {
      ...actual.libraryQueries,
      shows: (libraryId: string | null) => ({
        queryKey: ['shows', libraryId],
        queryFn: fetchShows,
        enabled: libraryId !== null,
      }),
      show: (libraryId: string | null, showId: string | null) => ({
        queryKey: ['show', libraryId, showId],
        queryFn: fetchShow,
        enabled: libraryId !== null && showId !== null,
      }),
    },
  };
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useSeasonMates', () => {
  it('finds the rest of the season from the whole programme, not only what is loaded', async () => {
    fetchShows.mockResolvedValue([{ id: 'show-1', title: 'The Dangers in My Heart' }]);
    fetchShow.mockResolvedValue({
      seasons: [
        { seasonNumber: 1, episodes: [episode('e3', 3), episode('e1', 1), episode('e2', 2)] },
        { seasonNumber: 2, episodes: [episode('s2e1', 1, 2)] },
      ],
    });

    const open = episode('e2', 2);
    const { result } = renderHook(() => useSeasonMates(open, [open]), { wrapper });

    await waitFor(() => {
      expect(result.current.map((one) => one.id)).toEqual(['e1', 'e3']);
    });
  });

  it('shows what is already loaded until the programme arrives', () => {
    fetchShows.mockReturnValue(new Promise(() => undefined));

    const open = episode('e2', 2);
    const { result } = renderHook(() => useSeasonMates(open, [open, episode('e1', 1)]), {
      wrapper,
    });

    expect(result.current.map((one) => one.id)).toEqual(['e1']);
  });

  it('has nothing for a film, which belongs to no season', () => {
    const film = { ...episode('f', 1), seriesTitle: null, seasonNumber: null, episodeNumber: null };
    const { result } = renderHook(() => useSeasonMates(film, [film]), { wrapper });

    expect(result.current).toEqual([]);
  });

  it('has nothing where nothing is open', () => {
    const { result } = renderHook(() => useSeasonMates(null, []), { wrapper });

    expect(result.current).toEqual([]);
  });
});
