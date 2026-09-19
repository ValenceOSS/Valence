type CreatePacerOptions = {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * Waits the given time.
 *
 * @param ms - How long.
 */
const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Keeps calls to each indexer at most as frequent as it allows, by making each one wait its turn
 * behind the last. An indexer with no limit is never made to wait.
 *
 * @param now - The clock.
 * @param sleep - How to wait.
 * @returns The pacer: ask it for a turn before each call.
 */
const createPacer = ({ now = Date.now, sleep = pause }: CreatePacerOptions = {}) => {
  const nextFree = new Map<string, number>();

  return {
    turn: async (key: string, perMinute: number | null): Promise<void> => {
      if (perMinute === null) {
        return;
      }

      const at = now();
      const start = Math.max(at, nextFree.get(key) ?? at);

      nextFree.set(key, start + 60_000 / perMinute);

      if (start > at) {
        await sleep(start - at);
      }
    },
  };
};

type Pacer = ReturnType<typeof createPacer>;

export type { Pacer };

export { createPacer };
