/**
 * Every episode number one file holds: its own, or each from its first to its last where it is a
 * double episode filed as `S01E01-E02`.
 *
 * @param first - The file's first episode.
 * @param last - Its last, where it holds more than one.
 * @returns The episode numbers, ascending.
 */
const episodeNumbersOf = (first: number, last: number | null): number[] =>
  last === null || last <= first
    ? [first]
    : Array.from({ length: last - first + 1 }, (_, at) => first + at);

export { episodeNumbersOf };
