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
 * for between requests. Turns wait in a queue for each indexer, so searches started together reach
 * the site one after another, and an urgent turn — a search somebody is watching — goes ahead of
 * every turn still waiting that is not. An indexer with neither limit nor gap is never made to wait.
 *
 * @param now - The clock.
 * @param sleep - How to wait.
 * @returns The pacer: ask it for a turn before each call.
 */
const createPacer = ({ now = Date.now, sleep = pause }: CreatePacerOptions = {}) => {
  const nextFree = new Map<string, number>();
  const waiting = new Map<string, { isUrgent: boolean; spacing: number; go: () => void }[]>();

  const handOut = async (key: string): Promise<void> => {
    const queue = waiting.get(key) ?? [];

    while (queue.length > 0) {
      const left = (nextFree.get(key) ?? 0) - now();

      if (left > 0) {
        await sleep(left);
      }

      const urgent = queue.findIndex((one) => one.isUrgent);
      const [next] = queue.splice(urgent === -1 ? 0 : urgent, 1);

      if (next !== undefined) {
        nextFree.set(key, Math.max(now(), nextFree.get(key) ?? 0) + next.spacing);
        next.go();
      }
    }

    waiting.delete(key);
  };

  return {
    turn: (key: string, perMinute: number | null, gapMs = 0, isUrgent = false): Promise<void> => {
      const spacing = Math.max(perMinute === null ? 0 : 60_000 / perMinute, gapMs);

      if (spacing === 0) {
        return Promise.resolve();
      }

      return new Promise((go) => {
        const queue = waiting.get(key);
        const entry = { isUrgent, spacing, go };

        if (queue === undefined) {
          waiting.set(key, [entry]);
          void handOut(key);
        } else {
          queue.push(entry);
        }
      });
    },
  };
};

type Pacer = ReturnType<typeof createPacer>;

export type { Pacer };

export { createPacer };
