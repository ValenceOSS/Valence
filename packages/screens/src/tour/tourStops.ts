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
import { say } from '@ValenceI18n/say';
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
    get title() {
      return say('screens.tourStops.homeTitle');
    },
    get detail() {
      return say('screens.tourStops.homeDetail');
    },
    icon: HomeIcon,
  },
  {
    section: 'films',
    get title() {
      return say('screens.tourStops.filmsTitle');
    },
    get detail() {
      return say('screens.tourStops.filmsDetail');
    },
    icon: TapeIcon,
  },
  {
    section: 'shows',
    get title() {
      return say('screens.tourStops.showsTitle');
    },
    get detail() {
      return say('screens.tourStops.showsDetail');
    },
    icon: MonitorIcon,
  },
  {
    section: 'music',
    get title() {
      return say('screens.tourStops.musicTitle');
    },
    get detail() {
      return say('screens.tourStops.musicDetail');
    },
    icon: MusicNoteIcon,
  },
  {
    section: 'read',
    get title() {
      return say('screens.tourStops.readTitle');
    },
    get detail() {
      return say('screens.tourStops.readDetail');
    },
    icon: BookIcon,
  },
  {
    section: 'requests',
    get title() {
      return say('screens.tourStops.requestsTitle');
    },
    get detail() {
      return say('screens.tourStops.requestsDetail');
    },
    icon: PlusIcon,
  },
  {
    section: 'favourites',
    get title() {
      return say('screens.tourStops.favouritesTitle');
    },
    get detail() {
      return say('screens.tourStops.favouritesDetail');
    },
    icon: HeartIcon,
  },
  {
    section: 'search',
    get title() {
      return say('screens.tourStops.searchTitle');
    },
    get detail() {
      return say('screens.tourStops.searchDetail');
    },
    icon: SearchIcon,
  },
];

export { TOUR_STOPS };
export type { TourStop };
