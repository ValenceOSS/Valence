import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sideStripOf } from '@ValenceMobile/platform/sideStripOf';
import { whereTheStatusIs } from '@ValenceMobile/platform/whereTheStatusIs';

const UNDER_THE_STATUS = 176;

const BELOW_THE_STATUS_BY = 16;

/**
 * The strip down the side of a folding phone's screen, where the system moves its status and bars
 * to leave the height to the app — the right of the iPhone Duo's outside screen, and of its inside
 * one. It is part of the screen an app may draw on, but not under the clock and the island at its
 * top, and what is laid in it shares the clock's centre line. The system is asked where its
 * status is, and believed only where the answer lies inside the strip, since it can describe the
 * status as a band across the top of the window instead.
 *
 * @returns Which side the strip is on, how wide it is, how far down its free part starts, and how
 *   far in from that side of the window its centre line runs, or nothing on a phone without one.
 */
const useTheSideStrip = (): {
  side: 'left' | 'right';
  breadth: number;
  freeFrom: number;
  centreIn: number;
} | null => {
  const room = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const strip = sideStripOf(room);
  const [status, setStatus] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const hasStrip = strip !== null;

  useEffect(() => {
    if (!hasStrip) {
      return undefined;
    }

    let isStill = true;

    void whereTheStatusIs().then((found) => {
      if (isStill) {
        setStatus(found);
      }
    });

    return () => {
      isStill = false;
    };
  }, [hasStrip, room.left, room.right, width]);

  if (strip === null) {
    return null;
  }

  const inStrip =
    status !== null &&
    status.width <= strip.breadth + 1 &&
    (strip.side === 'right' ? status.x >= width - strip.breadth - 1 : status.x <= 1)
      ? status
      : null;
  const middle = inStrip === null ? null : inStrip.x + inStrip.width / 2;

  return {
    ...strip,
    freeFrom:
      inStrip === null ? UNDER_THE_STATUS : inStrip.y + inStrip.height + BELOW_THE_STATUS_BY,
    centreIn:
      middle === null ? strip.breadth / 2 : strip.side === 'right' ? width - middle : middle,
  };
};

export { useTheSideStrip };
