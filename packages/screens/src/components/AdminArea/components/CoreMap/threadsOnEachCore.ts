/**
 * How many threads each core runs, spreading any left over across the first cores, which is how a
 * processor with fast and efficient cores lays them out: the fast ones run two threads, the
 * efficient ones one.
 *
 * @param cores - Physical cores, or null where the platform would not count them.
 * @param threads - Logical processors.
 * @returns The threads on each core, in order.
 */
const threadsOnEachCore = (cores: number | null, threads: number): number[] => {
  if (cores === null || cores <= 0 || threads < cores) {
    return Array.from({ length: threads }, () => 1);
  }

  const each = Math.floor(threads / cores);
  const over = threads % cores;

  return Array.from({ length: cores }, (_, index) => each + (index < over ? 1 : 0));
};

export { threadsOnEachCore };
