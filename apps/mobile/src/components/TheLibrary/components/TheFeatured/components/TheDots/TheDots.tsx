import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { TheDotsProps } from './TheDots.types';

const DOT = 6;

const PILL = 24;

const GROWS_OVER = 220;

const styles = StyleSheet.create({
  dot: { borderRadius: DOT / 2, height: DOT, overflow: 'hidden' },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  fill: { ...StyleSheet.absoluteFill, borderRadius: DOT / 2, transformOrigin: 'left center' },
});

/**
 * Which of the featured titles is showing, as the web's hero says it: a dot for each, the one
 * showing grown into a pill that fills from its left as the title plays, so it can be seen how long
 * is left before the next comes round. The fill is scaled on the native side; only the pill's
 * growing and shrinking, a few points across, is laid out.
 *
 * @param count - How many titles there are.
 * @param at - Which one is showing.
 * @param filled - How far through the one showing is, from nothing to the whole of it.
 */
const TheDots = ({ count, at, filled }: TheDotsProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const [widths] = useState(() => new Map<number, Animated.Value>());

  const widthOf = useCallback(
    (index: number) => {
      const known = widths.get(index);

      if (known !== undefined) {
        return known;
      }

      const made = new Animated.Value(index === at ? PILL : DOT);

      widths.set(index, made);

      return made;
    },
    [widths, at],
  );

  useEffect(
    () => () => {
      widths.forEach((width) => {
        width.stopAnimation();
      });
    },
    [widths],
  );

  useEffect(() => {
    Array.from({ length: count }, (_, index) => index).forEach((index) => {
      const toValue = index === at ? PILL : DOT;
      const width = widthOf(index);

      if (isStill) {
        width.setValue(toValue);

        return;
      }

      Animated.timing(width, {
        toValue,
        duration: GROWS_OVER,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
  }, [at, count, isStill, widthOf]);

  if (count <= 1) {
    return null;
  }

  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, index) => index).map((index) => (
        <Animated.View
          key={index}
          testID="dot"
          style={[
            styles.dot,
            { backgroundColor: withAlpha(colours.text, 0.22), width: widthOf(index) },
          ]}
        >
          {index === at ? (
            <Animated.View
              testID="dot-fill"
              style={[
                styles.fill,
                { backgroundColor: colours.text, transform: [{ scaleX: filled }] },
              ]}
            />
          ) : null}
        </Animated.View>
      ))}
    </View>
  );
};

TheDots.displayName = 'TheDots';

export { TheDots };
