/**
 * A title as it is safe to search indexers with: without the dashes that open or close a word, the
 * quotes, bars and brackets that search engines like Nyaa's read as operators — so that
 * `Re:ZERO -Starting Life in Another World-` does not leave out everything saying "Starting".
 * Dashes inside a word, as in `Spider-Man`, stay.
 *
 * @param title - The title.
 * @returns It, fit for a search.
 */
const queryTitleOf = (title: string): string =>
  title
    .replace(/["|()[\]{}]/g, ' ')
    .replace(/(?<![\p{Letter}\p{Number}])[-–—]+|[-–—]+(?![\p{Letter}\p{Number}])/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export { queryTitleOf };
