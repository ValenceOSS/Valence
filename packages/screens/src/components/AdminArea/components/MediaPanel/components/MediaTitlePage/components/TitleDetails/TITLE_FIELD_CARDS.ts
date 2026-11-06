import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';

const TITLE_FIELD_CARDS: readonly {
  id: string;
  title: string;
  about?: string;
  fields: readonly TitleField[];
}[] = [
  {
    id: 'names',
    title: say('screens.adminArea.titleDetails.titleAndRelease'),
    about: say('screens.adminArea.titleDetails.aboutTitleAndRelease'),
    fields: ['title', 'originalTitle', 'sortTitle', 'releaseDate', 'addedAt', 'status'],
  },
  {
    id: 'story',
    title: say('screens.adminArea.titleDetails.story'),
    about: say('screens.adminArea.titleDetails.aboutStory'),
    fields: ['tagline', 'overview', 'trailer'],
  },
  {
    id: 'classification',
    title: say('screens.adminArea.titleDetails.classification'),
    about: say('screens.adminArea.titleDetails.aboutClassification'),
    fields: ['genres', 'tags', 'studios', 'networks'],
  },
  {
    id: 'crew',
    title: say('screens.adminArea.titleDetails.originAndCrew'),
    about: say('screens.adminArea.titleDetails.aboutOriginAndCrew'),
    fields: ['originalLanguage', 'countries', 'creators', 'directors', 'writers'],
  },
  {
    id: 'ratings',
    title: say('screens.ratingPanel.ratings'),
    about: say('screens.adminArea.titleDetails.aboutRatings'),
    fields: ['rating', 'rottenTomatoes', 'certifications'],
  },
  {
    id: 'ids',
    title: say('screens.adminArea.titleDetails.ids'),
    about: say('screens.adminArea.titleDetails.aboutIds'),
    fields: ['imdbId', 'tvdbId', 'anilistId', 'malId'],
  },
  {
    id: 'note',
    title: say('screens.adminArea.titleDetails.note'),
    about: say('screens.adminArea.titleDetails.aboutNote'),
    fields: ['note'],
  },
];

export { TITLE_FIELD_CARDS };
