import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { ARisingProps } from './ARising.types';

const RISES_BY = 18;

const ONE_AFTER_ANOTHER = 60;

const FADES_OVER = 180;

/**
 * Something on the way in fading and rising into place as it arrives, in its turn after whatever
 * came before it, on the spring the web's wall of faces arrives on.
 *
 * Somebody who has asked their phone for less motion sees it fade in where it belongs instead, and
 * something already on screen — the wall, coming back to it from a face — is simply there.
 *
 * @param children - What arrives.
 * @param turn - How many things arrive before it.
 * @param after - How long to wait before the first thing arrives, in milliseconds.
 * @param isArrived - Whether it is already in place and should not arrive at all.
 * @param stretches - Whether it takes the full width of a column that centres everything else, as a
 *   form does.
 */
const ARising = ({
  children,
  turn = 0,
  after = 0,
  isArrived = false,
  stretches = false,
}: ARisingProps) => {
  const isStill = usePrefersStillness();
  const [arriving] = useState(() => new Animated.Value(isArrived ? 1 : 0));

  useEffect(() => {
    if (isArrived) {
      arriving.setValue(1);

      return undefined;
    }

    const delay = after + turn * ONE_AFTER_ANOTHER;
    const rising = isStill
      ? Animated.timing(arriving, {
          toValue: 1,
          duration: FADES_OVER,
          delay,
          useNativeDriver: true,
        })
      : Animated.spring(arriving, {
          toValue: 1,
          ...SPRINGS.rise,
          delay,
          useNativeDriver: true,
        });

    rising.start();

    return () => {
      rising.stop();
    };
  }, [arriving, turn, after, isArrived, isStill]);

  return (
    <Animated.View
      style={{
        ...(stretches ? { alignSelf: 'stretch' } : {}),
        opacity: arriving.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: arriving.interpolate({
              inputRange: [0, 1],
              outputRange: [isStill ? 0 : RISES_BY, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

ARising.displayName = 'ARising';

export { ARising };
