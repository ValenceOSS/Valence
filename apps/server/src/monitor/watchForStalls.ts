type StallWatch = {
  whatRuns: () => readonly string[];
  onStall: (stalledMs: number, ran: readonly string[]) => void;
  everyMs?: number;
  longerThanMs?: number;
  now?: () => number;
};

const EVERY_MS = 500;

const LONGER_THAN_MS = 2000;

/**
 * Watches for the server going quiet: a stretch in which it answered nothing, because something on
 * the thread that answers people ran for seconds without letting anything else in. Nothing can be
 * said while that happens, so it is said once it ends — how long it lasted, and what was running
 * either side of it — which names the culprit in the log rather than leaving a health check that
 * failed and nothing to say why.
 *
 * @param watch - What is running now or has started since it was last asked, what to do with a
 *   stall, how often to look and how long a stall has to be to count, and the clock.
 * @returns A way to stop watching.
 */
const watchForStalls = ({
  whatRuns,
  onStall,
  everyMs = EVERY_MS,
  longerThanMs = LONGER_THAN_MS,
  now = () => performance.now(),
}: StallWatch): (() => void) => {
  let lookedAt = now();
  let ranBefore = whatRuns();

  const look = setInterval(() => {
    const at = now();
    const stalledMs = at - lookedAt - everyMs;
    const runs = whatRuns();

    if (stalledMs >= longerThanMs) {
      onStall(stalledMs, [...new Set([...ranBefore, ...runs])]);
    }

    lookedAt = at;
    ranBefore = runs;
  }, everyMs);

  look.unref();

  return () => {
    clearInterval(look);
  };
};

export type { StallWatch };

export { watchForStalls };
