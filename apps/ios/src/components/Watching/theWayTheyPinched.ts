const ENOUGH = 1.15;

/**
 * Which way a pinch went, once it went far enough to have been meant.
 *
 * A pair of fingers resting on a screen drifts. Asking for a clear tenth-and-a-half either way
 * keeps a film from flipping between filling the screen and fitting it while somebody holds it
 * still, which reads as the picture flickering rather than as anything they did.
 *
 * @param startedApart - How far apart the fingers were when they went down.
 * @param nowApart - How far apart they are.
 * @returns Whether they were pushed apart, drawn together, or neither yet.
 */
const theWayTheyPinched = (
  startedApart: number,
  nowApart: number,
): 'apart' | 'together' | 'neither' => {
  if (startedApart <= 0 || nowApart <= 0) {
    return 'neither';
  }

  if (nowApart / startedApart >= ENOUGH) {
    return 'apart';
  }

  return startedApart / nowApart >= ENOUGH ? 'together' : 'neither';
};

export { theWayTheyPinched };
