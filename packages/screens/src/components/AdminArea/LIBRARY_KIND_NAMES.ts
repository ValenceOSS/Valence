import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

const LIBRARY_KIND_NAMES: Readonly<Record<LibraryKind, { label: string; one: string }>> = {
  movies: { label: say('common.films'), one: say('common.aFilm') },
  shows: { label: say('common.series'), one: say('common.aSeries') },
  music: { label: say('common.music'), one: 'music' },
  books: { label: say('common.books'), one: say('screens.adminArea.libraryKindNames.aBook') },
};

export { LIBRARY_KIND_NAMES };
