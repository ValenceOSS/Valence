import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import type { WashLayerProps } from './WashLayer.types';

const STRENGTH_BY_ROW = [0.75, 0.6, 0.5] as const;

const ACROSS = 4;

const CROSSFADES_MS = 900;

/**
 * One picture's lights laid over the page as soft glows, each its colour where in the picture it
 * came from, fading in over whatever was there before where it is arriving.
 *
 * @param lights - The picture's lights.
 * @param isArriving - Whether it fades in, rather than being there already.
 */
const WashLayer = ({ lights, isArriving }: WashLayerProps) => {
  const [shown] = useState(() => new Animated.Value(isArriving ? 0 : 1));

  useEffect(() => {
    Animated.timing(shown, { toValue: 1, duration: CROSSFADES_MS, useNativeDriver: true }).start();
  }, [shown]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: shown }]}>
      {lights.map((light, at) => {
        const strength = STRENGTH_BY_ROW[Math.floor(at / ACROSS)] ?? STRENGTH_BY_ROW[2];

        return (
          <View
            key={`${light.at}:${light.colour}`}
            style={[
              StyleSheet.absoluteFill,
              {
                experimental_backgroundImage: `radial-gradient(ellipse 60% 45% at ${light.at}, ${withAlpha(light.colour, strength)}, transparent 70%)`,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

WashLayer.displayName = 'WashLayer';

export { WashLayer };
