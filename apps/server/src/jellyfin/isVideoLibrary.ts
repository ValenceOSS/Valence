import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * Whether a library holds what Jellyfin's apps play here: films or programmes, rather than music
 * or books.
 *
 * @param library - The library.
 * @returns Whether it is shown to them.
 */
const isVideoLibrary = (library: Pick<Library, 'kind'>): boolean =>
  library.kind === 'movies' || library.kind === 'shows' || library.kind === 'anime';

export { isVideoLibrary };
