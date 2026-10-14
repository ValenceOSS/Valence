import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

/**
 * Whether an episode is in what somebody asked to search for: a season, or one episode of it — for
 * anime a cour, or one episode by its number counted from the first, Specials by their own — or
 * everything where they named nothing.
 *
 * @param item - The episode.
 * @param scope - What to search for, or null for everything.
 * @param isAnime - Whether the request is anime, so its seasons are cours.
 * @returns Whether it is in it.
 */
const isItemInScope = (
  item: Pick<RequestItemRecord, 'season' | 'episode' | 'cour' | 'absolute'>,
  scope: SearchScope | null,
  isAnime: boolean,
): boolean =>
  scope === null ||
  (isAnime
    ? item.cour === scope.season &&
      (scope.episode === null || (item.absolute ?? item.episode) === scope.episode)
    : item.season === scope.season && (scope.episode === null || item.episode === scope.episode));

export { isItemInScope };
