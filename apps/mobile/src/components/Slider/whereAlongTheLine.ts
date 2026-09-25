/**
 * Where a finger is along a line, as a value rather than a distance.
 *
 * Kept apart from the gesture that calls it because a gesture cannot be asked questions: driving
 * `PanResponder` from a test means building touch histories the platform normally builds, which
 * tests the platform rather than this. The arithmetic is the part that can be wrong, so the
 * arithmetic is the part that is on its own.
 *
 * @param touchedAt - Where the finger is, across the line.
 * @param across - How wide the line is.
 * @param furthest - The value at the far end of it.
 * @returns The value under the finger, never past either end.
 */
const whereAlongTheLine = (touchedAt: number, across: number, furthest: number): number => {
  if (across <= 0 || furthest <= 0) {
    return 0;
  }

  return Math.min(Math.max((touchedAt / across) * furthest, 0), furthest);
};

export { whereAlongTheLine };
