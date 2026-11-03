/**
 * Counts the titles behind a set of problems, each once: an episode counts as its series, and
 * anything else as itself, so a series with four problem episodes is one title to look at.
 *
 * @param rows - Every item or series with a problem, with the series it belongs to where it has one.
 * @returns How many titles the problems fall in.
 */
const countProblemTitles = (rows: readonly { id: string; seriesId: string | null }[]): number =>
  new Set(rows.map((row) => row.seriesId ?? row.id)).size;

export { countProblemTitles };
