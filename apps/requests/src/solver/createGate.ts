/**
 * Lets only so many tasks run at once, starting the rest in the order they arrived as room opens.
 *
 * @param most - How many may run together.
 * @returns The gate: `run` to go through it, and how many are through or waiting.
 */
const createGate = (most: number) => {
  let running = 0;
  const waiting: (() => void)[] = [];

  const run = async <T>(task: () => Promise<T>): Promise<T> => {
    if (running >= most) {
      await new Promise<void>((resolve) => {
        waiting.push(resolve);
      });
    } else {
      running += 1;
    }

    try {
      return await task();
    } finally {
      const next = waiting.shift();

      if (next === undefined) {
        running -= 1;
      } else {
        next();
      }
    }
  };

  return { run, busy: (): number => running + waiting.length };
};

type Gate = ReturnType<typeof createGate>;

export type { Gate };

export { createGate };
