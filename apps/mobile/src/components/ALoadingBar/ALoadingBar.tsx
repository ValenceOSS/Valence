import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { ALoadingBarProps } from './ALoadingBar.types';

const WIDE = 160;

const PIECE = WIDE * 0.4;

const SLIDES_MS = 1400;

const styles = StyleSheet.create({
  piece: { borderRadius: 2, height: 3, width: PIECE },
  track: { borderRadius: 2, height: 3, overflow: 'hidden', width: WIDE },
});

/**
 * A slim bar saying something is under way without saying how far, as the web's splash draws it:
 * a short length sliding along the track over and over, never filling. For anybody who has asked
 * for less motion it rests in the middle.
 *
 * @param colour - The colour of the sliding length; the track is a faint wash of it.
 * @param isStill - Whether to keep it still.
 */
const ALoadingBar = ({ colour, isStill }: ALoadingBarProps) => {
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
        easing: EASINGS.inOutQuad,
        useNativeDriver: true,
      }),
    );

    sliding.start();

    return () => {
      sliding.stop();
    };
  }, [along, isStill]);

  return (
    <View style={[styles.track, { backgroundColor: withAlpha(colour, 0.2) }]}>
      <Animated.View
        style={[
          styles.piece,
          {
            backgroundColor: colour,
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

ALoadingBar.displayName = 'ALoadingBar';

export { ALoadingBar };
