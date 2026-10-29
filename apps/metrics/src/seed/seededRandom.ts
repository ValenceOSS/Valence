/**
 * Makes a source of random numbers that gives the same sequence for the same seed, so the fake
 * installs come out the same every time.
 *
 * @param seed - Where the sequence starts.
 * @returns Numbers from 0 up to but not including 1.
 */
const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

export { seededRandom };
