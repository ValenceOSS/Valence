import {
  BookOpen as BookOpenIcon,
  Film as FilmIcon,
  MusicNote as MusicNoteIcon,
  Sparkles as SparklesIcon,
  Tv as TvIcon,
} from '@keyline-icons/react/fill';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { say } from '@ValenceI18n/say';

const LIBRARY_KIND_NAMES: Readonly<Record<LibraryKind, { label: string; icon: IconGlyph }>> = {
  movies: { label: say('common.films'), icon: FilmIcon },
  shows: { label: say('common.series'), icon: TvIcon },
  anime: { label: say('common.anime'), icon: SparklesIcon },
  music: { label: say('common.music'), icon: MusicNoteIcon },
  books: { label: say('common.books'), icon: BookOpenIcon },
};

export { LIBRARY_KIND_NAMES };
