import { describe, expect, it } from 'vitest';
import { readNfoIds } from './readNfoIds';

describe('readNfoIds', () => {
  it('reads the unique identifiers Jellyfin and Kodi write', () => {
    expect(
      readNfoIds(
        '<movie><uniqueid type="tmdb">603</uniqueid><uniqueid type="imdb" default="true">tt0133093</uniqueid></movie>',
      ),
    ).toEqual({ tmdb: '603', imdb: 'tt0133093', tvdb: null });
  });

  it('reads the older named tags', () => {
    expect(
      readNfoIds(
        '<tvshow><tmdbid>1400</tmdbid><tvdbid>79349</tvdbid><imdb_id>tt0386676</imdb_id></tvshow>',
      ),
    ).toEqual({ tmdb: '1400', imdb: 'tt0386676', tvdb: '79349' });
  });

  it('reads an IMDb identifier kept in the plain id tag', () => {
    expect(readNfoIds('<movie><id>tt0133093</id></movie>').imdb).toBe('tt0133093');
  });

  it('reads a file that is nothing but a link', () => {
    expect(readNfoIds('https://www.imdb.com/title/tt0133093/')).toEqual({
      tmdb: null,
      imdb: 'tt0133093',
      tvdb: null,
    });
    expect(readNfoIds('https://www.themoviedb.org/tv/1400-seinfeld').tmdb).toBe('1400');
  });

  it('reads nothing from a file holding no identifier', () => {
    expect(readNfoIds('<movie><title>Heat</title></movie>')).toEqual({
      tmdb: null,
      imdb: null,
      tvdb: null,
    });
  });
});
