import { describe, expect, it } from 'vitest';
import { heldInLibraryOf } from './heldInLibraryOf';
import type { SeriesFile } from '@ValenceServer/requests/catalogue/SeriesFile';

/**
 * An episode file of a series in the main library, filed in the folder its path says.
 *
 * @param path - Where it is.
 * @param season - Its season.
 * @param episode - Its number.
 * @param overrides - Anything else about it.
 * @returns The file.
 */
const aFile = (
  path: string,
  season: number,
  episode: number,
  overrides: Partial<SeriesFile> = {},
): SeriesFile => ({
  libraryId: 'shows',
  seriesId: 'show',
  seriesKey: 'folder:/media/Shows/Show',
  path,
  season,
  episode,
  lastEpisode: null,
  ...overrides,
});

describe('heldInLibraryOf', () => {
  it('says nothing is held of a series no library has', () => {
    expect(heldInLibraryOf([], 'shows', true)).toEqual({
      mediaId: null,
      episodes: [],
      folder: null,
      seasonFolders: [],
    });
  });

  it('keeps to the series folder, and the folder each season is in, loose or not', () => {
    expect(
      heldInLibraryOf(
        [
          aFile('/media/Shows/Show/Show S01E01.mkv', 1, 1),
          aFile('/media/Shows/Show/Show S01E02.mkv', 1, 2),
          aFile('/media/Shows/Show/Season 2/Show S02E01.mkv', 2, 1),
        ],
        'shows',
        true,
      ),
    ).toEqual({
      mediaId: 'show',
      episodes: [
        { season: 1, episode: 1 },
        { season: 1, episode: 2 },
        { season: 2, episode: 1 },
      ],
      folder: '/media/Shows/Show',
      seasonFolders: [
        { season: 1, folder: '/media/Shows/Show' },
        { season: 2, folder: '/media/Shows/Show/Season 2' },
      ],
    });
  });

  it('counts a double episode as both, and copies of one episode once', () => {
    expect(
      heldInLibraryOf(
        [
          aFile('/media/Shows/Show/Season 1/Show S01E01-E02.mkv', 1, 1, { lastEpisode: 2 }),
          aFile('/media/Shows/Show/Season 1/Show S01E01 - 4K.mkv', 1, 1),
        ],
        'shows',
        true,
      ).episodes,
    ).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
    ]);
  });

  it('keeps to the copy of a series with the most episodes, where a library holds two', () => {
    const held = heldInLibraryOf(
      [
        aFile('/media/Shows/Show/Season 1/a.mkv', 1, 1),
        aFile('/media/Shows/Show/Season 1/b.mkv', 1, 2),
        aFile('/media/Shows/Show (2019)/Season 03/c.mkv', 3, 1, {
          seriesId: 'copy',
          seriesKey: 'folder:/media/Shows/Show (2019)',
        }),
      ],
      'shows',
      true,
    );

    expect(held).toMatchObject({ mediaId: 'show', folder: '/media/Shows/Show' });
    expect(held.episodes).toHaveLength(3);
    expect(held.seasonFolders).toEqual([{ season: 1, folder: '/media/Shows/Show/Season 1' }]);
  });

  it('subtracts what another library holds, but files nowhere of its', () => {
    expect(
      heldInLibraryOf(
        [
          aFile('/media/4K/Show/Season 1/a.mkv', 1, 1, {
            libraryId: '4k',
            seriesKey: 'folder:/media/4K/Show',
          }),
        ],
        'shows',
        true,
      ),
    ).toEqual({
      mediaId: 'show',
      episodes: [{ season: 1, episode: 1 }],
      folder: null,
      seasonFolders: [],
    });
  });

  it('names no folder where the library files new episodes apart', () => {
    expect(
      heldInLibraryOf([aFile('/media/Shows/Show/Season 1/a.mkv', 1, 1)], 'shows', false),
    ).toMatchObject({ folder: null, seasonFolders: [], episodes: [{ season: 1, episode: 1 }] });
  });

  it('names no folder for a series filed loose in the library', () => {
    expect(
      heldInLibraryOf(
        [aFile('/media/Shows/Show S01E01.mkv', 1, 1, { seriesKey: 'title:show' })],
        'shows',
        true,
      ),
    ).toMatchObject({ folder: null, seasonFolders: [] });
  });
});
