import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { StringKey } from '@ValenceI18n/StringKey';

const LIBRARY_KIND_NAMES: Readonly<
  Record<LibraryKind, { labelKey: StringKey; oneKey: StringKey }>
> = {
  movies: { labelKey: 'admin.libraryKindNames.movies', oneKey: 'admin.libraryKindNames.aFilm' },
  shows: { labelKey: 'admin.libraryKindNames.shows', oneKey: 'admin.libraryKindNames.aSeries' },
  music: { labelKey: 'admin.libraryKindNames.music', oneKey: 'admin.libraryKindNames.someMusic' },
  books: { labelKey: 'admin.libraryKindNames.books', oneKey: 'admin.libraryKindNames.aBook' },
};

export { LIBRARY_KIND_NAMES };
