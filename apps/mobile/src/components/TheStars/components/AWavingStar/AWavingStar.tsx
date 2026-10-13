import { Star } from '@keyline-icons/react-native';
import { Star as StarFilled } from '@keyline-icons/react-native/fill';
import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { AWavingStarProps } from './AWavingStar.types';

const WAVE_MILLISECONDS = 420;

/**
 * One star of a rating, which jumps and tilts as a wave runs through the stars up to the one
 * pressed, as the web's stars do.
 *
 * @param isLit - Whether it is lit.
 * @param wave - How many waves have run, so that each new one jumps it again.
 * @param delay - How long after the press this star jumps, so the wave runs along the row.
 * @param size - How large it is drawn.
 * @param litColour - The colour of a lit star.
 * @param restColour - The colour of an unlit one.
 */
const AWavingStar = ({ isLit, wave, delay, size, litColour, restColour }: AWavingStarProps) => {
  const isStill = usePrefersStillness();
  const [jump] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (wave === 0 || isStill) {
      return;
    }

    jump.setValue(0);
    Animated.timing(jump, {
      toValue: 1,
      duration: WAVE_MILLISECONDS,
      delay,
      easing: EASINGS.outQuad,
      useNativeDriver: true,
    }).start();
  }, [wave, delay, jump, isStill]);

  return (
    <Animated.View
      style={{
        transform: [
          { scale: jump.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.4, 1] }) },
          {
            rotate: jump.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['0deg', '-14deg', '0deg'],
            }),
          },
        ],
      }}
    >
      <Icon of={isLit ? StarFilled : Star} size={size} colour={isLit ? litColour : restColour} />
    </Animated.View>
  );
};

AWavingStar.displayName = 'AWavingStar';

export { AWavingStar };
