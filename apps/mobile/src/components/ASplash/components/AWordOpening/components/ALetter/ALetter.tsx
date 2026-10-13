import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import type { ALetterProps } from './ALetter.types';

const RISES_FROM = 8;

/**
 * One letter of a word being written out, rising a little into place and fading in after its
 * wait, on the same spring the web's letters use. For somebody who asked for less motion it is
 * simply there.
 *
 * @param letter - The letter.
 * @param isShown - Whether it has been told to arrive.
 * @param waitsFor - How long it waits once told, in milliseconds.
 * @param isStill - Whether it should simply be there.
 * @param style - How it is set.
 */
const ALetter = ({ letter, isShown, waitsFor, isStill, style }: ALetterProps) => {
  const [arrived] = useState(() => new Animated.Value(isStill ? 1 : 0));

  useEffect(() => {
    if (!isShown) {
      return undefined;
    }

    if (isStill) {
      arrived.setValue(1);

      return undefined;
    }

    const arriving = Animated.spring(arrived, {
      toValue: 1,
      stiffness: 380,
      damping: 22,
      mass: 1,
      delay: waitsFor,
      useNativeDriver: true,
    });

    arriving.start();

    return () => {
      arriving.stop();
    };
  }, [isShown, isStill, waitsFor, arrived]);

  return (
    <Animated.Text
      style={[
        style,
        {
          opacity: arrived.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              translateY: arrived.interpolate({ inputRange: [0, 1], outputRange: [RISES_FROM, 0] }),
            },
          ],
        },
      ]}
    >
      {letter}
    </Animated.Text>
  );
};

ALetter.displayName = 'ALetter';

export { ALetter };
