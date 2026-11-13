import { useEffect, useState } from 'react';

/**
 * A value as it stands once it has stopped changing for a moment, for work too costly to redo on
 * every step of a drag, such as asking the server for a drawing on a colour still being picked.
 *
 * @param value - The value as it is now.
 * @param after - How long it must hold still, in milliseconds.
 * @returns The value it last held still at.
 */
const useSettledValue = <T>(value: T, after: number): T => {
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

export { useSettledValue };
