import { describe, expect, it } from 'vitest';
import { RadarrMovieSchema } from './RadarrMovieSchema';

describe('RadarrMovieSchema', () => {
  it('reads a film Radarr has imported, with where its file is', () => {
    expect(
      RadarrMovieSchema.parse({
        title: 'Dune',
        originalTitle: 'Dune',
        sortTitle: 'dune',
        sizeOnDisk: 8_589_934_592,
        status: 'released',
        overview: 'Paul Atreides…',
        inCinemas: '2021-09-15T00:00:00Z',
        images: [],
        year: 2021,
        path: '/movies/Dune (2021)',
        qualityProfileId: 4,
        hasFile: true,
        movieFileId: 3,
        monitored: true,
        minimumAvailability: 'released',
        isAvailable: true,
        folderName: '/movies/Dune (2021)',
        runtime: 155,
        tmdbId: 438_631,
        imdbId: 'tt1160419',
        rootFolderPath: '/movies/',
        movieFile: {
          movieId: 12,
          relativePath: 'Dune (2021) Bluray-1080p.mkv',
          path: '/movies/Dune (2021)/Dune (2021) Bluray-1080p.mkv',
          size: 8_589_934_592,
          dateAdded: '2026-10-01T09:30:00Z',
          id: 3,
        },
        id: 12,
      }),
    ).toEqual({
      id: 12,
      tmdbId: 438_631,
      title: 'Dune',
      path: '/movies/Dune (2021)',
      monitored: true,
      hasFile: true,
      movieFile: { path: '/movies/Dune (2021)/Dune (2021) Bluray-1080p.mkv' },
    });
  });

  it('reads a film still missing, which has no file', () => {
    expect(
      RadarrMovieSchema.parse({
        id: 13,
        tmdbId: 693_134,
        title: 'Dune: Part Two',
        monitored: true,
      }),
    ).toMatchObject({ hasFile: false });
  });
});
