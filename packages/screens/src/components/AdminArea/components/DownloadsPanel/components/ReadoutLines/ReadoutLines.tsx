import type { ReadoutLinesProps } from './ReadoutLines.types';

/**
 * Figures in a table's cell, each on a line of its own so none is ever split between two — how
 * fast a download comes down and goes up, or how many are seeding and fetching it — and a dash
 * where there are none.
 *
 * @param lines - The figures, in words or as rolling numbers.
 */
const ReadoutLines = ({ lines }: ReadoutLinesProps) => (
  <span className="flex flex-col whitespace-nowrap text-xs tabular-nums text-text-muted">
    {lines.length === 0 ? '—' : lines.map((line, at) => <span key={at.toString()}>{line}</span>)}
  </span>
);

ReadoutLines.displayName = 'ReadoutLines';

export { ReadoutLines };
