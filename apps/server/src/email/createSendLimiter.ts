const WINDOW_MS = 1000;

/**
 * Holds each send back until fewer than the given number have started in the last second, so a
 * burst of emails stays inside what a mail provider allows.
 *
 * @param perSecond - How many sends may start in any one second.
 * @param now - The clock.
 * @param wait - How to wait a number of milliseconds.
 * @returns A function to await before each send.
 */
const createSendLimiter = (
  perSecond: number,
  now: () => number = () => Date.now(),
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((settle) => {
      setTimeout(settle, ms);
    }),
): (() => Promise<void>) => {
  const started: number[] = [];
  let queue: Promise<void> = Promise.resolve();

  const takeTurn = async (): Promise<void> => {
    for (;;) {
      const at = now();

      while (started.length > 0 && (started[0] ?? at) <= at - WINDOW_MS) {
        started.shift();
      }

      if (started.length < perSecond) {
        started.push(at);

        return;
      }

      await wait((started[0] ?? at) + WINDOW_MS - at);
    }
  };

  return () => {
    const turn = queue.then(takeTurn);

    queue = turn;

    return turn;
  };
};

export { createSendLimiter };
