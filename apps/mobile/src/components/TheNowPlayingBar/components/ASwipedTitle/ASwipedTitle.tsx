import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { ASwipedTitleProps } from './ASwipedTitle.types';

const TURNS_PAST = 48;

const TURNS_FASTER_THAN = 0.5;

const GOES_OFF_MS = 140;

const OFF_BY = 220;

const styles = StyleSheet.create({
  whole: { flex: 1, overflow: 'hidden' },
});

/**
 * What is playing, which a swipe sideways moves on from: to the left the next song, to the right
 * the one before, the words sliding off the way they were pushed and the next ones sliding in from
 * the other side, as a music app's bar does. Short of far enough, they spring back.
 *
 * @param onNext - Told to play the next song.
 * @param onPrevious - Told to play the one before.
 * @param children - What is playing, as it is written.
 */
const ASwipedTitle = ({ onNext, onPrevious, children }: ASwipedTitleProps) => {
  const isStill = usePrefersStillness();
  const [shift] = useState(() => new Animated.Value(0));
  const latest = useRef({ onNext, onPrevious, isStill });

  useEffect(() => {
    latest.current = { onNext, onPrevious, isStill };
  });

  const [swipe] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        shift.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const way =
          gesture.dx < -TURNS_PAST || gesture.vx < -TURNS_FASTER_THAN
            ? -1
            : gesture.dx > TURNS_PAST || gesture.vx > TURNS_FASTER_THAN
              ? 1
              : 0;

        if (way === 0) {
          Animated.spring(shift, { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true }).start();

          return;
        }

        const { onNext: next, onPrevious: previous, isStill: still } = latest.current;

        if (still) {
          shift.setValue(0);
          (way < 0 ? next : previous)();

          return;
        }

        Animated.timing(shift, {
          toValue: way * OFF_BY,
          duration: GOES_OFF_MS,
          useNativeDriver: true,
        }).start(() => {
          (way < 0 ? next : previous)();
          shift.setValue(-way * OFF_BY);
          Animated.spring(shift, { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true }).start();
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(shift, { ...SPRINGS.liquid, toValue: 0, useNativeDriver: true }).start();
      },
    }),
  );

  return (
    <Animated.View style={styles.whole} {...swipe.panHandlers}>
      <Animated.View
        style={{
          opacity: shift.interpolate({
            inputRange: [-OFF_BY, 0, OFF_BY],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          }),
          transform: [{ translateX: shift }],
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};

ASwipedTitle.displayName = 'ASwipedTitle';

export { ASwipedTitle };
