import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';

const TITLE_FIELD_CARDS: readonly { id: string; title: string; fields: readonly TitleField[] }[] = [
  {
    id: 'names',
    title: say('screens.adminArea.titleDetails.names'),
    fields: ['title', 'sortTitle', 'originalTitle'],
  },
  {
    id: 'story',
    title: say('screens.adminArea.titleDetails.story'),
    fields: ['tagline', 'overview'],
  },
  { id: 'release', title: say('common.release'), fields: ['releaseDate', 'status'] },
  {
    id: 'classification',
    title: say('screens.adminArea.titleDetails.classification'),
    fields: ['genres', 'tags', 'studios', 'networks'],
  },
  {
    id: 'contentRating',
    title: say('screens.adminArea.titleDetails.contentRating'),
    fields: ['certifications'],
  },
  {
    id: 'ratings',
    title: say('screens.ratingPanel.ratings'),
    fields: ['rating', 'rottenTomatoes'],
  },
  { id: 'ids', title: say('screens.adminArea.titleDetails.ids'), fields: ['imdbId', 'tvdbId'] },
  { id: 'note', title: say('screens.adminArea.titleDetails.note'), fields: ['note'] },
];

export { TITLE_FIELD_CARDS };
