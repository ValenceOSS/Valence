import type { Schedule } from '@ValenceRequests/timing/Schedule';

/**
 * Waits with the clock this process has.
 *
 * @param run - What to do.
 * @param afterMs - How long to wait first.
 * @returns How to stop waiting.
 */
const waitThenRun: Schedule = (run, afterMs) => {
  const timer = setTimeout(run, afterMs);

  return () => {
    clearTimeout(timer);
  };
};

export { waitThenRun };
