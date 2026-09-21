type HeadingPosition = { id: string; top: number };

/**
 * Picks the section being read: the last heading that has reached the reading line.
 *
 * Above the first heading nothing has been reached yet, so the first is chosen, and at the very
 * bottom of the page the last is, since a short final section could never reach the line.
 *
 * @param positions - Each heading's distance from the top of the window, in reading order.
 * @param line - How far down the window the reading line sits.
 * @param isAtBottom - Whether the page is scrolled as far as it goes.
 * @returns The id of the active heading, or null where there are none.
 */
const pickActiveHeading = (
  positions: readonly HeadingPosition[],
  line: number,
  isAtBottom: boolean,
): string | null => {
  if (positions.length === 0) {
    return null;
  }

  if (isAtBottom) {
    return positions.at(-1)?.id ?? null;
  }

  const reached = positions.filter((position) => position.top <= line);

  return (reached.at(-1) ?? positions[0])?.id ?? null;
};

export type { HeadingPosition };

export { pickActiveHeading };
