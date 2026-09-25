/**
 * Says which episode a file is by its number, or which run of them where it is a double episode —
 * `2`, or `2–3`.
 *
 * @param first - The file's first episode.
 * @param last - Its last, where it holds more than one.
 * @returns The number as it is shown.
 */
const describeEpisodeNumbers = (first: number, last?: number | null): string =>
  last === null || last === undefined || last <= first
    ? first.toString()
    : `${first.toString()}–${last.toString()}`;

export { describeEpisodeNumbers };
