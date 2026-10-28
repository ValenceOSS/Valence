import type { LiveProgramme } from '@ValenceContracts/schemas/LiveTv';

type GuideCell = {
  startsAt: number;
  endsAt: number;
  programme: LiveProgramme | null;
};

/**
 * Lays a channel's programmes end to end across a stretch, cut to its edges, with the times the
 * guide says nothing about as empty cells.
 *
 * @param programmes - The channel's programmes, in any order.
 * @param from - Where the stretch starts, in milliseconds.
 * @param until - Where it ends, in milliseconds.
 * @returns The cells, from first to last.
 */
const layCells = (
  programmes: readonly LiveProgramme[],
  from: number,
  until: number,
): GuideCell[] => {
  const timed = [...programmes]
    .map((programme) => ({
      programme,
      startsAt: Date.parse(programme.startsAt),
      endsAt: Date.parse(programme.endsAt),
    }))
    .filter((one) => one.endsAt > from && one.startsAt < until && one.endsAt > one.startsAt)
    .sort((one, other) => one.startsAt - other.startsAt);

  const cells: GuideCell[] = [];
  let reached = from;

  for (const one of timed) {
    const startsAt = Math.max(one.startsAt, reached);
    const endsAt = Math.min(one.endsAt, until);

    if (endsAt <= startsAt) {
      continue;
    }

    if (startsAt > reached) {
      cells.push({ startsAt: reached, endsAt: startsAt, programme: null });
    }

    cells.push({ startsAt, endsAt, programme: one.programme });
    reached = endsAt;
  }

  if (reached < until) {
    cells.push({ startsAt: reached, endsAt: until, programme: null });
  }

  return cells;
};

/**
 * Lays one channel's programmes across a stretch of the guide, cut to its edges, with the times the
 * guide says nothing about filled in, so the row is covered end to end and every part of it can be
 * landed on. Nothing shorter than the shortest cell kept has a cell of its own: the few seconds a
 * programme often stops short of the half hour, or the first minute of one cut off at the edge, are
 * given to the cell before them, or to the one after where they come first.
 *
 * @param programmes - The channel's programmes, in any order.
 * @param from - Where the stretch starts, in milliseconds.
 * @param until - Where it ends, in milliseconds.
 * @param shortest - The shortest cell kept, in milliseconds.
 * @returns The cells, from first to last.
 */
const guideCellsOf = (
  programmes: readonly LiveProgramme[],
  from: number,
  until: number,
  shortest = 0,
): GuideCell[] => {
  const kept: GuideCell[] = [];
  let carried: number | null = null;

  for (const cell of layCells(programmes, from, until)) {
    const before = kept.at(-1);

    if (cell.endsAt - cell.startsAt >= shortest) {
      kept.push(carried === null ? cell : { ...cell, startsAt: carried });
      carried = null;
    } else if (before === undefined) {
      carried ??= cell.startsAt;
    } else {
      kept[kept.length - 1] = { ...before, endsAt: cell.endsAt };
    }
  }

  return carried === null ? kept : [{ startsAt: carried, endsAt: until, programme: null }];
};

export { guideCellsOf };

export type { GuideCell };
