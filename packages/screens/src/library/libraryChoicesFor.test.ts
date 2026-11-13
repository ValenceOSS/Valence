import { describe, expect, it, vi } from 'vitest';
import { libraryChoicesFor } from '@ValenceScreens/library/libraryChoicesFor';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import type { Library } from '@ValenceContracts/schemas/Library';

const library = (id: string, kind: Library['kind']): Library =>
  aLibrary({ id, name: id, kind, path: `/${id}` });

describe('libraryChoicesFor', () => {
  it('offers nothing where there is a single library of a kind', () => {
    expect(
      libraryChoicesFor([library('a', 'movies'), library('b', 'shows')], [], null, null, vi.fn()),
    ).toEqual({});
  });

  it('offers a choice for the films once there are several film libraries', () => {
    const choices = libraryChoicesFor(
      [library('a', 'movies'), library('b', 'movies'), library('c', 'shows')],
      [],
      null,
      null,
      vi.fn(),
    );

    expect(choices.films?.options.map((option) => option.id)).toEqual(['all', 'a', 'b']);
    expect(choices.shows).toBeUndefined();
  });

  it('offers anime libraries beside series ones, under the programmes place', () => {
    const choices = libraryChoicesFor(
      [library('a', 'shows'), library('b', 'anime')],
      [],
      null,
      null,
      vi.fn(),
    );

    expect(choices.shows?.options.map((option) => option.id)).toEqual(['all', 'a', 'b']);
  });

  it('marks the library the address names, and all of them otherwise', () => {
    const libraries = [library('a', 'movies'), library('b', 'movies')];

    expect(libraryChoicesFor(libraries, [], null, 'b', vi.fn()).films?.selectedId).toBe('b');
    expect(libraryChoicesFor(libraries, [], null, null, vi.fn()).films?.selectedId).toBe('all');
    expect(libraryChoicesFor(libraries, [], null, 'elsewhere', vi.fn()).films?.selectedId).toBe(
      'all',
    );
  });

  it('reports all of them as null, and one library by its id, with the place it was chosen for', () => {
    const onSelect = vi.fn();
    const choices = libraryChoicesFor(
      [library('a', 'shows'), library('b', 'shows')],
      [],
      null,
      null,
      onSelect,
    );

    choices.shows?.onSelect('b');
    choices.shows?.onSelect('all');

    expect(onSelect).toHaveBeenNthCalledWith(1, 'b', 'shows');
    expect(onSelect).toHaveBeenNthCalledWith(2, null, 'shows');
  });

  it('offers a choice for books once there are several book libraries, under the reading place', () => {
    const choices = libraryChoicesFor(
      [library('a', 'books'), library('b', 'books'), library('c', 'movies')],
      [],
      null,
      'b',
      vi.fn(),
    );

    expect(choices.read?.label).toBe('Book library');
    expect(choices.read?.options.map((option) => option.label)).toEqual([
      'All book libraries',
      'a',
      'b',
    ]);
    expect(choices.read?.selectedId).toBe('b');
    expect(choices.films).toBeUndefined();
  });

  it('offers nothing for books where there is a single book library', () => {
    expect(
      libraryChoicesFor([library('a', 'books')], [], null, null, vi.fn()).read,
    ).toBeUndefined();
  });

  it('says where, where some film libraries come from a linked server', () => {
    const films = aLinkedServerFace();
    const choices = libraryChoicesFor(
      [
        library('a', 'movies'),
        library('b', 'movies'),
        aLibrary({ id: 'c', name: 'Cinema', linkedServerId: films.id }),
      ],
      [films],
      null,
      `from:${films.id}`,
      vi.fn(),
    );

    expect(choices.films?.options.map((option) => [option.label, option.isNested])).toEqual([
      ['Everywhere', false],
      ['This server', false],
      ['a', true],
      ['b', true],
      ['Films', false],
      ['Cinema', true],
    ]);
    expect(choices.films?.selectedId).toBe(`from:${films.id}`);
  });

  it('shows each server by its face, and no library by one', () => {
    const films = aLinkedServerFace();
    const choices = libraryChoicesFor(
      [
        library('a', 'movies'),
        library('b', 'movies'),
        aLibrary({ id: 'c', name: 'Cinema', linkedServerId: films.id }),
      ],
      [films],
      { name: 'Home', colour: '#3a8ee8', pictureAt: null },
      null,
      vi.fn(),
    );

    expect(choices.films?.options.map((option) => option.icon !== undefined)).toEqual([
      false,
      true,
      false,
      false,
      true,
      false,
    ]);
  });

  it('draws this server without a face, from a server too old to say how it is shown', () => {
    const films = aLinkedServerFace();
    const choices = libraryChoicesFor(
      [library('a', 'movies'), aLibrary({ id: 'c', name: 'Cinema', linkedServerId: films.id })],
      [films],
      null,
      null,
      vi.fn(),
    );

    expect(choices.films?.options.find((option) => option.id === 'here')?.icon).toBeUndefined();
  });
});
