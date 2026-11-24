import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail, ShowSummary } from '@ValenceContracts/schemas/Show';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import { findTheEpisodeAfter } from './findTheEpisodeAfter';

const { fetchLibraries, fetchShows, fetchShow } = vi.hoisted(() => ({
  fetchLibraries: vi.fn<() => Promise<{ id: string; kind: string }[]>>(),
  fetchShows: vi.fn<(libraryId: string) => Promise<ShowSummary[]>>(),
  fetchShow: vi.fn<(libraryId: string, showId: string) => Promise<ShowDetail | null>>(),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({ fetchLibraries }));

vi.mock('@ValenceClient/library/fetchShows', () => ({ fetchShows, fetchShow }));

const TELLY = '00000000-0000-4000-8000-0000000000a2';

const SERIES = '00000000-0000-4000-8000-0000000000b1';

const episode = (seasonNumber: number, episodeNumber: number): MediaSummary =>
  aMediaSummary({
    id: `s${seasonNumber.toString()}e${episodeNumber.toString()}`,
    libraryId: TELLY,
    title: `Episode ${episodeNumber.toString()}`,
    seriesTitle: 'Severance',
    seriesId: SERIES,
    seasonNumber,
    episodeNumber,
  });

const summary: ShowSummary = {
  id: 'severance',
  libraryId: TELLY,
  title: 'Severance',
  seasonCount: 2,
  episodeCount: 4,
  latestAddedAt: '2026-10-01T00:00:00.000Z',
  coverMediaId: '00000000-0000-4000-8000-000000000001',
  seriesId: SERIES,
};

const finished = (mediaId: string): WatchProgress => ({
  mediaId,
  positionSeconds: 3000,
  durationSeconds: 3000,
  isFinished: true,
  updatedAt: '2026-10-02T00:00:00.000Z',
});

const watched = { mediaItemId: 's1e1', seriesId: SERIES, seriesTitle: 'Severance' };

beforeEach(() => {
  vi.clearAllMocks();
  fetchLibraries.mockResolvedValue([{ id: TELLY, kind: 'shows' }]);
  fetchShows.mockResolvedValue([summary]);
  fetchShow.mockResolvedValue({
    ...summary,
    seasons: [
      { seasonNumber: 1, episodes: [episode(1, 1), episode(1, 2)] },
      { seasonNumber: 2, episodes: [episode(2, 1), episode(2, 2)] },
    ],
  });
});

describe('findTheEpisodeAfter', () => {
  it('finds the episode after the one watched, in the programme’s own library', async () => {
    await expect(findTheEpisodeAfter(new QueryClient(), watched, new Map())).resolves.toMatchObject(
      { id: 's1e2' },
    );
    expect(fetchShow).toHaveBeenCalledWith(TELLY, 'severance');
  });

  it('passes over episodes already finished, into the next season', async () => {
    await expect(
      findTheEpisodeAfter(new QueryClient(), watched, new Map([['s1e2', finished('s1e2')]])),
    ).resolves.toMatchObject({ id: 's2e1' });
  });

  it('finds nothing after the last episode', async () => {
    await expect(
      findTheEpisodeAfter(new QueryClient(), { ...watched, mediaItemId: 's2e2' }, new Map()),
    ).resolves.toBeNull();
  });

  it('finds nothing for a film, without asking any library', async () => {
    await expect(
      findTheEpisodeAfter(
        new QueryClient(),
        { mediaItemId: 'film', seriesId: null, seriesTitle: null },
        new Map(),
      ),
    ).resolves.toBeNull();
    expect(fetchLibraries).not.toHaveBeenCalled();
  });

  it('finds nothing where no library holds the programme any more', async () => {
    fetchShows.mockResolvedValue([]);

    await expect(findTheEpisodeAfter(new QueryClient(), watched, new Map())).resolves.toBeNull();
  });
});
