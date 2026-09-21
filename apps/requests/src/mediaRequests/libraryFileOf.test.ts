import { describe, expect, it } from 'vitest';
import { libraryFileOf } from './libraryFileOf';

describe('libraryFileOf', () => {
  it('files a film as its title and year, in a folder of the same name', () => {
    expect(
      libraryFileOf(
        { libraryPath: '/media/Films', title: 'Mission: Impossible', year: 1996 },
        { season: null, episode: null, title: 'Mission: Impossible' },
        'mkv',
      ),
    ).toBe('/media/Films/Mission - Impossible (1996)/Mission - Impossible (1996).mkv');
  });

  it('files an episode in a folder for its season', () => {
    expect(
      libraryFileOf(
        { libraryPath: '/media/Series', title: 'Severance', year: 2022 },
        { season: 1, episode: 2, title: 'Half Loop' },
        'mp4',
      ),
    ).toBe('/media/Series/Severance (2022)/Season 01/Severance (2022) - S01E02 - Half Loop.mp4');
  });

  it('leaves out a title an episode does not have yet, and a year a series does not', () => {
    expect(
      libraryFileOf(
        { libraryPath: '/media/Series', title: 'Severance', year: null },
        { season: 0, episode: 1, title: '' },
        'mkv',
      ),
    ).toBe('/media/Series/Severance/Season 00/Severance - S00E01.mkv');
  });

  it('says what a copy is on the file, and never on the folder around it', () => {
    expect(
      libraryFileOf(
        { libraryPath: '/media/Films', title: 'Dune', year: 2021 },
        { season: null, episode: null, title: 'Dune' },
        'mkv',
        ' [2160p][Remux][x265]',
      ),
    ).toBe('/media/Films/Dune (2021)/Dune (2021) [2160p][Remux][x265].mkv');

    expect(
      libraryFileOf(
        { libraryPath: '/media/Series', title: 'Severance', year: 2022 },
        { season: 1, episode: 2, title: 'Half Loop' },
        'mkv',
        ' [1080p][WEBDL]',
      ),
    ).toBe(
      '/media/Series/Severance (2022)/Season 01/Severance (2022) - S01E02 - Half Loop [1080p][WEBDL].mkv',
    );
  });
});
