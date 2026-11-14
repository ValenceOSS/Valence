const MOST_REMEMBERED = 2000;

/**
 * Remembers an answer for a few seconds, so a burst of requests that all ask the same thing — the
 * pieces of one film — asks it once, and requests that arrive while it is being asked share the
 * answer.
 *
 * @param lastsMs - How long an answer is remembered.
 * @param now - The clock, in milliseconds.
 * @returns How to ask, given what asks it.
 */
const createBriefVerdicts = (lastsMs: number, now: () => number = Date.now) => {
  const remembered = new Map<string, { verdict: Promise<boolean>; until: number }>();

  return {
    judge: (key: string, ask: () => Promise<boolean>): Promise<boolean> => {
      const known = remembered.get(key);

      if (known !== undefined && known.until > now()) {
        return known.verdict;
      }

      if (remembered.size >= MOST_REMEMBERED) {
        remembered.clear();
      }

      const verdict = ask();

      remembered.set(key, { verdict, until: now() + lastsMs });
      verdict.catch(() => {
        remembered.delete(key);
      });

      return verdict;
    },

    forget: (): void => {
      remembered.clear();
    },
  };
};

export { createBriefVerdicts };
