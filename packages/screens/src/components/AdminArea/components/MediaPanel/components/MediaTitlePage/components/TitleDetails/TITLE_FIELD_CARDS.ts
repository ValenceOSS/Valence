import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';

const TITLE_FIELD_CARDS: readonly {
  id: string;
  title: string;
  fields: readonly TitleField[];
}[] = [
  {
    id: 'names',
    title: say('screens.adminArea.titleDetails.titleAndRelease'),
    fields: ['title', 'originalTitle', 'sortTitle', 'releaseDate', 'addedAt', 'status'],
  },
  {
    id: 'story',
    title: say('screens.adminArea.titleDetails.story'),
    fields: ['tagline', 'overview', 'trailer'],
  },
  {
    id: 'classification',
    title: say('screens.adminArea.titleDetails.classification'),
    fields: ['genres', 'tags', 'studios', 'networks'],
  },
  {
    id: 'ratings',
    title: say('screens.ratingPanel.ratings'),
    fields: ['rating', 'rottenTomatoes', 'certifications'],
  },
  {
    id: 'ids',
    title: say('screens.adminArea.titleDetails.ids'),
    fields: ['imdbId', 'tvdbId', 'anilistId', 'malId'],
  },
  {
    id: 'note',
    title: say('screens.adminArea.titleDetails.note'),
    fields: ['note'],
  },
];

export { TITLE_FIELD_CARDS };
