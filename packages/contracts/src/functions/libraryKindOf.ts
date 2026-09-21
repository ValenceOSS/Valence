import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

const LIBRARY_KINDS: Readonly<Record<MediaRequestKind, LibraryKind>> = {
  film: 'movies',
  series: 'shows',
  artist: 'music',
  album: 'music',
  book: 'books',
};

/**
 * Which kind of library a request of this kind is filed into: a film into films, a series into
 * programmes, an artist and an album alike into music, a book into books.
 *
 * @param kind - What was asked for.
 * @returns The kind of library it belongs in.
 */
const libraryKindOf = (kind: MediaRequestKind): LibraryKind => LIBRARY_KINDS[kind];

export { libraryKindOf };
