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
      { id: 'all', label: 'All film libraries', shortLabel: 'All film libraries', group: null },
      { id: 'a', label: 'Films', shortLabel: 'Films', group: null },
      { id: 'b', label: 'Anime', shortLabel: 'Anime', group: null },
    ]);
  });

  it('says where, and heads each linked library with its server after this server’s own', () => {
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
      { id: 'all', label: 'Everywhere', shortLabel: 'Everywhere', group: null },
      { id: 'here', label: 'Here', shortLabel: 'All', group: 'This server' },
      { id: 'mine', label: 'Films', shortLabel: 'Films', group: 'This server' },
      { id: `from:${FILMS.id}`, label: 'Films', shortLabel: 'All', group: 'Films' },
      { id: 'theirs', label: 'Cinema · Films', shortLabel: 'Cinema', group: 'Films' },
    ]);
  });

  it('offers no choice of a server it does not know, and names its library plainly', () => {
    const options = libraryOptionsFor(
      [aLibrary({ id: 'theirs', name: 'Cinema', linkedServerId: 'gone' })],
      [],
      'all',
      'All',
    );

    expect(options.map((option) => option.id)).toEqual(['all', 'here', 'theirs']);
    expect(options.at(-1)?.label).toBe('Cinema');
  });
});
