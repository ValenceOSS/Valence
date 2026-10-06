import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { EQUALISER_BARS } from '@ValenceCore/tokens/EQUALISER_BARS';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { AEqualiserProps } from './AEqualiser.types';

const styles = StyleSheet.create({
  bar: { borderRadius: 2, height: '100%', transformOrigin: 'bottom', width: 3 },
  whole: { alignItems: 'flex-end', flexDirection: 'row', gap: 2, height: 14, width: 18 },
});

/**
 * Four bars that rise and fall while something plays, marking the song playing in a list of songs
 * at a glance, as the web's do and to the same rhythms.
 *
 * Each bar keeps its own pace, so the four never move together and read as sound rather than as a
 * loading indicator. Stopped — or for somebody who has asked for less movement — they hold still at
 * uneven heights, which still reads as the same mark.
 *
 * @param label - What it marks, read out to anybody who cannot see it.
 * @param isMoving - Whether the bars move, or hold still.
 * @param colour - What colour the bars are.
 */
const AEqualiser = ({ label, isMoving, colour }: AEqualiserProps) => {
  const isStill = usePrefersStillness();
  const [heights] = useState(() => EQUALISER_BARS.map((bar) => new Animated.Value(bar.rests)));
  const moves = isMoving && !isStill;

  useEffect(() => {
    if (!moves) {
      EQUALISER_BARS.forEach((bar, at) => {
        heights[at]?.setValue(bar.rests);
      });

      return undefined;
    }

    const loops = EQUALISER_BARS.map((bar, at) => {
      const height = heights[at];

      if (height === undefined) {
        return null;
      }

      height.setValue(bar.heights[0]);

      return Animated.loop(
        Animated.sequence(
          bar.heights.slice(1).map((toValue) =>
            Animated.timing(height, {
              toValue,
              duration: bar.milliseconds / (bar.heights.length - 1),
              easing: (along) => Easing.linear(along),
              useNativeDriver: true,
            }),
          ),
        ),
      );
    });

    for (const loop of loops) {
      loop?.start();
    }

    return () => {
      for (const loop of loops) {
        loop?.stop();
      }
    };
  }, [moves, heights]);

  return (
    <View style={styles.whole} accessible accessibilityRole="image" accessibilityLabel={label}>
      {heights.map((height, at) => (
        <Animated.View
          key={at.toString()}
          style={[styles.bar, { backgroundColor: colour, transform: [{ scaleY: height }] }]}
        />
      ))}
    </View>
  );
};

AEqualiser.displayName = 'AEqualiser';

export { AEqualiser };
