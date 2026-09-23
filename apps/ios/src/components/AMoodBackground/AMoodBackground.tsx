import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { HOUSE_LIGHTS } from '@ValenceCore/tokens/houseLights';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import { APaletteLayer } from '@ValencePhone/components/AMoodBackground/components/APaletteLayer/APaletteLayer';
import type { ALight, AMoodBackgroundProps } from './AMoodBackground.types';

const BLOOMS = [
  { at: '12% 8%', strength: 0.36 },
  { at: '88% 14%', strength: 0.36 },
  { at: '10% 48%', strength: 0.28 },
  { at: '90% 52%', strength: 0.28 },
  { at: '20% 86%', strength: 0.22 },
  { at: '82% 90%', strength: 0.22 },
] as const;

const DRIFTS = [34_000, 46_000, 58_000, 41_000, 52_000, 38_000] as const;

const DRIFTS_BY = 28;

const CHANGES_OVER = 1200;

const NO_LIGHTS: readonly string[] = [];

const NO_PALETTE: readonly ALight[] = [];

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  spills: {
    bottom: -DRIFTS_BY,
    left: -DRIFTS_BY,
    position: 'absolute',
    right: -DRIFTS_BY,
    top: -DRIFTS_BY,
  },
});

/**
 * The lights behind the way in, as the web's mood background draws them: soft blooms of colour
 * across the screen, each drifting on a slow cycle of its own, and fading into the page towards the
 * foot.
 *
 * With no lights of its own it is lit in the house colours. Given some — the colour of whoever
 * was picked — the first bloom takes on the first of them and the rest go dark, as on the web, and
 * the change is a slow crossfade rather than a cut.
 *
 * Given a palette instead — the colours read from a picture, as the home page reads its hero — each
 * colour blooms where it was read, and a new palette fades in as the last fades out, so the page
 * changes colour with the hero rather than jumping.
 *
 * @param lights - The colours to light it with, or none for the house colours.
 * @param palette - Colours read from a picture, each with where it belongs, which light it instead.
 */
const AMoodBackground = ({ lights = NO_LIGHTS, palette = NO_PALETTE }: AMoodBackgroundProps) => {
  const colours = useTheColours();
  const [drifts] = useState(() => DRIFTS.map(() => new Animated.Value(0)));
  const [lit] = useState(() => new Animated.Value(lights.length === 0 ? 0 : 1));
  const [held, setHeld] = useState(lights[0] ?? null);
  const chosen = lights[0] ?? null;
  const [layers, setLayers] = useState<
    { key: string; palette: readonly ALight[]; isLeaving: boolean }[]
  >([]);
  const [paletted] = useState(() => new Animated.Value(0));
  const paletteKey = palette.map((light) => light.colour).join('|');

  useEffect(() => {
    Animated.timing(paletted, {
      toValue: paletteKey === '' ? 0 : 1,
      duration: CHANGES_OVER,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (paletteKey === '') {
      return undefined;
    }

    setLayers((was) => [
      ...was
        .filter((layer) => layer.key !== paletteKey)
        .map((layer) => ({ ...layer, isLeaving: true })),
      { key: paletteKey, palette, isLeaving: false },
    ]);

    const settled = setTimeout(() => {
      setLayers((was) => was.filter((layer) => !layer.isLeaving));
    }, CHANGES_OVER + 100);

    return () => {
      clearTimeout(settled);
    };
  }, [palette, paletteKey, paletted]);

  useEffect(() => {
    const running = drifts.map((drift, at) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(drift, {
            toValue: 1,
            duration: DRIFTS[at] ?? DRIFTS[0],
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(drift, {
            toValue: 0,
            duration: DRIFTS[at] ?? DRIFTS[0],
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    running.forEach((one) => {
      one.start();
    });

    return () => {
      running.forEach((one) => {
        one.stop();
      });
    };
  }, [drifts]);

  useEffect(() => {
    if (chosen !== null) {
      setHeld(chosen);
    }

    Animated.timing(lit, {
      toValue: chosen === null ? 0 : 1,
      duration: CHANGES_OVER,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [chosen, lit]);

  /**
   * One bloom of light, drifting on its own cycle.
   *
   * @param at - Which bloom.
   * @param colour - Its colour, or nothing for a bloom left dark.
   * @returns The bloom.
   */
  const bloom = (at: number, colour: string | null) => {
    const where = BLOOMS[at] ?? BLOOMS[0];
    const drift = drifts[at] ?? lit;
    const way = at % 2 === 0 ? 1 : -1;

    return colour === null ? null : (
      <Animated.View
        key={at}
        style={[
          styles.spills,
          {
            experimental_backgroundImage: `radial-gradient(ellipse 80% 45% at ${where.at}, ${withAlpha(colour, where.strength)}, transparent 70%)`,
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, DRIFTS_BY * way],
                }),
              },
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -DRIFTS_BY * way],
                }),
              },
            ],
          },
        ]}
      />
    );
  };

  return (
    <View pointerEvents="none" style={styles.fills}>
      <Animated.View
        style={[
          styles.fills,
          {
            opacity: Animated.multiply(
              lit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              paletted.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            ),
          },
        ]}
      >
        {BLOOMS.map((_, at) => bloom(at, HOUSE_LIGHTS[at % HOUSE_LIGHTS.length] ?? null))}
      </Animated.View>

      <Animated.View style={[styles.fills, { opacity: lit }]}>
        {BLOOMS.map((_, at) => bloom(at, at === 0 ? held : null))}
      </Animated.View>

      {layers.map((layer) => (
        <APaletteLayer
          key={layer.key}
          palette={layer.palette}
          drifts={drifts}
          driftsBy={DRIFTS_BY}
          isLeaving={layer.isLeaving}
        />
      ))}

      <View
        style={[
          styles.fills,
          {
            experimental_backgroundImage: `linear-gradient(to bottom, ${withAlpha(colours.surface, 0)} 38%, ${colours.surface} 96%)`,
          },
        ]}
      />
    </View>
  );
};

AMoodBackground.displayName = 'AMoodBackground';

export { AMoodBackground };
