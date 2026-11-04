import type { TitleField, TitleSubjectKind } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';

/**
 * Names a field of a title's metadata the way the title page labels it, which for a date depends
 * on what kind of title it is.
 *
 * @param field - The field.
 * @param kind - The kind of title.
 * @returns The label.
 */
const labelOfField = (field: TitleField, kind: TitleSubjectKind): string => {
  switch (field) {
    case 'title':
      return kind === 'season' ? say('common.name') : say('common.title');
    case 'sortTitle':
      return say('screens.adminArea.titleDetails.sortTitle');
    case 'originalTitle':
      return say('screens.adminArea.titleDetails.originalTitle');
    case 'tagline':
      return say('screens.adminArea.titleDetails.tagline');
    case 'overview':
      return say('screens.adminArea.adminSections.overview');
    case 'releaseDate':
      return kind === 'film'
        ? say('common.releaseDate')
        : kind === 'show'
          ? say('screens.adminArea.titleDetails.firstAired')
          : say('screens.adminArea.titleDetails.airDate');
    case 'status':
      return say('common.status');
    case 'genres':
      return say('common.genres');
    case 'tags':
      return say('screens.adminArea.titleDetails.tags');
    case 'studios':
      return say('screens.requestsPage.studiosRail.studios');
    case 'networks':
      return say('screens.adminArea.titleDetails.networks');
    case 'certifications':
      return say('screens.adminArea.titleDetails.contentRating');
    case 'rating':
      return say('common.rating');
    case 'rottenTomatoes':
      return say('client.library.describeTitleDetails.rottenTomatoes');
    case 'imdbId':
      return say('screens.adminArea.titleDetails.imdb');
    case 'tvdbId':
      return say('screens.adminArea.titleDetails.tvdb');
    case 'note':
      return say('screens.adminArea.titleDetails.note');
  }
};

export { labelOfField };
