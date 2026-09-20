import {
  Add01Icon,
  Book02Icon,
  FavouriteIcon,
  FilmRoll01Icon,
  Home01Icon,
  MusicNote01Icon,
  Search01Icon,
  Tv01Icon,
} from '@hugeicons/core-free-icons';
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
    icon: Home01Icon,
  },
  {
    section: 'films',
    title: 'Films',
    detail:
      'Every film in the library. Press one to see more, watch it, or watch it with somebody.',
    icon: FilmRoll01Icon,
  },
  {
    section: 'shows',
    title: 'Shows',
    detail: 'Series and their seasons. Valence remembers which episode you are on.',
    icon: Tv01Icon,
  },
  {
    section: 'music',
    title: 'Music',
    detail:
      'Your music, with playlists, a queue you can drag into order, lyrics, and the option to play it on another device.',
    icon: MusicNote01Icon,
  },
  {
    section: 'read',
    title: 'Read',
    detail: 'Books and comics, with your place kept wherever you read them.',
    icon: Book02Icon,
  },
  {
    section: 'requests',
    title: 'Requests',
    detail: 'Ask for something that is not here yet and follow it until it arrives.',
    icon: Add01Icon,
  },
  {
    section: 'favourites',
    title: 'Favourites',
    detail: 'Press the heart on anything to keep it here, where it is easy to find again.',
    icon: FavouriteIcon,
  },
  {
    section: 'search',
    title: 'Search',
    detail: 'Look across films, shows, music and books at once.',
    icon: Search01Icon,
  },
];

export { TOUR_STOPS };
export type { TourStop };
