import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

const LIBRARY_KIND_NAMES: Readonly<Record<LibraryKind, { label: string }>> = {
  movies: { label: say('common.films') },
  shows: { label: say('common.series') },
  anime: { label: say('common.anime') },
  music: { label: say('common.music') },
  books: { label: say('common.books') },
};

export { LIBRARY_KIND_NAMES };
