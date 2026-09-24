import { describe, expect, it, vi } from 'vitest';
import { libraryChoicesFor } from '@ValenceScreens/library/libraryChoicesFor';
import type { Library } from '@ValenceContracts/schemas/Library';

const library = (id: string, kind: Library['kind']): Library => ({
  id,
  name: id,
  kind,
  path: `/${id}`,
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: false,
  requestProfileId: null,
  requestPath: null,
});

describe('libraryChoicesFor', () => {
  it('offers nothing where there is a single library of a kind', () => {
    expect(
      libraryChoicesFor([library('a', 'movies'), library('b', 'shows')], null, vi.fn()),
    ).toEqual({});
  });

  it('offers a choice for the films once there are several film libraries', () => {
    const choices = libraryChoicesFor(
      [library('a', 'movies'), library('b', 'movies'), library('c', 'shows')],
      null,
      vi.fn(),
    );

    expect(choices.films?.options.map((option) => option.id)).toEqual(['all', 'a', 'b']);
    expect(choices.shows).toBeUndefined();
  });

  it('marks the library the address names, and all of them otherwise', () => {
    const libraries = [library('a', 'movies'), library('b', 'movies')];

    expect(libraryChoicesFor(libraries, 'b', vi.fn()).films?.selectedId).toBe('b');
    expect(libraryChoicesFor(libraries, null, vi.fn()).films?.selectedId).toBe('all');
    expect(libraryChoicesFor(libraries, 'elsewhere', vi.fn()).films?.selectedId).toBe('all');
  });

  it('reports all of them as null, and one library by its id, with the place it was chosen for', () => {
    const onSelect = vi.fn();
    const choices = libraryChoicesFor(
      [library('a', 'shows'), library('b', 'shows')],
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
    expect(libraryChoicesFor([library('a', 'books')], null, vi.fn()).read).toBeUndefined();
  });
});
