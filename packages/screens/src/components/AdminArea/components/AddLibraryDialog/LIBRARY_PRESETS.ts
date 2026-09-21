import type { LibraryKind } from '@ValenceContracts/schemas/Library';

const LIBRARY_PRESETS = [
  { id: 'movies', label: 'Movies', kind: 'movies', flavour: null },
  { id: 'shows', label: 'Shows', kind: 'shows', flavour: null },
  { id: 'anime', label: 'Anime', kind: 'shows', flavour: 'Anime' },
  { id: 'music', label: 'Music', kind: 'music', flavour: null },
  { id: 'books', label: 'Books', kind: 'books', flavour: null },
  { id: 'manga', label: 'Manga', kind: 'books', flavour: 'Manga' },
] as const satisfies readonly {
  id: string;
  label: string;
  kind: LibraryKind;
  flavour: string | null;
}[];

export { LIBRARY_PRESETS };
