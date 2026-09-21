import { useEffect, useState } from 'react';

/**
 * The present moment, brought up to date every so often for as long as something is counting.
 *
 * A caption reading "4 minutes ago" is only true at the moment it is drawn, and a component that
 * reads the clock while rendering has no reason to render again — so the caption stops at whatever
 * it first said and stays there. This keeps the reading in state and moves it on a timer, so the
 * words age with the thing they describe.
 *
 * @param everyMs - How often to bring it up to date. A caption counting minutes wants far less
 *   than one counting seconds, and each timer costs a render.
 * @param isCounting - Whether anything is; where nothing is, the timer is not kept.
 * @returns The present moment, as of the last time it was brought up to date.
 */
const useTicking = (everyMs: number, isCounting = true): number => {
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
