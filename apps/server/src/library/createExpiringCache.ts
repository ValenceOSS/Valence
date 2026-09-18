type ExpiringCache<T> = {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
};

type ExpiringCacheOptions = {
  holds?: number;
  now?: () => number;
};

/**
 * A map whose entries stop being true after a while, and which forgets its oldest once it holds too
 * many.
 *
 * Written because two caches needed both and had neither together. A catalogue is asked what a
 * programme is made of and the answer is kept, which is right — a library full of one programme's
 * episodes asks the same question hundreds of times, and a show page would otherwise cost a request
 * per season every time somebody opened it. What was wrong is that an answer was kept for as long
 * as the process ran, so a season that aired after a programme was first looked at did not appear
 * until the server was restarted. On a server that stays up for months, that is never. A failure
 * was kept the same way, so one unreachable moment was permanent.
 *
 * Time rather than a signal to clear it, because nothing here knows when a season airs. A scan
 * cannot be the trigger either: a new season is news whether or not anybody has downloaded it, and
 * the page that says what a programme has is the same page that says what it is missing.
 *
 * `holds` bounds it by count as well, evicting whichever was written first. Replacing a value
 * leaves its place in that order alone, so a key written once and read often still ages out — this
 * bounds memory, and the time is what keeps answers honest.
 *
 * The clock is injectable so that a test can age an entry without waiting for one.
 *
 * @param livesForMs - How long an entry may be handed back before it is asked for again.
 * @param options - How many entries to hold at most, and what the time is.
 * @returns The cache.
 */
const createExpiringCache = <T>(
  livesForMs: number,
  options: ExpiringCacheOptions = {},
): ExpiringCache<T> => {
  const { holds, now = Date.now } = options;
  const held = new Map<string, { at: number; value: T }>();

  return {
    get: (key) => {
      const found = held.get(key);

      if (found === undefined) {
        return undefined;
      }

      if (now() - found.at >= livesForMs) {
        held.delete(key);

        return undefined;
      }

      return found.value;
    },

    set: (key, value) => {
      held.set(key, { at: now(), value });

      if (holds === undefined || held.size <= holds) {
        return;
      }

      const oldest = held.keys().next();

      if (oldest.done !== true) {
        held.delete(oldest.value);
      }
    },
  };
};

export type { ExpiringCache };

export { createExpiringCache };
