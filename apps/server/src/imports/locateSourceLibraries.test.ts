import { describe, expect, it } from 'vitest';
import { locateSourceLibraries } from './locateSourceLibraries';

describe('locateSourceLibraries', () => {
  it('places each folder in Valence and finds the library holding it', () => {
    const located = locateSourceLibraries(
      [
        { id: 'films', name: 'Films', kind: 'movies', locations: ['/data/movies'] },
        { id: 'tv', name: 'TV', kind: 'shows', locations: ['/data/tv', '/data/kids'] },
      ],
      [{ from: '/data', to: '/media' }],
      [
        { id: 'valence-films', path: '/media/movies/' },
        { id: 'valence-cartoons', path: '/media/kids/cartoons' },
        { id: 'remembered', path: '/somewhere/else' },
      ],
      new Map([
        ['tv|/data/tv', 'remembered'],
        ['films|/data/movies', 'gone'],
      ]),
    );

    expect(located).toEqual([
      {
        sourceLibraryId: 'films',
        name: 'Films',
        kind: 'movies',
        locations: [
          { sourcePath: '/data/movies', valencePath: '/media/movies', libraryId: 'valence-films' },
        ],
      },
      {
        sourceLibraryId: 'tv',
        name: 'TV',
        kind: 'shows',
        locations: [
          { sourcePath: '/data/tv', valencePath: '/media/tv', libraryId: 'remembered' },
          { sourcePath: '/data/kids', valencePath: '/media/kids', libraryId: 'valence-cartoons' },
        ],
      },
    ]);
  });

  it('places nothing where no library holds the folder', () => {
    const [library] = locateSourceLibraries(
      [{ id: 'm', name: 'M', kind: 'music', locations: ['/music'] }],
      [],
      [],
      new Map(),
    );

    expect(library?.locations[0]?.libraryId).toBeNull();
  });
});
