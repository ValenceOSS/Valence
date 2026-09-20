import {
  Book as BookIcon,
  Heart as HeartIcon,
  Home as HomeIcon,
  Monitor as MonitorIcon,
  MusicNote as MusicNoteIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Tape as TapeIcon,
} from '@keyline-icons/react';
import type { Place } from '@ValenceClient/navigation/readLocation';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type TourStop = {
  section: Place['section'];
  title: string;
  detail: string;
  icon: IconGlyph;
};

const TOUR_STOPS: readonly TourStop[] = [
  {
    section: 'home',
    title: 'Home',
    detail:
      'Pick up where you left off, see what has just been added, and find something to watch next.',
    icon: HomeIcon,
  },
  {
    section: 'films',
    title: 'Films',
    detail:
      'Every film in the library. Press one to see more, watch it, or watch it with somebody.',
    icon: TapeIcon,
  },
  {
    section: 'shows',
    title: 'Shows',
    detail: 'Series and their seasons. Valence remembers which episode you are on.',
    icon: MonitorIcon,
  },
  {
    section: 'music',
    title: 'Music',
    detail:
      'Your music, with playlists, a queue you can drag into order, lyrics, and the option to play it on another device.',
    icon: MusicNoteIcon,
  },
  {
    section: 'read',
    title: 'Read',
    detail: 'Books and comics, with your place kept wherever you read them.',
    icon: BookIcon,
  },
  {
    section: 'requests',
    title: 'Requests',
    detail: 'Ask for something that is not here yet and follow it until it arrives.',
    icon: PlusIcon,
  },
  {
    section: 'favourites',
    title: 'Favourites',
    detail: 'Press the heart on anything to keep it here, where it is easy to find again.',
    icon: HeartIcon,
  },
  {
    section: 'search',
    title: 'Search',
    detail: 'Look across films, shows, music and books at once.',
    icon: SearchIcon,
  },
];

export { TOUR_STOPS };
export type { TourStop };
