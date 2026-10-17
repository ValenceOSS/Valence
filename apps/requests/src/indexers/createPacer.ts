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
 * behind the last: no closer together than its limit per minute, nor than the gap its site asks
 * for between requests. Turns are handed out as they are asked for, so searches started together
 * still reach the site one after another. An indexer with neither is never made to wait.
 *
 * @param now - The clock.
 * @param sleep - How to wait.
 * @returns The pacer: ask it for a turn before each call.
 */
const createPacer = ({ now = Date.now, sleep = pause }: CreatePacerOptions = {}) => {
  const nextFree = new Map<string, number>();

  return {
    turn: async (key: string, perMinute: number | null, gapMs = 0): Promise<void> => {
      const spacing = Math.max(perMinute === null ? 0 : 60_000 / perMinute, gapMs);

      if (spacing === 0) {
        return;
      }

      const at = now();
      const start = Math.max(at, nextFree.get(key) ?? at);

      nextFree.set(key, start + spacing);

      if (start > at) {
        await sleep(start - at);
      }
    },
  };
};

type Pacer = ReturnType<typeof createPacer>;

export type { Pacer };

export { createPacer };
