import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { LoadingBarProps } from './LoadingBar.types';

const WIDE = 240;

const PIECE = WIDE * 0.4;

const SLIDES_MS = 1400;

const SLIDES = Easing.inOut((t) => Easing.quad(t));

/**
 * A slim bar saying something is under way without saying how far, as the web's splash draws it:
 * a short length sliding along the track over and over, never filling, in the television's text
 * colour on a faint wash of it. For anybody who has asked for less motion it rests in the middle.
 *
 * @param isStill - Whether to keep it still.
 */
const LoadingBar = ({ isStill }: LoadingBarProps) => {
  const [along] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isStill) {
      along.setValue(0.5);

      return undefined;
    }

    const sliding = Animated.loop(
      Animated.timing(along, {
        toValue: 1,
        duration: SLIDES_MS,
        easing: SLIDES,
        useNativeDriver: true,
      }),
    );

    sliding.start();

    return () => {
      sliding.stop();
    };
  }, [along, isStill]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.piece,
          {
            transform: [
              {
                translateX: along.interpolate({ inputRange: [0, 1], outputRange: [-PIECE, WIDE] }),
              },
            ],
          },
        ]}
      />
    </View>
  );
};

LoadingBar.displayName = 'LoadingBar';

const styles = StyleSheet.create({
  track: {
    width: WIDE,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: tokens.colours.muted,
  },
  piece: { width: PIECE, height: 4, borderRadius: 2, backgroundColor: tokens.colours.text },
});

export { LoadingBar };
