import { LibrarySchema } from '@ValenceContracts/schemas/Library';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { JellyfinIdBook } from '@ValenceClient/jellyfin/createJellyfinIdBook';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

/**
 * One of a Jellyfin user's views, as Valence describes a library: a library of films where
 * Jellyfin's holds films, and of programmes otherwise.
 *
 * @param view - The view.
 * @param book - How identifiers are turned.
 * @returns The library.
 */
const libraryOfJellyfinView = (view: JellyfinItem, book: JellyfinIdBook): Library =>
  LibrarySchema.parse({
    id: book.valenceIdOf(view.Id),
    name: view.Name ?? view.Id,
    kind: view.CollectionType === 'movies' ? 'movies' : 'shows',
    path: '/',
    itemCount: view.ChildCount ?? 0,
    lastScannedAt: null,
    defaultAudioLanguage: null,
    filesAtOnce: null,
  });

export { libraryOfJellyfinView };
