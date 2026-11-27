import type { StreamStatsGroup } from '@ValenceClient/playback/describeStreamStats';

const HEADING_COUNTS_AS_LINES = 2;

const LETTERS_A_LINE = 26;

const LINES_A_VALUE_AT_MOST = 2;

/**
 * Says how many lines a group of statistics takes up: its heading, and each value at the lines it
 * wraps onto.
 *
 * @param group - The group.
 * @returns The lines.
 */
const linesOf = (group: StreamStatsGroup): number =>
  group.rows.reduce(
    (lines, [, value]) =>
      lines +
      Math.min(LINES_A_VALUE_AT_MOST, Math.max(1, Math.ceil(value.length / LETTERS_A_LINE))),
    HEADING_COUNTS_AS_LINES,
  );

/**
 * Every way of cutting a run of groups into a number of columns, in order.
 *
 * @param groups - The groups, in the order they are read.
 * @param count - How many columns.
 * @returns Each way, as its columns.
 */
const waysToCut = (groups: readonly StreamStatsGroup[], count: number): StreamStatsGroup[][][] => {
  if (count <= 1) {
    return [[[...groups]]];
  }

  return Array.from({ length: groups.length + 1 }, (_, at) => at).flatMap((at) =>
    waysToCut(groups.slice(at), count - 1).map((rest) => [groups.slice(0, at), ...rest]),
  );
};

/**
 * Shares the groups of statistics out between columns, in the order they are read, so that the
 * tallest column is as short as it can be and the panel stays clear of the controls beneath it.
 *
 * @param groups - The groups, in the order they are read.
 * @param count - How many columns there are.
 * @returns The columns, each holding its groups in order; a column can be empty.
 */
const columnsOf = (groups: readonly StreamStatsGroup[], count: number): StreamStatsGroup[][] => {
  const tallestOf = (columns: StreamStatsGroup[][]) =>
    Math.max(
      ...columns.map((column) => column.reduce((lines, group) => lines + linesOf(group), 0)),
    );

  return waysToCut(groups, Math.max(1, count)).reduce((best, way) =>
    tallestOf(way) < tallestOf(best) ? way : best,
  );
};

export { columnsOf };
