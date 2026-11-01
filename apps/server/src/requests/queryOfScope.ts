/**
 * The query that narrows a search of the requests service to one season or one episode of it, and
 * to some of its indexers, and says what was typed to search by in place of the request's own
 * searches, or nothing for the whole request on every one it may use.
 *
 * @param scope - The season, episode, indexers and words asked, as the address wrote them.
 * @returns Such as `?season=1&episode=3&indexers=a,b&query=star+trek`, or nothing.
 */
const queryOfScope = (scope: {
  season?: string | undefined;
  episode?: string | undefined;
  indexers?: string | undefined;
  query?: string | undefined;
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

  if (scope.query !== undefined && scope.query !== '') {
    query.set('query', scope.query);
  }

  const said = query.toString();

  return said === '' ? '' : `?${said}`;
};

export { queryOfScope };
