import type { ShareRow } from './MetricsStats';

const FEWEST_SERVERS_SHOWN = 3;

type ShareOptions = {
  counts: ReadonlyMap<string, number>;
  total: number;
  labelOf: (id: string) => string;
  order?: readonly string[];
  limit?: number;
};

/**
 * Turns counts of installs into shares of all of them, each answer under its own name, keeping only
 * the biggest where there is a limit.
 *
 * @param options - The counts, how many installs there are in all, how to name a group, the order
 *   to list them in where they have a natural one rather than biggest first, and how many to list.
 * @returns The rows.
 */
const shareOf = ({ counts, total, labelOf, order, limit }: ShareOptions): ShareRow[] =>
  [...counts.entries()]
    .filter(([, installs]) => installs > 0)
    .sort(([aId, a], [bId, b]) =>
      order === undefined
        ? b - a || aId.localeCompare(bId)
        : order.indexOf(aId) - order.indexOf(bId),
    )
    .slice(0, limit ?? Infinity)
    .map(([id, installs]) => ({
      id,
      label: labelOf(id),
      installs,
      share: total === 0 ? 0 : installs / total,
    }));

export { FEWEST_SERVERS_SHOWN, shareOf };
