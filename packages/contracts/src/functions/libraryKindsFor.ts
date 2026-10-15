import { libraryKindOf } from '@ValenceContracts/functions/libraryKindOf';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The kinds of library a request may be filed into, the best first: anime, a series or a film,
 * into an anime library and otherwise among the shows or films, and anything else into the one
 * kind of library that holds it.
 *
 * @param kind - What was asked for.
 * @param isAnime - Whether it is anime.
 * @returns The kinds of library, the one to look for first leading.
 */
const libraryKindsFor = (kind: MediaRequestKind, isAnime: boolean): LibraryKind[] =>
  isAnime && (kind === 'series' || kind === 'film')
    ? ['anime', libraryKindOf(kind)]
    : [libraryKindOf(kind)];

export { libraryKindsFor };
