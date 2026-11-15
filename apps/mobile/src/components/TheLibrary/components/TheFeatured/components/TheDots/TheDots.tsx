import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { TheDotsProps } from './TheDots.types';

const DOT = 6;

const PILL = 24;

const GAP = 6;

const STRETCH = PILL - DOT;

const DIM = 0.22;

const GROWS_OVER = 220;

const styles = StyleSheet.create({
  dots: { alignSelf: 'center', height: DOT },
  place: { height: DOT, position: 'absolute', top: 0, width: PILL },
  dim: { ...StyleSheet.absoluteFill, opacity: DIM },
  cap: { borderRadius: DOT / 2, height: DOT, left: 0, position: 'absolute', top: 0, width: DOT },
  body: {
    height: DOT,
    left: DOT / 2,
    position: 'absolute',
    top: 0,
    transformOrigin: 'left center',
    width: STRETCH,
  },
  filling: { ...StyleSheet.absoluteFill, borderRadius: DOT / 2, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFill, transformOrigin: 'left center' },
});

/**
 * How far grown each dot starts, the one showing a pill and the rest dots.
 *
 * @param count - How many dots there are.
 * @param at - Which one is showing.
 * @returns How grown each is, from a dot at nothing to a pill at one.
 */
const grownFrom = (count: number, at: number): Animated.Value[] =>
  Array.from({ length: count }, (_, index) => new Animated.Value(index === at ? 1 : 0));

/**
 * Which of the featured titles is showing, as the web's hero says it: a dot for each, the one
 * showing grown into a pill that fills from its left as the title plays, so it can be seen how long
 * is left before the next comes round.
 *
 * Nothing is laid out again as the pill grows or the next dot takes over: each dot is two round ends
 * and a stretch between them, the far end slid out and the stretch scaled to make the pill, and the
 * dots after it slid along to make room, all on the native side, as is the fill.
 *
 * @param count - How many titles there are.
 * @param at - Which one is showing.
 * @param filled - How far through the one showing is, from nothing to the whole of it.
 */
const TheDots = ({ count, at, filled }: TheDotsProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const [grown, setGrown] = useState(() => ({ count, values: grownFrom(count, at) }));

  if (grown.count !== count) {
    setGrown({ count, values: grownFrom(count, at) });
  }

  const moves = useMemo(() => {
    const stretches = grown.values.map((value) =>
      value.interpolate({ inputRange: [0, 1], outputRange: [0, STRETCH] }),
    );

    return stretches.map((stretch, index) => ({
      stretch,
      along: stretches
        .slice(0, index)
        .reduce<Animated.AnimatedInterpolation<number> | Animated.AnimatedAddition | null>(
          (sum, before) => (sum === null ? before : Animated.add(sum, before)),
          null,
        ),
    }));
  }, [grown]);

  useEffect(() => {
    const growing = grown.values.map((value, index) => {
      const toValue = index === at ? 1 : 0;

      if (isStill) {
        value.setValue(toValue);

        return null;
      }

      const grow = Animated.timing(value, {
        toValue,
        duration: GROWS_OVER,
        easing: EASINGS.outCubic,
        useNativeDriver: true,
      });

      grow.start();

      return grow;
    });

    return () => {
      growing.forEach((grow) => {
        grow?.stop();
      });
    };
  }, [at, isStill, grown]);

  if (count <= 1) {
    return null;
  }

  return (
    <View style={[styles.dots, { width: (count - 1) * (DOT + GAP) + PILL }]}>
      {grown.values.map((value, index) => {
        const move = moves[index];

        return (
          <Animated.View
            key={index}
            testID="dot"
            style={[
              styles.place,
              { left: index * (DOT + GAP) },
              move?.along === null || move === undefined
                ? null
                : { transform: [{ translateX: move.along }] },
            ]}
          >
            <View style={styles.dim} needsOffscreenAlphaCompositing>
              <View style={[styles.cap, { backgroundColor: colours.text }]} />
              <Animated.View
                style={[
                  styles.body,
                  { backgroundColor: colours.text, transform: [{ scaleX: value }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.cap,
                  {
                    backgroundColor: colours.text,
                    transform: [{ translateX: move?.stretch ?? 0 }],
                  },
                ]}
              />
            </View>
            {index === at ? (
              <Animated.View style={[styles.filling, { opacity: value }]}>
                <Animated.View
                  testID="dot-fill"
                  style={[
                    styles.fill,
                    { backgroundColor: colours.text, transform: [{ scaleX: filled }] },
                  ]}
                />
              </Animated.View>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
};

TheDots.displayName = 'TheDots';

export { TheDots };
