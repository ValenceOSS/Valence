import { useEffect, useState } from 'react';

/**
 * A value once it has stopped changing for a moment, so that asking the server about what somebody
 * is typing waits for them to pause rather than asking again at every letter.
 *
 * @param value - The value as it is now.
 * @param afterMs - How long it has to stay the same.
 * @returns The value as it last settled.
 */
const useSettled = <Value>(value: Value, afterMs: number): Value => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(value);
    }, afterMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, afterMs]);

  return settled;
};

export { useSettled };
