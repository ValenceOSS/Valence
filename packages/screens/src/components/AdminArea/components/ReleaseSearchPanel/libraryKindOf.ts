import type { IndexerSearchMode, Release } from '@ValenceContracts/schemas/Indexer';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

const BY_MODE: Readonly<Partial<Record<IndexerSearchMode, LibraryKind>>> = {
  movie: 'movies',
  tv: 'shows',
  music: 'music',
  book: 'books',
};

const BY_CATEGORY: Readonly<Record<number, LibraryKind>> = {
  2: 'movies',
  3: 'music',
  5: 'shows',
  7: 'books',
};

/**
 * Which kind of library a release is for: what was searched for where that says, and otherwise the
 * standard Newznab categories the indexer filed it under — 2000s films, 3000s audio, 5000s TV and
 * 7000s books — where they all agree.
 *
 * @param release - The release.
 * @param mode - What kind of thing was searched for.
 * @returns The kind, or null where nothing says.
 */
const libraryKindOf = (release: Release, mode: IndexerSearchMode): LibraryKind | null => {
  const searched = BY_MODE[mode];

  if (searched !== undefined) {
    return searched;
  }

  const filed = new Set(
    release.categories
      .filter((category) => category >= 1000 && category < 10_000)
      .map((category) => BY_CATEGORY[Math.floor(category / 1000)]),
  );
  const [only] = filed;

  return filed.size === 1 && only !== undefined ? only : null;
};

export { libraryKindOf };
