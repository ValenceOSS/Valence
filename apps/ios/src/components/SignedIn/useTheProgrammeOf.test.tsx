import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchLibraries } from '@ValenceClient/library/fetchLibrary';
import { fetchShows } from '@ValenceClient/library/fetchShows';
import { LibrarySchema } from '@ValenceContracts/schemas/Library';
import { useTheProgrammeOf } from './useTheProgrammeOf';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/library/fetchLibrary');

jest.mock('@ValenceClient/library/fetchShows');

const SERIES_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c9';

const SHOWS = LibrarySchema.parse({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa8',
  name: 'Programmes',
  kind: 'shows',
  path: '/media/shows',
  itemCount: 1,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
});

const Around = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
  >
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  jest.mocked(fetchLibraries).mockReset().mockResolvedValue([SHOWS]);
  jest
    .mocked(fetchShows)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'severance',
        libraryId: SHOWS.id,
        title: 'Severance',
        seasonCount: 1,
        episodeCount: 3,
        latestAddedAt: '2026-01-01T00:00:00.000Z',
        coverMediaId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        seriesId: SERIES_ID,
      },
    ]);
});

describe('useTheProgrammeOf', () => {
  it('finds the programme a series became, and the library it is in', async () => {
    const found = await renderHook(() => useTheProgrammeOf(SERIES_ID), { wrapper: Around });

    await waitFor(() => {
      expect(found.result.current).toEqual({ libraryId: SHOWS.id, showId: 'severance' });
    });
  });

  it('finds nothing for a series the library does not have', async () => {
    const found = await renderHook(
      () => useTheProgrammeOf('6ba7b810-9dad-11d1-80b4-00c04fd430ca'),
      { wrapper: Around },
    );

    await waitFor(() => {
      expect(fetchShows).toHaveBeenCalled();
    });
    expect(found.result.current).toBeNull();
  });

  it('asks nothing where nothing is being looked for', async () => {
    await renderHook(() => useTheProgrammeOf(null), { wrapper: Around });

    expect(fetchLibraries).not.toHaveBeenCalled();
  });
});
