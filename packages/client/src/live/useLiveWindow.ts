import { useEffect, useState } from 'react';

const HALF_HOUR_MS = 30 * 60 * 1000;

const SHOWN_MS = 4 * 60 * 60 * 1000;

const LOOKS_AGAIN_MS = 60 * 1000;

/**
 * The span of the guide worth showing: from the start of the half hour now falls in, for the next
 * four hours, moving on as the clock does — so everybody looking at the guide in the same half hour
 * asks for the same span, and shares the answer.
 *
 * @returns The span's start and end, and now, all in milliseconds.
 */
const useLiveWindow = (): { from: number; until: number; now: number } => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, LOOKS_AGAIN_MS);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const from = Math.floor(now / HALF_HOUR_MS) * HALF_HOUR_MS;

  return { from, until: from + SHOWN_MS, now };
};

export { useLiveWindow };
