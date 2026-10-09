import type { LibraryKind } from '@ValenceContracts/schemas/Library';

/**
 * Whether a library holds things to watch, films, shows and anime alike, rather than music or
 * books.
 *
 * @param kind - The kind of library.
 * @returns Whether it does.
 */
const isVideoKind = (kind: LibraryKind): kind is 'movies' | 'shows' | 'anime' =>
  kind === 'movies' || kind === 'shows' || kind === 'anime';

export { isVideoKind };
