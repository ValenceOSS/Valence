import type { ShareRow } from './MetricsStats';

const SMALLEST_GROUP = 3;

const OTHER = 'other';

type ShareOptions = {
  counts: ReadonlyMap<string, number>;
  total: number;
  labelOf: (id: string) => string;
  order?: readonly string[];
  limit?: number;
};

/**
 * Turns counts of installs into shares of all of them, folding every group smaller than three
 * installs, and any past the limit, into one "Other" row so that no install can be picked out.
 *
 * @param options - The counts, how many installs there are in all, how to name a group, the order
 *   to list them in where they have a natural one rather than biggest first, and how many to list.
 * @returns The rows, with "Other" last.
 */
const shareOf = ({ counts, total, labelOf, order, limit }: ShareOptions): ShareRow[] => {
  const shown: [string, number][] = [];
  let folded = 0;

  const ranked = [...counts.entries()]
    .filter(([, installs]) => installs > 0)
    .sort(([aId, a], [bId, b]) =>
      order === undefined
        ? b - a || aId.localeCompare(bId)
        : order.indexOf(aId) - order.indexOf(bId),
    );

  for (const [id, installs] of ranked) {
    if (id === OTHER || installs < SMALLEST_GROUP || shown.length >= (limit ?? Infinity)) {
      folded += installs;
    } else {
      shown.push([id, installs]);
    }
  }

  const rows = shown.map(([id, installs]) => ({
    id,
    label: labelOf(id),
    installs,
    share: total === 0 ? 0 : installs / total,
  }));

  return folded === 0
    ? rows
    : [
        ...rows,
        { id: OTHER, label: 'Other', installs: folded, share: total === 0 ? 0 : folded / total },
      ];
};

export { SMALLEST_GROUP, shareOf };
