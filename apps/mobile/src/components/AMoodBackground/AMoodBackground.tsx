import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { HOUSE_LIGHTS } from '@ValenceCore/tokens/houseLights';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { APaletteLayer } from '@ValenceMobile/components/AMoodBackground/components/APaletteLayer/APaletteLayer';
import type { ALight, AMoodBackgroundProps } from './AMoodBackground.types';

const BLOOMS = [
  { at: '12% 8%', strength: 0.36 },
  { at: '88% 14%', strength: 0.36 },
  { at: '10% 48%', strength: 0.28 },
  { at: '90% 52%', strength: 0.28 },
  { at: '20% 86%', strength: 0.22 },
  { at: '82% 90%', strength: 0.22 },
] as const;

const CHANGES_OVER = 1200;

const NO_LIGHTS: readonly string[] = [];

const NO_PALETTE: readonly ALight[] = [];

const styles = StyleSheet.create({
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * The lights behind the way in, as the web's mood background draws them: soft blooms of colour
 * across the screen, fading into the page towards the foot. Unlike the web's they hold still, so
 * while nothing in it is changing the whole of it is kept as one picture, and a page moving over it
 * or beneath it costs one layer rather than a screenful of them. While its colours crossfade it is
 * drawn as it is rather than kept, since a picture of something fading has to be taken again on
 * every frame of the fade.
 *
 * With no lights of its own it is lit in the house colours. Given some — the colour of whoever
 * was picked — the first bloom takes on the first of them and the rest go dark, as on the web, and
 * the change is a slow crossfade rather than a cut.
 *
 * Given a palette instead — the colours read from a picture, as the home page reads its hero — each
 * colour blooms where it was read, and a new palette fades in as the last fades out, so the page
 * changes colour with the hero rather than jumping. Drawn with its palette already known — the
 * player opening onto a cover whose colours were read ahead — it starts lit in them, without the
 * house colours beneath or a fade, so nothing is drawn or crossed that would never be seen.
 *
 * @param lights - The colours to light it with, or none for the house colours.
 * @param palette - Colours read from a picture, each with where it belongs, which light it instead.
 */
const AMoodBackground = ({ lights = NO_LIGHTS, palette = NO_PALETTE }: AMoodBackgroundProps) => {
  const colours = useTheColours();
  const [lit] = useState(() => new Animated.Value(lights.length === 0 ? 0 : 1));
  const [held, setHeld] = useState(lights[0] ?? null);
  const chosen = lights[0] ?? null;
  const paletteKey = palette.map((light) => light.colour).join('|');
  const [layers, setLayers] = useState<
    { key: string; palette: readonly ALight[]; isLeaving: boolean; isThereAlready?: boolean }[]
  >(() =>
    paletteKey === '' ? [] : [{ key: paletteKey, palette, isLeaving: false, isThereAlready: true }],
  );
  const [paletted] = useState(() => new Animated.Value(paletteKey === '' ? 0 : 1));
  const [hasHouseLights, setHasHouseLights] = useState(paletteKey === '');

  const lookingAt = `${paletteKey}/${chosen ?? ''}`;
  const [settledOn, setSettledOn] = useState(lookingAt);

  if (paletteKey === '' && !hasHouseLights) {
    setHasHouseLights(true);
  }

  useEffect(() => {
    const settling = setTimeout(() => {
      setSettledOn(lookingAt);
    }, CHANGES_OVER + 100);

    return () => {
      clearTimeout(settling);
    };
  }, [lookingAt]);

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
   * One bloom of light.
   *
   * @param at - Which bloom.
   * @param colour - Its colour, or nothing for a bloom left dark.
   * @returns The bloom.
   */
  const bloom = (at: number, colour: string | null) => {
    const where = BLOOMS[at] ?? BLOOMS[0];

    return colour === null ? null : (
      <View
        key={at}
        style={[
          styles.fills,
          {
            experimental_backgroundImage: `radial-gradient(ellipse 80% 45% at ${where.at}, ${withAlpha(colour, where.strength)}, transparent 70%)`,
          },
        ]}
      />
    );
  };

  return (
    <View pointerEvents="none" style={styles.fills} shouldRasterizeIOS={settledOn === lookingAt}>
      {hasHouseLights ? (
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
      ) : null}

      <Animated.View style={[styles.fills, { opacity: lit }]}>
        {BLOOMS.map((_, at) => bloom(at, at === 0 ? held : null))}
      </Animated.View>

      {layers.map((layer) => (
        <APaletteLayer
          key={layer.key}
          palette={layer.palette}
          isLeaving={layer.isLeaving}
          isThereAlready={layer.isThereAlready === true}
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
