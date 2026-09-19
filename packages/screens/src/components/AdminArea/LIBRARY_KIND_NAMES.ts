import type { LibraryKind } from '@ValenceContracts/schemas/Library';

const LIBRARY_KIND_NAMES: Readonly<Record<LibraryKind, { label: string; one: string }>> = {
  movies: { label: 'Films', one: 'a film' },
  shows: { label: 'Series', one: 'a series' },
  music: { label: 'Music', one: 'music' },
  books: { label: 'Books', one: 'a book' },
};

export { LIBRARY_KIND_NAMES };
