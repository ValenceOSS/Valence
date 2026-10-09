import { nameSeason } from '@ValenceClient/library/nameSeason';
import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

/**
 * What a narrowed search is for, as a person would say it: a season by its name, an episode the way
 * release names write it.
 *
 * @param scope - The season, and the episode where it is one.
 * @returns Such as `Season 1` or `S01E03`.
 */
const nameSearchScope = (scope: SearchScope): string =>
  scope.episode === null
    ? nameSeason(scope.season)
    : say('common.searchWhatEpisode', {
        season: scope.season.toString().padStart(2, '0'),
        episode: scope.episode.toString().padStart(2, '0'),
      });

export { nameSearchScope };
