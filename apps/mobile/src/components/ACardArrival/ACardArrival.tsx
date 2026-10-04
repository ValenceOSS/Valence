import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { ACardArrivalProps } from './ACardArrival.types';

const RISE = 18;

const POP = 0.92;

const HEADING_LEAD = 60;

const STEP = 45;

const CEILING = 420;

const FADES_OVER = 180;

/**
 * One card arriving in a row as the web's cards do: rising from a little smaller on a spring that
 * overshoots a touch, just after the row's heading and after the card before it, so a row lands left
 * to right rather than appearing at once. The wait stops growing past a ceiling, so a long row is not
 * still arriving after somebody has started reading it. Somebody who asked their phone for less
 * motion sees it fade in where it belongs, and a card already seen is simply there.
 *
 * @param at - Where the card sits in its row, counting from nothing.
 * @param isArrived - Whether it has arrived before, and so shows without moving.
 * @param onArrived - Told once it has started arriving, so it can be remembered as seen.
 */
const ACardArrival = ({ children, at, isArrived = false, onArrived }: ACardArrivalProps) => {
  const isStill = usePrefersStillness();
  const [arriving] = useState(() => new Animated.Value(isArrived ? 1 : 0));
  const told = useRef(onArrived);

  useEffect(() => {
    told.current = onArrived;
  });

  useEffect(() => {
    if (isArrived) {
      arriving.setValue(1);

      return undefined;
    }

    const delay = HEADING_LEAD + Math.min(at * STEP, CEILING);
    const moving = isStill
      ? Animated.timing(arriving, {
          toValue: 1,
          duration: FADES_OVER,
          delay,
          useNativeDriver: true,
        })
      : Animated.spring(arriving, { toValue: 1, ...SPRINGS.bounce, delay, useNativeDriver: true });

    moving.start();
    told.current?.();

    return () => {
      moving.stop();
    };
  }, [arriving, at, isArrived, isStill]);

  return (
    <Animated.View
      style={{
        opacity: arriving.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: isStill
          ? []
          : [
              { translateY: arriving.interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] }) },
              { scale: arriving.interpolate({ inputRange: [0, 1], outputRange: [POP, 1] }) },
            ],
      }}
    >
      {children}
    </Animated.View>
  );
};

ACardArrival.displayName = 'ACardArrival';

export { ACardArrival };
