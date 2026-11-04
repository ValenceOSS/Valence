import { describe, expect, it } from 'vitest';
import { addressOfId } from './addressOfId';

describe('addressOfId', () => {
  it('finds a title on each site by its id', () => {
    expect(addressOfId('imdbId', 'tt0133093', false)).toBe('https://www.imdb.com/title/tt0133093/');
    expect(addressOfId('tmdb', '603', false)).toBe('https://www.themoviedb.org/movie/603');
    expect(addressOfId('tmdb', '1399', true)).toBe('https://www.themoviedb.org/tv/1399');
    expect(addressOfId('tvdbId', '121361', true)).toBe(
      'https://thetvdb.com/dereferrer/series/121361',
    );
  });

  it('opens nothing for an id the site would not know', () => {
    expect(addressOfId('imdbId', '603', false)).toBeNull();
    expect(addressOfId('tvdbId', 'tt1', true)).toBeNull();
  });
});
