type ATouch = {
  pageX: number;
  pageY: number;
};

/**
 * How far apart two fingers are, in points.
 *
 * Answers nothing for anything that is not two fingers, so a gesture that has lost one is read as
 * no pinch at all rather than as a pinch of some invented size.
 *
 * @param touches - Where every finger on the screen is.
 * @returns The distance between the first two, or nothing where there are not two.
 */
const howFarApart = (touches: readonly ATouch[]): number | null => {
  const [one, other] = touches;

  if (one === undefined || other === undefined) {
    return null;
  }

  return Math.hypot(one.pageX - other.pageX, one.pageY - other.pageY);
};

export type { ATouch };

export { howFarApart };
