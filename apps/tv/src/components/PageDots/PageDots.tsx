import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { PageDot } from '@ValenceTv/components/PageDots/components/PageDot/PageDot';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { PAGE_DOT } from '@ValenceTv/components/PageDots/PAGE_DOT';
import { placeOfDot } from '@ValenceTv/components/PageDots/placeOfDot';
import type { PageDotsProps } from './PageDots.types';

/**
 * The dots that say how many things take turns in a space, which one it is now and how long it has
 * left: the current dot fills as its turn runs, and filling up is what ends the turn.
 * Handing over to the next turn draws the old pill back in and stretches the new one out, the dots
 * see-through as one so that where a pill's parts meet never shows.
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
  const [fill] = useState(() => new Animated.Value(0));
  const done = useRef(onTurnDone);
  const isStill = useKeepsStill();

  useEffect(() => {
    done.current = onTurnDone;
  });

  useEffect(() => {
    fill.setValue(0);
  }, [current, fill]);

  useEffect(() => {
    if (isStill) {
      if (!isRunning) {
        return;
      }

      const turning = setTimeout(() => {
        done.current();
      }, turnMs);

      return () => {
        clearTimeout(turning);
      };
    }

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
          fill.setValue(0);
          done.current();
        }
      });
    });

    return () => {
      running?.stop();
    };
  }, [current, isRunning, isStill, fill, turnMs]);

  const last = placeOfDot(count - 1, current);

  return (
    <View style={[styles.row, { width: last.x + last.width }]}>
      <View needsOffscreenAlphaCompositing style={styles.dots}>
        {Array.from({ length: count }, (_, at) => (
          <PageDot key={at} at={at} current={current} />
        ))}
      </View>

      <View style={[styles.filling, { left: placeOfDot(current, current).x }]}>
        <Animated.View style={[styles.filled, { transform: [{ scaleX: fill }] }]} />
      </View>
    </View>
  );
};

PageDots.displayName = 'PageDots';

const styles = StyleSheet.create({
  row: { height: PAGE_DOT.size },
  dots: { ...StyleSheet.absoluteFill, opacity: 0.35 },
  filling: {
    position: 'absolute',
    top: 0,
    width: PAGE_DOT.currentWidth,
    height: PAGE_DOT.size,
    borderRadius: PAGE_DOT.size / 2,
    overflow: 'hidden',
  },
  filled: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    transformOrigin: 'left center',
  },
});

export { PageDots };
