import { isEpisodicKind } from '@ValenceContracts/functions/isEpisodicKind';
import { fetchLibraries, fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import { fetchShows } from '@ValenceClient/library/fetchShows';
import { fetchAlbums } from '@ValenceClient/music/fetchMusic';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { Surprise } from './pickAnything.types';

type Shelf = {
  total: number;
  at: (index: number) => Promise<Surprise | null>;
};

/**
 * Builds what a programmes library offers the randomiser: whole series rather than episodes, since
 * being handed episode four of something unseen is not a suggestion.
 *
 * @param libraryId - The library's items.
 * @returns The programmes worth offering.
 */
const shelfOfShows = async (libraryId: string): Promise<Shelf> => {
  const shows = await fetchShows(libraryId).catch(() => []);

  return {
    total: shows.length,
    at: (index) => {
      const found = shows[index];

      return Promise.resolve(found === undefined ? null : { kind: 'show', showId: found.id });
    },
  };
};

/**
 * Builds what any other library offers the randomiser, where each item is its own thing and needs no
 * collapsing.
 *
 * @param libraryId - The library's items.
 * @returns The items worth offering.
 */
const shelfOfItems = async (libraryId: string): Promise<Shelf> => {
  const total = await fetchLibraryItems(libraryId, { limit: 1 })
    .then((page) => page.total)
    .catch(() => 0);

  return {
    total,
    at: async (index) => {
      const page = await fetchLibraryItems(libraryId, { limit: 1, offset: index });
      const found = page.items[0];

      return found === undefined ? null : { kind: 'item', item: found };
    },
  };
};

/**
 * Every album in the music libraries this profile can see, as one shelf: music is kept as albums
 * rather than as a library's items, which a music library has none of.
 *
 * @returns The shelf.
 */
const shelfOfAlbums = async (): Promise<Shelf> => {
  const albums = await fetchAlbums().catch(() => []);

  return {
    total: albums.length,
    at: (index) => {
      const found = albums[index];

      return Promise.resolve(found === undefined ? null : { kind: 'album', albumId: found.id });
    },
  };
};

/**
 * Chooses something at random, from a kind of library or from all of them. Programmes are offered
 * as programmes, music as an album, and everything else as itself, so the answer is always
 * something somebody could start now.
 *
 * @param only - The libraries to choose from, and which kind to narrow to where one was asked
 *   for.
 * @returns Something to watch, or null where there is nothing to choose from.
 */
const pickAnything = async (only?: LibraryKind): Promise<Surprise | null> => {
  try {
    const libraries = await fetchLibraries();
    const wanted = only === undefined ? libraries : libraries.filter((one) => one.kind === only);

    const hasMusic = wanted.some((entry) => entry.kind === 'music');
    const shelves = await Promise.all([
      ...wanted
        .filter((entry) => entry.kind !== 'music')
        .map(async (entry) =>
          isEpisodicKind(entry.kind)
            ? shelfOfShows(entry.id).catch(() => ({ total: 0, at: () => Promise.resolve(null) }))
            : shelfOfItems(entry.id).catch(() => ({ total: 0, at: () => Promise.resolve(null) })),
        ),
      ...(hasMusic ? [shelfOfAlbums()] : []),
    ]);

    const total = shelves.reduce((held, shelf) => held + shelf.total, 0);

    if (total === 0) {
      return null;
    }

    let at = Math.floor(Math.random() * total);

    for (const shelf of shelves) {
      if (at < shelf.total) {
        return await shelf.at(at);
      }

      at -= shelf.total;
    }

    return null;
  } catch {
    return null;
  }
};

export { pickAnything };
