/**
 * How many episodes each season has, from a list of episodes.
 *
 * @param episodes - The episodes, each naming its season.
 * @returns Each season's number and how many episodes it has.
 */
const seasonCountsOf = (
  episodes: readonly { season: number | null }[],
): ReadonlyMap<number, number> =>
  episodes.reduce((counts, { season }) => {
    if (season !== null) {
      counts.set(season, (counts.get(season) ?? 0) + 1);
    }

    return counts;
  }, new Map<number, number>());

export { seasonCountsOf };
