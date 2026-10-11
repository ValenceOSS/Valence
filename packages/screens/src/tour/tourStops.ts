import {
  BookOpen as BookOpenIcon,
  Compass as CompassIcon,
  Film as FilmIcon,
  Heart as HeartIcon,
  Home as HomeIcon,
  MusicNote as MusicNoteIcon,
  Search as SearchIcon,
  Tv as TvIcon,
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
    icon: FilmIcon,
  },
  {
    section: 'shows',
    title: say('common.shows'),
    detail: say('screens.tour.tourStops.seriesAndTheirSeasonsValenceRemembers'),
    icon: TvIcon,
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
    icon: BookOpenIcon,
  },
  {
    section: 'requests',
    title: say('common.requests'),
    detail: say('screens.tour.tourStops.askForSomethingThatIsNot'),
    icon: CompassIcon,
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
