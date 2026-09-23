import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import mark from '@ValenceTv/assets/valence-mark.png';
import type { SplashProps } from './Splash.types';

const MARK = { width: 160, height: 117 };

const BREATHES_MS = 1400;

const LEAVES_MS = 520;

/**
 * What Valence shows as it opens, taking over from the television's launch screen without a seam:
 * the same mark, at the same size and in the same place, on the same dark ground. It breathes
 * gently while the app finds out who is signed in, and once it knows, the mark swells and fades and
 * the ground fades with it, uncovering the first screen beneath.
 *
 * @param isDone - Whether the app is ready to show its first screen.
 * @param onGone - Told once it has faded away, so it can be taken off the screen.
 */
const Splash = ({ isDone, onGone }: SplashProps) => {
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
      return;
    }

    Animated.timing(leaving, {
      toValue: 1,
      duration: LEAVES_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onGone();
    });
  }, [isDone, leaving, onGone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.ground,
        { opacity: leaving.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ]}
    >
      <Animated.Image
        source={mark}
        resizeMode="contain"
        style={[
          MARK,
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

Splash.displayName = 'Splash';

const styles = StyleSheet.create({
  ground: {
    backgroundColor: tokens.colours.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { Splash };
