import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { APaletteLayerProps } from './APaletteLayer.types';

const STRENGTH_BY_ROW = [0.36, 0.28, 0.22] as const;

const ACROSS = 4;

const COMES_IN_OVER = 1200;

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * One set of lights read from a picture, each a bloom of its colour where it was read — brighter
 * along the top, softer towards the foot, as the web weighs them — fading in as it arrives and out
 * as the next set replaces it, so the two cross rather than one being laid over the other and then
 * taken away.
 *
 * @param palette - The lights, in rows of four from the top.
 * @param drifts - The slow cycles the blooms drift on, shared with the rest of the background.
 * @param driftsBy - How far a bloom drifts.
 * @param isLeaving - Whether it is being replaced, and so fading out.
 */
const APaletteLayer = ({ palette, drifts, driftsBy, isLeaving }: APaletteLayerProps) => {
  const [shown] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const fading = Animated.timing(shown, {
      toValue: isLeaving ? 0 : 1,
      duration: COMES_IN_OVER,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });

    fading.start();

    return () => {
      fading.stop();
    };
  }, [shown, isLeaving]);

  return (
    <Animated.View style={[styles.fills, { opacity: shown }]}>
      {palette.map((light, at) => {
        const drift = drifts[at % drifts.length];
        const way = at % 2 === 0 ? 1 : -1;
        const strength = STRENGTH_BY_ROW[Math.floor(at / ACROSS)] ?? STRENGTH_BY_ROW[2];

        return drift === undefined ? null : (
          <Animated.View
            key={`${light.at}:${light.colour}`}
            style={{
              bottom: -driftsBy,
              experimental_backgroundImage: `radial-gradient(ellipse 60% 30% at ${light.at}, ${withAlpha(light.colour, strength)}, transparent 70%)`,
              left: -driftsBy,
              position: 'absolute',
              right: -driftsBy,
              top: -driftsBy,
              transform: [
                {
                  translateX: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, driftsBy * way],
                  }),
                },
                {
                  translateY: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -driftsBy * way],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </Animated.View>
  );
};

APaletteLayer.displayName = 'APaletteLayer';

export { APaletteLayer };
