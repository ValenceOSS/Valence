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
      { id: 'all', label: 'All film libraries' },
      { id: 'a', label: 'Films' },
      { id: 'b', label: 'Anime' },
    ]);
  });

  it('says where, and names each linked library with its server after this server’s own', () => {
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
      { id: 'all', label: 'Everywhere' },
      { id: 'here', label: 'Here' },
      { id: `from:${FILMS.id}`, label: 'Films' },
      { id: 'mine', label: 'Films' },
      { id: 'theirs', label: 'Cinema · Films' },
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
