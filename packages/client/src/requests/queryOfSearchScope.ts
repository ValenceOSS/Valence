import type { SearchScope } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The query that narrows a search to one season of a request or one episode of it, or nothing for
 * the whole request.
 *
 * @param scope - The season, and the episode where it is one, or nothing.
 * @returns Such as `?season=1&episode=3`, or nothing.
 */
const queryOfSearchScope = (scope: SearchScope | null): string =>
  scope === null
    ? ''
    : scope.episode === null
      ? `?season=${scope.season.toString()}`
      : `?season=${scope.season.toString()}&episode=${scope.episode.toString()}`;

export { queryOfSearchScope };
