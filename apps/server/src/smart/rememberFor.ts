type Remembered<T> = {
  get: (listId: string, key: string, make: () => Promise<T>) => Promise<T>;
  forget: (listId: string) => void;
};

/**
 * Keeps each smart list's answers for a while, shared between callers asking at once and forgotten
 * as soon as the list changes.
 *
 * @param lastsMs - How long an answer is kept.
 * @param now - The time.
 * @returns Where answers are kept.
 */
const rememberFor = <T>(lastsMs: number, now: () => number): Remembered<T> => {
  const kept = new Map<string, { listId: string; at: number; answer: Promise<T> }>();

  return {
    get: (listId, key, make) => {
      const at = now();

      for (const [held, entry] of kept) {
        if (at - entry.at >= lastsMs) {
          kept.delete(held);
        }
      }

      const found = kept.get(`${listId}:${key}`);

      if (found !== undefined) {
        return found.answer;
      }

      const answer = make();

      kept.set(`${listId}:${key}`, { listId, at, answer });
      answer.catch(() => {
        kept.delete(`${listId}:${key}`);
      });

      return answer;
    },
    forget: (listId) => {
      for (const [held, entry] of kept) {
        if (entry.listId === listId) {
          kept.delete(held);
        }
      }
    },
  };
};

export type { Remembered };

export { rememberFor };
