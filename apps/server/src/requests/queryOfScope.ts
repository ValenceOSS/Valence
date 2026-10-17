/**
 * The query that narrows a search of the requests service to one season or one episode of it, and
 * to some of its indexers, or nothing for the whole request on every one it may use.
 *
 * @param scope - The season, episode and indexers asked, as the address wrote them.
 * @returns Such as `?season=1&episode=3&indexers=a,b`, or nothing.
 */
const queryOfScope = (scope: {
  season?: string | undefined;
  episode?: string | undefined;
  indexers?: string | undefined;
}): string => {
  const query = new URLSearchParams();

  if (scope.season !== undefined) {
    query.set('season', scope.season);

    if (scope.episode !== undefined) {
      query.set('episode', scope.episode);
    }
  }

  if (scope.indexers !== undefined) {
    query.set('indexers', scope.indexers);
  }

  const said = query.toString();

  return said === '' ? '' : `?${said}`;
};

export { queryOfScope };
