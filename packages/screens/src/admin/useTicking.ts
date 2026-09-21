import { useEffect, useState } from 'react';

/**
 * The present moment, brought up to date every so often for as long as something is counting.
 *
 * @param isCounting - Whether anything is; where nothing is, the timer is not kept.
 * @param everyMs - How often to bring it up to date.
 * @returns The present moment, as of the last time it was brought up to date.
 */
const useTicking = (isCounting: boolean, everyMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isCounting) {
      return;
    }

    setNow(Date.now());

    const timer = setInterval(() => {
      setNow(Date.now());
    }, everyMs);

    return () => {
      clearInterval(timer);
    };
  }, [isCounting, everyMs]);

  return now;
};

export { useTicking };
