/**
 * Runs work one piece at a time for each key, in the order it was given, while different keys run
 * side by side — so what one device did is told in the order it happened, however long each piece
 * takes to describe. A piece that fails is passed over rather than holding up the ones behind it.
 *
 * @returns How to give it work for a key.
 */
const createQueuePerKey = (): ((key: string, work: () => Promise<void>) => void) => {
  const tails = new Map<string, Promise<void>>();

  return (key, work) => {
    const next = (tails.get(key) ?? Promise.resolve()).then(work).catch(() => undefined);

    tails.set(key, next);
    void next.then(() => {
      if (tails.get(key) === next) {
        tails.delete(key);
      }
    });
  };
};

export { createQueuePerKey };
