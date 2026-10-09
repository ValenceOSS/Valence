import type { DownloadCategories } from '@ValenceContracts/schemas/DownloadClient';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

/**
 * Which of a download client's categories a library's downloads go under: anime under the
 * series one, since a client tells series apart from films and not one kind of series from
 * another.
 *
 * @param kind - The kind of library.
 * @returns The category's kind.
 */
const categoryKindOf = (kind: LibraryKind): keyof DownloadCategories =>
  kind === 'anime' ? 'shows' : kind;

export { categoryKindOf };
