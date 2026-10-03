type RateLimiterOptions = {
  most: number;
  withinMs: number;
  now?: () => number;
};

/**
 * Counts what each caller asks for in a window of time, and says once one has asked for more than
 * it may. A window starts with a caller's first request in it, and a caller nobody has heard from
 * in a whole window is forgotten.
 *
 * @param most - How many requests a caller may make in a window.
 * @param withinMs - How long a window is.
 * @param now - The clock, in milliseconds.
 * @returns A function that counts a request by its caller, and answers whether it is allowed.
 */
const createRateLimiter = ({ most, withinMs, now = Date.now }: RateLimiterOptions) => {
  const windows = new Map<string, { from: number; count: number }>();

  return (caller: string): boolean => {
    const at = now();

    for (const [key, window] of windows) {
      if (at - window.from >= withinMs) {
        windows.delete(key);
      }
    }

    const window = windows.get(caller) ?? { from: at, count: 0 };

    window.count += 1;
    windows.set(caller, window);

    return window.count <= most;
  };
};

export type { RateLimiterOptions };

export { createRateLimiter };
