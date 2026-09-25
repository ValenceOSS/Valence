import { useCallback, useEffect, useRef, useState } from 'react';
import type { PressedAt } from '@ValenceMobile/components/Button/Button.types';
import type { ALeap } from '@ValenceMobile/components/Watching/components/TheLeap/TheLeap.types';

const TAP_AGAIN_WITHIN = 280;

const KEEP_LEAPING_WITHIN = 800;

const A_LEAP = 10;

/**
 * Tells a tap on the picture from a double tap on one side of it, as YouTube does: one tap shows
 * or hides the controls, two quick taps on a half of the picture move ten seconds that way, and
 * every quick tap after that moves ten more.
 *
 * A single tap waits a moment before it counts, since until then it could be the first of two.
 * Once a leap has started it carries on for as long as the taps keep coming, on either side, so
 * somebody tapping away at a scene they missed is not made to double tap again each time.
 *
 * @param wide - How wide the picture is, to tell which half was tapped.
 * @param onTap - Told of a tap that was only ever one.
 * @param onLeap - Told to move by so many seconds.
 * @returns What to tell of each tap, and the leap being made while there is one.
 */
const useTapsOnThePicture = (
  wide: number,
  onTap: () => void,
  onLeap: (by: number) => void,
): { tapped: (at: PressedAt) => void; leap: ALeap | null } => {
  const [leap, setLeap] = useState<ALeap | null>(null);
  const leaping = useRef<{ leap: ALeap; at: number } | null>(null);
  const lastTap = useRef<{ way: ALeap['way']; at: number } | null>(null);
  const waiting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settling = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (waiting.current !== null) {
        clearTimeout(waiting.current);
      }

      if (settling.current !== null) {
        clearTimeout(settling.current);
      }
    },
    [],
  );

  const tapped = useCallback(
    ({ x }: PressedAt) => {
      const now = Date.now();
      const way = x < wide / 2 ? 'back' : 'forward';
      const last = lastTap.current;
      const current = leaping.current;
      const isStillLeaping = current !== null && now - current.at < KEEP_LEAPING_WITHIN;
      const isASecondTap = last !== null && last.way === way && now - last.at < TAP_AGAIN_WITHIN;

      lastTap.current = { way, at: now };

      if (waiting.current !== null) {
        clearTimeout(waiting.current);
        waiting.current = null;
      }

      if (!isStillLeaping && !isASecondTap) {
        waiting.current = setTimeout(() => {
          waiting.current = null;
          onTap();
        }, TAP_AGAIN_WITHIN);

        return;
      }

      const next: ALeap = {
        way,
        seconds:
          isStillLeaping && current.leap.way === way ? current.leap.seconds + A_LEAP : A_LEAP,
        count: (current?.leap.count ?? 0) + 1,
      };

      leaping.current = { leap: next, at: now };
      setLeap(next);
      onLeap(way === 'back' ? -A_LEAP : A_LEAP);

      if (settling.current !== null) {
        clearTimeout(settling.current);
      }

      settling.current = setTimeout(() => {
        settling.current = null;
        leaping.current = null;
        lastTap.current = null;
        setLeap(null);
      }, KEEP_LEAPING_WITHIN);
    },
    [wide, onTap, onLeap],
  );

  return { tapped, leap };
};

export { useTapsOnThePicture };
