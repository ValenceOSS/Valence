import { useEffect, useRef } from 'react';
import { Animated, Easing, LayoutAnimation, StyleSheet, View } from 'react-native';
import { PageDot } from '@ValenceTv/components/PageDots/components/PageDot/PageDot';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PageDotsProps } from './PageDots.types';

/**
 * The dots that say how many things take turns in a space, which one it is now and how long it has
 * left: the current dot fills as its turn runs, and filling up is what ends the turn.
 * Handing over to the next turn draws the old pill back in and stretches the new one out.
 *
 * Holding the turn — while the remote is on what is showing, or something covers it — stops the
 * fill where it is, and letting go carries on from there rather than starting the turn again.
 *
 * @param count - How many there are.
 * @param current - Which is showing, from nought.
 * @param turnMs - How long a whole turn lasts.
 * @param isRunning - Whether the turn is running, rather than held.
 * @param onTurnDone - Told when the current turn has run out.
 */
const PageDots = ({ count, current, turnMs, isRunning, onTurnDone }: PageDotsProps) => {
  const fill = useRef(new Animated.Value(0)).current;
  const done = useRef(onTurnDone);

  useEffect(() => {
    done.current = onTurnDone;
  });

  useEffect(() => {
    fill.setValue(0);
  }, [current, fill]);

  useEffect(() => {
    if (!isRunning) {
      fill.stopAnimation();

      return;
    }

    let running: Animated.CompositeAnimation | null = null;

    fill.stopAnimation((reached) => {
      running = Animated.timing(fill, {
        toValue: 1,
        duration: Math.max(0, (1 - reached) * turnMs),
        easing: Easing.linear,
        useNativeDriver: true,
      });

      running.start(({ finished }) => {
        if (finished) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          done.current();
        }
      });
    });

    return () => {
      running?.stop();
    };
  }, [current, isRunning, fill, turnMs]);

  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, at) => (
        <PageDot key={at} isCurrent={at === current} fill={fill} />
      ))}
    </View>
  );
};

PageDots.displayName = 'PageDots';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: tokens.space.xs, alignItems: 'center' },
});

export { PageDots };
