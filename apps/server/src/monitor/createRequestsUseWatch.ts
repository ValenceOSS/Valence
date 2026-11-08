type CreateRequestsUseWatchOptions<T> = {
  read: () => Promise<T | null>;
  everyMs?: number;
  now?: () => number;
};

const REQUESTS_USE_EVERY_MS = 10_000;

/**
 * Keeps the last word on what the requests service costs in memory and processor, asking again whenever it is
 * read and the answer is older than `everyMs`, so that the monitor feed always has a figure to hand
 * and never waits on another service to send one.
 *
 * @param read - Asks the requests service, which answers nothing where it cannot say.
 * @param everyMs - How old an answer may be before the next read asks again.
 * @param now - The clock.
 * @returns The watch: `current` hands back the last answer, starting a fresh one where it is due.
 */
const createRequestsUseWatch = <T>({
  read,
  everyMs = REQUESTS_USE_EVERY_MS,
  now = Date.now,
}: CreateRequestsUseWatchOptions<T>) => {
  let latest: T | null = null;
  let askedAt = Number.NEGATIVE_INFINITY;
  let isAsking = false;

  const current = (): T | null => {
    if (!isAsking && now() - askedAt >= everyMs) {
      isAsking = true;
      askedAt = now();
      void read()
        .catch(() => null)
        .then((answer) => {
          latest = answer;
          isAsking = false;
        });
    }

    return latest;
  };

  return { current };
};

export { createRequestsUseWatch };
