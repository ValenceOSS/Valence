import { describe, expect, it } from 'vitest';
import { patternPathOf } from './patternPathOf';

const FILM = {
  libraryPath: '/films',
  extension: 'mkv',
  title: 'A Film: Part 2?',
  year: 2001,
  versionLabel: null,
  quality: null,
  idTag: null,
  series: null,
};

describe('patternPathOf', () => {
  it('files a film as its title and year inside a folder of the same name, safe for any disk', () => {
    expect(patternPathOf(FILM)).toBe('/films/A Film - Part 2 (2001)/A Film - Part 2 (2001).mkv');
    expect(patternPathOf({ ...FILM, versionLabel: 'Extended Cut', idTag: '[tmdbid-1]' })).toBe(
      '/films/A Film - Part 2 (2001) [tmdbid-1]/A Film - Part 2 (2001) - Extended Cut.mkv',
    );
    expect(patternPathOf({ ...FILM, quality: 'Remux-2160p' })).toBe(
      '/films/A Film - Part 2 (2001)/A Film - Part 2 (2001) Remux-2160p.mkv',
    );
  });

  it('files an episode in its show’s and its season’s folders, a file of several by its range', () => {
    expect(
      patternPathOf({
        ...FILM,
        libraryPath: '/shows',
        extension: 'mp4',
        title: 'Pilot',
        series: { title: 'A Show', year: 2010, season: 1, episode: 1, lastEpisode: 2 },
      }),
    ).toBe('/shows/A Show (2010)/Season 01/A Show (2010) - S01E01-E02 - Pilot.mp4');
    expect(
      patternPathOf({
        ...FILM,
        libraryPath: '/shows',
        title: '',
        idTag: '{tvdb-2}',
        series: { title: 'A Show', year: null, season: 0, episode: 3, lastEpisode: null },
      }),
    ).toBe('/shows/A Show {tvdb-2}/Season 00/A Show - S00E03.mkv');
  });
});
