import { describe, expect, it } from 'vitest';
import { splitArtists } from './splitArtists';

describe('splitArtists', () => {
  it('credits a guest named after feat.', () => {
    expect(splitArtists(['Drake feat. Rihanna'])).toEqual(['Drake', 'Rihanna']);
    expect(splitArtists(['Drake ft. Rihanna'])).toEqual(['Drake', 'Rihanna']);
  });

  it('reads several values as several artists', () => {
    expect(splitArtists(['Daft Punk', 'Pharrell Williams'])).toEqual([
      'Daft Punk',
      'Pharrell Williams',
    ]);
  });

  it('splits a list separated the way taggers separate them', () => {
    expect(splitArtists(['A; B / C'])).toEqual(['A', 'B', 'C']);
  });

  it('leaves an act with an ampersand in its name alone', () => {
    expect(splitArtists(['Simon & Garfunkel'])).toEqual(['Simon & Garfunkel']);
  });

  it('names each artist once', () => {
    expect(splitArtists(['Sleep Token', 'sleep token'])).toEqual(['Sleep Token']);
  });

  it('drops the brackets a guest credit is often wrapped in', () => {
    expect(splitArtists(['Ali Gatie (feat. Someone)'])).toEqual(['Ali Gatie', 'Someone']);
  });

  it('credits nobody where nothing was tagged', () => {
    expect(splitArtists(['', '  '])).toEqual([]);
  });
});
