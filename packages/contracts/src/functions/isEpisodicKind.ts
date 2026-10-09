import type { LibraryKind } from '@ValenceContracts/schemas/Library';

/**
 * Whether a library holds series of episodes, shows and anime alike, which are scanned, matched,
 * filed and shown as series.
 *
 * @param kind - The kind of library.
 * @returns Whether it does.
 */
const isEpisodicKind = (kind: LibraryKind): kind is 'shows' | 'anime' =>
  kind === 'shows' || kind === 'anime';

export { isEpisodicKind };
