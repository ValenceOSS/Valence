import { describe, expect, it } from 'vitest';
import { LIBRARIES } from '@ValenceRequests/arrImport/testing/LIBRARIES';
import { libraryForPath } from './libraryForPath';

const MAPPINGS = [
  { from: '/movies', to: '/media/Films' },
  { from: '/tv', to: '/media/Series' },
];

describe('libraryForPath', () => {
  it('finds the library a mapped folder is', () => {
    expect(libraryForPath('/movies/', 'movies', LIBRARIES, MAPPINGS)).toEqual({
      library: LIBRARIES[0],
      isGuessed: false,
    });
    expect(libraryForPath('/tv/Severance', 'shows', LIBRARIES, MAPPINGS)?.library.name).toBe(
      'Series',
    );
  });

  it('finds a library by the folder its requests are filed into, or a folder that holds it', () => {
    expect(libraryForPath('/media/Music/Requested', 'music', LIBRARIES, [])?.library.name).toBe(
      'Music',
    );
    expect(libraryForPath('/media', 'music', LIBRARIES, [])?.library.name).toBe('Music');
  });

  it('only looks among libraries of the kind asked for', () => {
    expect(libraryForPath('/movies', 'shows', LIBRARIES, MAPPINGS)).toBeNull();
  });

  it('guesses by the folder’s name where nothing is mapped, and only where one library fits', () => {
    expect(libraryForPath('/data/films', 'movies', LIBRARIES, [])).toEqual({
      library: LIBRARIES[0],
      isGuessed: true,
    });
    expect(libraryForPath('/data/elsewhere', 'movies', LIBRARIES, [])).toBeNull();
  });
});
