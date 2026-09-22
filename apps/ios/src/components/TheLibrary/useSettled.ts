import { useEffect, useState } from 'react';

/**
 * A value once it has stopped changing.
 *
 * Somebody typing a search changes it on every letter, and asking the server about every one is
 * asking about "s", "se" and "sev" on the way to "severance" — three questions nobody wanted
 * answered, each able to arrive after the one that mattered.
 *
 * @param value - What is changing.
 * @param after - How long it must hold still, in milliseconds.
 * @returns The value as it was when it last held still.
 */
const useSettled = <Value>(value: Value, after: number): Value => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const waiting = setTimeout(() => {
      setSettled(value);
    }, after);

    return () => {
      clearTimeout(waiting);
    };
  }, [value, after]);

  return settled;
};

export { useSettled };
