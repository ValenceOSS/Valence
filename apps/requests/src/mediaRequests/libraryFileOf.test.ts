import { describe, expect, it } from 'vitest';
import { libraryFileOf } from './libraryFileOf';

const NOWHERE_YET = { libraryFolder: null, seasonFolders: [] };

describe('libraryFileOf', () => {
  it('files a film as its title and year, in a folder of the same name', () => {
    expect(
      libraryFileOf(
        { ...NOWHERE_YET, libraryPath: '/media/Films', title: 'Mission: Impossible', year: 1996 },
        { season: null, episode: null, title: 'Mission: Impossible' },
        'mkv',
      ),
    ).toBe('/media/Films/Mission - Impossible (1996)/Mission - Impossible (1996).mkv');
  });

  it('files an episode in a folder for its season', () => {
    expect(
      libraryFileOf(
        { ...NOWHERE_YET, libraryPath: '/media/Series', title: 'Severance', year: 2022 },
        { season: 1, episode: 2, title: 'Half Loop' },
        'mp4',
      ),
    ).toBe('/media/Series/Severance (2022)/Season 01/Severance (2022) - S01E02 - Half Loop.mp4');
  });

  it('leaves out a title an episode does not have yet, and a year a series does not', () => {
    expect(
      libraryFileOf(
        { ...NOWHERE_YET, libraryPath: '/media/Series', title: 'Severance', year: null },
        { season: 0, episode: 1, title: '' },
        'mkv',
      ),
    ).toBe('/media/Series/Severance/Season 00/Severance - S00E01.mkv');
  });

  it('says what a copy is on the file, and never on the folder around it', () => {
    expect(
      libraryFileOf(
        { ...NOWHERE_YET, libraryPath: '/media/Films', title: 'Dune', year: 2021 },
        { season: null, episode: null, title: 'Dune' },
        'mkv',
        ' [2160p][Remux][x265]',
      ),
    ).toBe('/media/Films/Dune (2021)/Dune (2021) [2160p][Remux][x265].mkv');

    expect(
      libraryFileOf(
        { ...NOWHERE_YET, libraryPath: '/media/Series', title: 'Severance', year: 2022 },
        { season: 1, episode: 2, title: 'Half Loop' },
        'mkv',
        ' [1080p][WEBDL]',
      ),
    ).toBe(
      '/media/Series/Severance (2022)/Season 01/Severance (2022) - S01E02 - Half Loop [1080p][WEBDL].mkv',
    );
  });

  it('files an episode into the folders the library already keeps the series in', () => {
    const kept = {
      libraryPath: '/media/Series',
      libraryFolder: '/media/Series/Show',
      seasonFolders: [
        { season: 1, folder: '/media/Series/Show' },
        { season: 2, folder: '/media/Series/Show/Season 2' },
      ],
      title: 'Show',
      year: 2019,
    };

    expect(libraryFileOf(kept, { season: 1, episode: 9, title: 'Nine' }, 'mkv')).toBe(
      '/media/Series/Show/Show - S01E09 - Nine.mkv',
    );
    expect(libraryFileOf(kept, { season: 2, episode: 3, title: '' }, 'mkv')).toBe(
      '/media/Series/Show/Season 2/Show - S02E03.mkv',
    );
    expect(libraryFileOf(kept, { season: 3, episode: 1, title: '' }, 'mkv')).toBe(
      '/media/Series/Show/Season 3/Show - S03E01.mkv',
    );
  });

  it('names a film’s further version as Jellyfin does, its quality set off by a dash', () => {
    expect(
      libraryFileOf(
        { ...NOWHERE_YET, libraryPath: '/media/Films', title: 'A Film', year: 2021 },
        {
          season: null,
          episode: null,
          title: 'A Film',
          versionProfileId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        },
        'mkv',
        ' [2160p][Bluray]',
      ),
    ).toBe('/media/Films/A Film (2021)/A Film (2021) - [2160p][Bluray].mkv');
  });
});
