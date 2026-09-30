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
import { say } from '@ValenceI18n/say';

type TourStop = {
  section: Place['section'];
  title: string;
  detail: string;
  icon: IconGlyph;
};

const TOUR_STOPS: readonly TourStop[] = [
  {
    section: 'home',
    title: say('common.home'),
    detail: say('screens.tour.tourStops.pickUpWhereYouLeftOff'),
    icon: HomeIcon,
  },
  {
    section: 'films',
    title: say('common.films'),
    detail: say('screens.tour.tourStops.everyFilmInTheLibraryPress'),
    icon: TapeIcon,
  },
  {
    section: 'shows',
    title: say('common.shows'),
    detail: say('screens.tour.tourStops.seriesAndTheirSeasonsValenceRemembers'),
    icon: MonitorIcon,
  },
  {
    section: 'music',
    title: say('common.music'),
    detail: say('screens.tour.tourStops.yourMusicWithPlaylistsAQueue'),
    icon: MusicNoteIcon,
  },
  {
    section: 'read',
    title: say('common.read'),
    detail: say('screens.tour.tourStops.booksAndComicsWithYourPlace'),
    icon: BookIcon,
  },
  {
    section: 'requests',
    title: say('common.requests'),
    detail: say('screens.tour.tourStops.askForSomethingThatIsNot'),
    icon: PlusIcon,
  },
  {
    section: 'favourites',
    title: say('common.favourites'),
    detail: say('screens.tour.tourStops.pressTheHeartOnAnythingTo'),
    icon: HeartIcon,
  },
  {
    section: 'search',
    title: say('common.search'),
    detail: say('screens.tour.tourStops.lookAcrossFilmsShowsMusicAnd'),
    icon: SearchIcon,
  },
];

export { TOUR_STOPS };
export type { TourStop };
