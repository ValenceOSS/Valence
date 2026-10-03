import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

const LIBRARY_KIND_NAMES: Readonly<Record<LibraryKind, string>> = {
  movies: say('common.movies'),
  shows: say('common.shows'),
  music: say('common.music'),
  books: say('common.books'),
};

export { LIBRARY_KIND_NAMES };
