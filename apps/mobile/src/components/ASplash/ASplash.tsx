import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import mark from '@ValenceMobile/assets/valence-mark.png';
import { theColours } from '@ValenceMobile/theme/theColours';
import type { ASplashProps } from './ASplash.types';

const MARK_WIDE = 100;

const WIDER_BY = 624 / 458;

const BREATHES_MS = 1400;

const LEAVES_MS = 520;

const styles = StyleSheet.create({
  ground: {
    alignItems: 'center',
    backgroundColor: theColours.dark.surface,
    justifyContent: 'center',
  },
  mark: { height: MARK_WIDE / WIDER_BY, tintColor: theColours.dark.text, width: MARK_WIDE },
});

/**
 * What Valence shows as it opens, as the television shows it: the mark on the dark ground,
 * breathing while the first screen is got ready, then swelling and fading with the ground to
 * uncover it.
 *
 * @param isDone - Whether the first screen is ready to be seen.
 * @param onGone - Told once it has faded away, so it can be taken off the screen.
 */
const ASplash = ({ isDone, onGone }: ASplashProps) => {
  const [breath] = useState(() => new Animated.Value(0));
  const [leaving] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: BREATHES_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: BREATHES_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    breathing.start();

    return () => {
      breathing.stop();
    };
  }, [breath]);

  useEffect(() => {
    if (!isDone) {
      return undefined;
    }

    Animated.timing(leaving, {
      toValue: 1,
      duration: LEAVES_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const going = setTimeout(onGone, LEAVES_MS);

    return () => {
      clearTimeout(going);
    };
  }, [isDone, leaving, onGone]);

  return (
    <Animated.View
      pointerEvents={isDone ? 'none' : 'auto'}
      style={[
        StyleSheet.absoluteFill,
        styles.ground,
        { opacity: leaving.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ]}
    >
      <Animated.Image
        source={mark}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Valence"
        style={[
          styles.mark,
          {
            opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] }),
            transform: [
              {
                scale: Animated.add(
                  breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }),
                  leaving.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
                ),
              },
            ],
          },
        ]}
      />
    </Animated.View>
  );
};

ASplash.displayName = 'ASplash';

export { ASplash };
