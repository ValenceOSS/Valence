import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

const LIBRARY_PRESETS = [
  { id: 'movies', label: say('common.movies'), kind: 'movies', flavour: null },
  { id: 'shows', label: say('common.shows'), kind: 'shows', flavour: null },
  { id: 'anime', label: say('common.anime'), kind: 'anime', flavour: null },
  { id: 'music', label: say('common.music'), kind: 'music', flavour: null },
  { id: 'books', label: say('common.books'), kind: 'books', flavour: null },
  {
    id: 'manga',
    label: say('screens.addLibraryDialog.libraryPresets.manga'),
    kind: 'books',
    flavour: say('screens.addLibraryDialog.libraryPresets.manga'),
  },
] as const satisfies readonly {
  id: string;
  label: string;
  kind: LibraryKind;
  flavour: string | null;
}[];

export { LIBRARY_PRESETS };
