import { useEffect, useState } from 'react';

/**
 * Counts up on a steady beat while there is more than one thing to take turns between, so a caller
 * can show each of several things in turn.
 *
 * @param count - How many things there are to take turns between.
 * @param everyMs - How long each one is shown for.
 * @returns Whose turn it is, from zero to one less than the count.
 */
const useTakingTurns = (count: number, everyMs: number): number => {
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    if (count < 2) {
      return undefined;
    }

    const beat = setInterval(() => {
      setTurn((was) => was + 1);
    }, everyMs);

    return () => {
      clearInterval(beat);
    };
  }, [count, everyMs]);

  return count === 0 ? 0 : turn % count;
};

export { useTakingTurns };
