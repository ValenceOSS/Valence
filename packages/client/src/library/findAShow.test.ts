import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { findAShow } from './findAShow';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';

const fetchLibraries = vi.fn<() => Promise<{ id: string; kind: LibraryKind }[]>>();
const fetchShows = vi.fn<(libraryId: string) => Promise<ShowSummary[]>>();

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => fetchLibraries(),
}));

vi.mock('@ValenceClient/library/fetchShows', () => ({
  fetchShows: (libraryId: string) => fetchShows(libraryId),
}));

const show = (id: string, libraryId: string, seriesId: string | null): ShowSummary => ({
  id,
  libraryId,
  title: id,
  seasonCount: 1,
  episodeCount: 8,
  latestAddedAt: '2026-10-01T00:00:00.000Z',
  coverMediaId: '00000000-0000-4000-8000-000000000001',
  seriesId,
});

describe('findAShow', () => {
  beforeEach(() => {
    fetchLibraries.mockResolvedValue([
      { id: 'films', kind: 'movies' },
      { id: 'telly', kind: 'shows' },
      { id: 'more-telly', kind: 'shows' },
    ]);
    fetchShows.mockImplementation((libraryId) =>
      libraryId === 'telly'
        ? Promise.resolve([show('show-1', 'telly', null)])
        : Promise.resolve([show('show-2', 'more-telly', 'series-2')]),
    );
  });

  it('finds a programme by its own id, asking only the libraries of programmes', async () => {
    await expect(findAShow(new QueryClient(), 'show-1')).resolves.toMatchObject({
      id: 'show-1',
      libraryId: 'telly',
    });
    expect(fetchShows).not.toHaveBeenCalledWith('films');
  });

  it('finds a programme by the series it belongs to', async () => {
    await expect(findAShow(new QueryClient(), 'series-2')).resolves.toMatchObject({
      id: 'show-2',
      libraryId: 'more-telly',
    });
  });

  it('says so when no library holds it, even where one could not be read', async () => {
    fetchShows.mockImplementation((libraryId) =>
      libraryId === 'telly' ? Promise.reject(new Error('gone')) : Promise.resolve([]),
    );

    await expect(findAShow(new QueryClient(), 'show-9')).resolves.toBeNull();
  });
});
