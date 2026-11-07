import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';

/**
 * What an empty field of a title shows before anything is entered: what to write there, or the kind
 * of thing it takes, such as a language code.
 *
 * @param field - The field.
 * @returns What to show, or nothing for a field whose control says it already.
 */
const placeholderOf = (field: TitleField): string | undefined => {
  switch (field) {
    case 'title':
      return say('screens.adminArea.titleDetails.placeholder.theNameItsShownUnder');
    case 'originalTitle':
      return say('screens.adminArea.titleDetails.placeholder.theNameInItsOwnLanguage');
    case 'tagline':
      return say('screens.adminArea.titleDetails.placeholder.aShortLineUnderTheName');
    case 'overview':
      return say('screens.adminArea.titleDetails.placeholder.whatItsAboutInAFewSentences');
    case 'releaseDate':
      return say('screens.adminArea.titleDetails.placeholder.pickADate');
    case 'addedAt':
      return say('screens.adminArea.titleDetails.placeholder.pickADate');
    case 'status':
      return say('screens.adminArea.titleDetails.placeholder.itsStatus');
    case 'genres':
      return say('screens.adminArea.titleDetails.placeholder.addAGenre');
    case 'tags':
      return say('screens.adminArea.titleDetails.placeholder.addATag');
    case 'studios':
      return say('screens.adminArea.titleDetails.placeholder.addAStudio');
    case 'networks':
      return say('screens.adminArea.titleDetails.placeholder.addANetwork');
    case 'originalLanguage':
      return say('screens.adminArea.titleDetails.placeholder.aLanguageCode');
    case 'countries':
      return say('screens.adminArea.titleDetails.placeholder.aCountryCode');
    case 'creators':
      return say('screens.adminArea.titleDetails.placeholder.addACreator');
    case 'directors':
      return say('screens.adminArea.titleDetails.placeholder.addADirector');
    case 'writers':
      return say('screens.adminArea.titleDetails.placeholder.addAWriter');
    case 'rating':
      return say('screens.adminArea.titleDetails.placeholder.fromNoughtToTen');
    case 'rottenTomatoes':
      return say('screens.adminArea.titleDetails.placeholder.fromNoughtToAHundred');
    case 'imdbId':
      return say('screens.adminArea.titleDetails.placeholder.anImdbId');
    case 'tvdbId':
      return say('screens.adminArea.titleDetails.placeholder.aTvdbId');
    case 'anilistId':
      return say('screens.adminArea.titleDetails.placeholder.anAnilistId');
    case 'malId':
      return say('screens.adminArea.titleDetails.placeholder.aMyAnimeListId');
    case 'note':
      return say('screens.adminArea.titleDetails.placeholder.aNoteForAdministrators');
    case 'sortTitle':
    case 'trailer':
    case 'certifications':
    case 'cast':
    case 'guestStars':
      return undefined;
  }
};

export { placeholderOf };
