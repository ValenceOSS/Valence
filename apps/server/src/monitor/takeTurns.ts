const SLICE_MS = 20;

/**
 * Lets long work share the thread that answers people: the turn it returns is waited on between
 * steps, and gives way to whatever else is waiting once the work has run for a slice without doing
 * so. Waiting on it costs nothing until then, so it can be waited on after every step of a loop
 * hundreds of thousands of steps long.
 *
 * @param sliceMs - How long the work may run before it gives way.
 * @param now - The clock.
 * @returns The turn to wait on between steps.
 */
const takeTurns = (sliceMs = SLICE_MS, now = () => performance.now()): (() => Promise<void>) => {
  let since = now();

  return async () => {
    if (now() - since < sliceMs) {
      return;
    }

    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    since = now();
  };
};

export { takeTurns };
