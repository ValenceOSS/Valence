const GIVE = 120;
const STIFFNESS = 0.55;

/**
 * Lets a width pass its limits only grudgingly, giving less the further it is pulled, the way an
 * edge stretches before it springs back.
 *
 * @param pulled - The width the pointer asks for.
 * @param min - The narrowest it settles at.
 * @param max - The widest it settles at.
 * @returns The width to draw while the pointer is still down.
 */
const rubberBand = (pulled: number, min: number, max: number): number => {
  const stretch = (past: number) => (1 - 1 / ((past * STIFFNESS) / GIVE + 1)) * GIVE;

  if (pulled > max) {
    return max + stretch(pulled - max);
  }

  if (pulled < min) {
    return min - stretch(min - pulled);
  }

  return pulled;
};

export { rubberBand };
