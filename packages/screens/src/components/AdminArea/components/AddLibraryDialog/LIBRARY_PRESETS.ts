import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { StringKey } from '@ValenceI18n/StringKey';

const LIBRARY_PRESETS = [
  { id: 'movies', labelKey: 'admin.libraryPresets.movies', kind: 'movies', flavour: null },
  { id: 'shows', labelKey: 'admin.libraryPresets.shows', kind: 'shows', flavour: null },
  // eslint-disable-next-line valence/no-hard-coded-strings -- saved on the library as its flavour, the name the server files it under, and drawn from there
  { id: 'anime', labelKey: 'admin.libraryPresets.anime', kind: 'shows', flavour: 'Anime' },
  { id: 'music', labelKey: 'admin.libraryPresets.music', kind: 'music', flavour: null },
  { id: 'books', labelKey: 'admin.libraryPresets.books', kind: 'books', flavour: null },
  // eslint-disable-next-line valence/no-hard-coded-strings -- saved on the library as its flavour, the name the server files it under, and drawn from there
  { id: 'manga', labelKey: 'admin.libraryPresets.manga', kind: 'books', flavour: 'Manga' },
] as const satisfies readonly {
  id: string;
  labelKey: StringKey;
  kind: LibraryKind;
  flavour: string | null;
}[];

export { LIBRARY_PRESETS };
