import { SAME_VIEWING_MILLISECONDS } from './decideViewing';

type Held = { seconds: number; at: Date };

const MOST_HELD = 5000;

/**
 * Keeps count of what has been watched of each item that has not yet come to a viewing worth
 * remembering, so that the reports a player sends every few seconds add up to one.
 *
 * Each report says only how long has passed since the one before it, a few seconds at a time, so
 * none of them is a viewing on its own. What is counted is forgotten after the same gap that ends a
 * viewing, and once the count turns into one.
 *
 * @returns How to read, add to and forget what has been counted for an item.
 */
const createSittingTally = () => {
  const held = new Map<string, Held>();

  const isCurrent = (found: Held, at: Date): boolean =>
    Math.abs(at.getTime() - found.at.getTime()) < SAME_VIEWING_MILLISECONDS;

  return {
    read: (key: string, at: Date): number => {
      const found = held.get(key);

      return found !== undefined && isCurrent(found, at) ? found.seconds : 0;
    },
    keep: (key: string, at: Date, seconds: number): void => {
      if (held.size >= MOST_HELD) {
        for (const [stale, found] of held) {
          if (!isCurrent(found, at)) {
            held.delete(stale);
          }
        }
      }

      held.set(key, { seconds, at });
    },
    forget: (key: string): void => {
      held.delete(key);
    },
  };
};

export { createSittingTally };
