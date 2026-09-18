const STEP = 1024;

const NARROWEST = 1e-6;

/**
 * Where an entry goes when it is dropped between two others.
 *
 * Positions are fractional so that moving one track in a four-hundred-track playlist writes one
 * row, not four hundred: the entry takes the point halfway between its new neighbours. At either end
 * it takes a full step past the last one. Halving cannot go on forever, so where the gap has grown
 * too narrow to split this answers nothing, and the caller spaces the list out again.
 *
 * @param before - The position of the entry it goes after, or nothing at the top.
 * @param after - The position of the entry it goes before, or nothing at the bottom.
 * @returns The position, or nothing where there is no room left between them.
 */
const positionBetween = (before: number | null, after: number | null): number | null => {
  if (before === null && after === null) {
    return STEP;
  }

  if (before === null) {
    return (after ?? 0) - STEP;
  }

  if (after === null) {
    return before + STEP;
  }

  return after - before < NARROWEST ? null : (before + after) / 2;
};

export { STEP, positionBetween };
