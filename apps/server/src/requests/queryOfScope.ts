/**
 * The query that narrows a search of the requests service to one season or one episode of it, or
 * nothing for the whole request.
 *
 * @param scope - The season and episode asked, as the address wrote them.
 * @returns Such as `?season=1&episode=3`, or nothing.
 */
const queryOfScope = (scope: {
  season?: string | undefined;
  episode?: string | undefined;
}): string => {
  const query = new URLSearchParams();

  if (scope.season !== undefined) {
    query.set('season', scope.season);

    if (scope.episode !== undefined) {
      query.set('episode', scope.episode);
    }
  }

  const said = query.toString();

  return said === '' ? '' : `?${said}`;
};

export { queryOfScope };
