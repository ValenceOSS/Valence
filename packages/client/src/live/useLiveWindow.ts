import { useEffect, useState } from 'react';
import { MINUTE_MS } from '@ValenceCore/tokens/MINUTE_MS';
import { liveWindowAt } from '@ValenceClient/live/liveWindowAt';

/**
 * The span of the guide worth showing, moving on as the clock does, and the time now to light what
 * is on.
 *
 * @returns The span's start and end, and now, all in milliseconds.
 */
const useLiveWindow = (): { from: number; until: number; now: number } => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, MINUTE_MS);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return { ...liveWindowAt(now), now };
};

export { useLiveWindow };
