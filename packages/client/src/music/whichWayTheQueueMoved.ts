/**
 * Which way a queue moved from one place in it to another, counting running off the end back to
 * the start as going on, and the start back round to the end as going back, as repeating does.
 *
 * @param from - Where it was.
 * @param to - Where it is.
 * @param length - How long the queue is.
 * @returns 1 where it went on, -1 where it went back.
 */
const whichWayTheQueueMoved = (from: number, to: number, length: number): 1 | -1 => {
  if (length > 2 && from === length - 1 && to === 0) {
    return 1;
  }

  if (length > 2 && from === 0 && to === length - 1) {
    return -1;
  }

  return to >= from ? 1 : -1;
};

export { whichWayTheQueueMoved };
