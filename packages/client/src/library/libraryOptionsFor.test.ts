import { describe, expect, it } from 'vitest';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import { libraryOptionsFor } from './libraryOptionsFor';

const FILMS = aLinkedServerFace();

describe('libraryOptionsFor', () => {
  it('offers all of them and then each, where every library is this server’s own', () => {
    const options = libraryOptionsFor(
      [aLibrary({ id: 'a', name: 'Films' }), aLibrary({ id: 'b', name: 'Anime' })],
      [],
      'all',
      'All film libraries',
    );

    expect(options).toEqual([
      { id: 'all', label: 'All film libraries', shortLabel: 'All film libraries', isNested: false },
      { id: 'a', label: 'Films', shortLabel: 'Films', isNested: false },
      { id: 'b', label: 'Anime', shortLabel: 'Anime', isNested: false },
    ]);
  });

  it('offers each server as a choice of all it holds, this server’s own first, its libraries beneath', () => {
    const options = libraryOptionsFor(
      [
        aLibrary({ id: 'theirs', name: 'Cinema', linkedServerId: FILMS.id }),
        aLibrary({ id: 'mine', name: 'Films' }),
      ],
      [FILMS],
      'all',
      'All film libraries',
    );

    expect(options).toEqual([
      { id: 'all', label: 'Everywhere', shortLabel: 'Everywhere', isNested: false },
      { id: 'here', label: 'Here', shortLabel: 'This server', isNested: false },
      { id: 'mine', label: 'Films', shortLabel: 'Films', isNested: true },
      { id: `from:${FILMS.id}`, label: 'Films', shortLabel: 'Films', isNested: false },
      { id: 'theirs', label: 'Cinema · Films', shortLabel: 'Cinema', isNested: true },
    ]);
  });

  it('sets every library a server holds beneath it', () => {
    const options = libraryOptionsFor(
      [
        aLibrary({ id: 'mine', name: 'Shows' }),
        aLibrary({ id: 'shows', name: 'Shows', linkedServerId: FILMS.id }),
        aLibrary({ id: 'anime', name: 'Anime', linkedServerId: FILMS.id }),
      ],
      [FILMS],
      'all',
      'All programme libraries',
    );

    expect(options).toEqual([
      { id: 'all', label: 'Everywhere', shortLabel: 'Everywhere', isNested: false },
      { id: 'here', label: 'Here', shortLabel: 'This server', isNested: false },
      { id: 'mine', label: 'Shows', shortLabel: 'Shows', isNested: true },
      { id: `from:${FILMS.id}`, label: 'Films', shortLabel: 'Films', isNested: false },
      { id: 'shows', label: 'Shows · Films', shortLabel: 'Shows', isNested: true },
      { id: 'anime', label: 'Anime · Films', shortLabel: 'Anime', isNested: true },
    ]);
  });

  it('offers no choice of a server it does not know, nor this server where it holds none', () => {
    const options = libraryOptionsFor(
      [aLibrary({ id: 'theirs', name: 'Cinema', linkedServerId: 'gone' })],
      [],
      'all',
      'All',
    );

    expect(options.map((option) => option.id)).toEqual(['all', 'theirs']);
    expect(options.at(-1)?.label).toBe('Cinema');
  });
});
