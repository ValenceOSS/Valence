import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import bloom from '@ValenceTv/assets/orb.png';
import dot from '@ValenceTv/assets/dot.png';
import type { WayInBackdropProps } from './WayInBackdrop.types';

const HOUSE_LIGHTS = [
  'rgb(56,68,150)',
  'rgb(48,60,138)',
  'rgb(44,54,124)',
  'rgb(50,62,142)',
  'rgb(40,50,118)',
] as const;

const COLUMNS = [0.08, 0.36, 0.64, 0.92] as const;

const ROWS = [
  { y: 0.1, strength: 0.36 },
  { y: 0.48, strength: 0.28 },
  { y: 0.86, strength: 0.22 },
] as const;

const DRIFTS_S = [34, 46, 58, 41, 52, 38, 61, 44, 49, 36, 55, 43] as const;

const REACH = { across: 0.48 * 2 * 0.7, down: 0.46 * 2 * 0.7 };

const WANDERS = 0.08;

const BLOOMS = ROWS.flatMap((row, down) =>
  COLUMNS.map((x, across) => {
    const at = down * COLUMNS.length + across;

    return { x, y: row.y, strength: row.strength, drift: DRIFTS_S[at] ?? 40, at };
  }),
);

/**
 * The ground behind every screen of the way in, as the web's sign-in page lights it: twelve soft
 * blooms of the house's blues laid out in rows, strongest along the top, each drifting slowly on a
 * cycle of its own, under a faint field of dots and fading into the page towards the foot. Once
 * somebody has picked their face, the blooms take on its colour.
 *
 * Each bloom is a feathered circle tinted its colour, so its edge melts without anything being
 * blurred, and every drift runs on the native driver, so none of it costs JavaScript a frame.
 *
 * @param tint - The colour of whoever is signing in, where one has been picked.
 */
const WayInBackdrop = ({ tint = null }: WayInBackdropProps) => {
  const screen = useWindowDimensions();
  const [drifts] = useState(() => BLOOMS.map(() => new Animated.Value(0)));

  useEffect(() => {
    const going = drifts.map((drifting, at) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(drifting, {
            toValue: 1,
            duration: (BLOOMS[at]?.drift ?? 40) * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(drifting, {
            toValue: 0,
            duration: (BLOOMS[at]?.drift ?? 40) * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    for (const loop of going) {
      loop.start();
    }

    return () => {
      for (const loop of going) {
        loop.stop();
      }
    };
  }, [drifts]);

  const width = screen.width * REACH.across;
  const height = screen.height * REACH.down;

  return (
    <View style={[StyleSheet.absoluteFill, styles.surface]} pointerEvents="none">
      {BLOOMS.map((one) => {
        const drifting = drifts[one.at] ?? new Animated.Value(0);
        const swing = one.at % 2 === 0 ? 1 : -1;

        return (
          <Animated.Image
            key={`bloom-${one.at.toString()}`}
            source={bloom}
            resizeMode="stretch"
            style={[
              styles.bloom,
              {
                width,
                height,
                left: screen.width * one.x - width / 2,
                top: screen.height * one.y - height / 2,
                opacity: one.strength,
                tintColor: tint ?? HOUSE_LIGHTS[one.at % HOUSE_LIGHTS.length],
                transform: [
                  {
                    translateX: drifting.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        -screen.width * WANDERS * swing,
                        screen.width * WANDERS * swing,
                      ],
                    }),
                  },
                  {
                    translateY: drifting.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [
                        -screen.height * WANDERS,
                        screen.height * WANDERS * swing,
                        screen.height * WANDERS,
                      ],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}

      <Image source={dot} resizeMode="repeat" style={StyleSheet.absoluteFill} />

      <LinearGradient
        colors={[withAlpha(tokens.colours.canvas, 0), tokens.colours.canvas]}
        locations={[0.38, 0.96]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

WayInBackdrop.displayName = 'WayInBackdrop';

const styles = StyleSheet.create({
  surface: { backgroundColor: tokens.colours.canvas, overflow: 'hidden' },
  bloom: { position: 'absolute' },
});

export { WayInBackdrop };
