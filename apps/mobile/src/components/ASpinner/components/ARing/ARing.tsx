import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ASegment } from '@ValenceMobile/components/ASpinner/components/ASegment/ASegment';
import { glowOverATurn } from '@ValenceMobile/components/ASpinner/components/ARing/glowOverATurn';
import { segmentsLitAt } from '@ValenceCore/functions/segmentsLitAt';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { ARingProps } from './ARing.types';
import { say } from '@ValenceI18n/say';

const SEGMENTS = 8;

const TICK_MILLISECONDS = 360;

const FINISH_TICK_MILLISECONDS = 45;

const FADES_OVER = 300;

const DIM = 0.18;

const GAP_SHARE = 0.38;

const ICON_SHARE = 0.8;

const HELD_STILL = { from: 0, lit: SEGMENTS - 2 };

const styles = StyleSheet.create({
  whole: { alignSelf: 'center' },
});

/**
 * The ring Valence's loading mark is drawn with, in whatever colour it is given, as the web draws
 * it: eight short segments round a ring, lighting one by one until it is full and then going dark
 * from where they began, turned by a native animation rather than drawn again each tick. Held
 * still, most of the way lit, for somebody who asked for less movement. Told the wait is over, it
 * fills the rest of the ring quickly and says so once it is whole.
 *
 * @param colour - The colour of the lit segments.
 * @param size - How wide it is drawn.
 * @param label - What is being waited for, read out in place of the mark.
 * @param isFinishing - Whether the wait is over and the ring should fill the rest quickly.
 * @param onFilled - Told once the ring is whole after finishing.
 */
const ARing = ({
  colour,
  size = 24,
  label = say('common.reading'),
  isFinishing = false,
  onFilled,
}: ARingProps) => {
  const isStill = usePrefersStillness();
  const [turning] = useState(() => new Animated.Value(0));
  const [segments] = useState(() =>
    Array.from({ length: SEGMENTS }, (_, at) => ({
      turned: turning.interpolate({
        ...glowOverATurn(at, SEGMENTS, FADES_OVER / TICK_MILLISECONDS, DIM, EASINGS.outCubic),
        extrapolate: 'clamp',
      }),
      held: new Animated.Value(DIM),
    })),
  );
  const [finish, setFinish] = useState<{ from: number; lit: number } | null>(null);
  const turnedFrom = useRef<number | null>(null);
  const wasLit = useRef<readonly boolean[]>([]);
  const held = finish ?? (isStill ? HELD_STILL : null);

  useEffect(() => {
    if (isStill || isFinishing) {
      return undefined;
    }

    const turn = Animated.loop(
      Animated.timing(turning, {
        toValue: SEGMENTS * 2,
        duration: SEGMENTS * 2 * TICK_MILLISECONDS,
        easing: EASINGS.linear,
        useNativeDriver: true,
      }),
    );

    turning.setValue(0);
    turnedFrom.current = Date.now();
    turn.start();

    return () => {
      turn.stop();
    };
  }, [isStill, isFinishing, turning]);

  useEffect(() => {
    if (!isFinishing) {
      setFinish(null);

      return undefined;
    }

    if (isStill) {
      onFilled?.();

      return undefined;
    }

    const started = turnedFrom.current;

    setFinish(
      (was) =>
        was ??
        segmentsLitAt(
          started === null ? 0 : Math.floor((Date.now() - started) / TICK_MILLISECONDS),
          SEGMENTS,
        ),
    );

    const timer = setInterval(() => {
      setFinish((was) => {
        if (was === null) {
          return was;
        }

        if (was.lit < SEGMENTS) {
          return { ...was, lit: was.lit + 1 };
        }

        return was.from > 0 ? { ...was, from: was.from - 1 } : was;
      });
    }, FINISH_TICK_MILLISECONDS);

    return () => {
      clearInterval(timer);
    };
  }, [isFinishing, isStill, onFilled]);

  useEffect(() => {
    if (held === null) {
      wasLit.current = [];

      return;
    }

    const isFirst = wasLit.current.length === 0;
    const lit = segments.map((_, at) => at >= held.from && at < held.lit);

    segments.forEach((segment, at) => {
      const isLit = lit[at] === true;

      if (isFirst) {
        segment.held.setValue(isLit ? 1 : DIM);
      } else if (wasLit.current[at] !== isLit) {
        Animated.timing(segment.held, {
          toValue: isLit ? 1 : DIM,
          duration: FADES_OVER,
          easing: EASINGS.outCubic,
          useNativeDriver: true,
        }).start();
      }
    });
    wasLit.current = lit;
  }, [held, segments]);

  useEffect(() => {
    if (finish !== null && finish.lit === SEGMENTS && finish.from === 0) {
      onFilled?.();
    }
  }, [finish, onFilled]);

  const drawn = size * ICON_SHARE;
  const stroke = Math.max(1.5, drawn / 9);
  const radius = (drawn - stroke) / 2;
  const length = ((2 * Math.PI * radius) / SEGMENTS) * (1 - GAP_SHARE);

  return (
    <View
      style={[styles.whole, { height: size, width: size }]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      {segments.map((segment, at) => (
        <ASegment
          key={at}
          glow={held === null ? segment.turned : segment.held}
          colour={colour}
          at={at}
          count={SEGMENTS}
          length={length}
          stroke={stroke}
          radius={radius}
        />
      ))}
    </View>
  );
};

ARing.displayName = 'ARing';

export { ARing };
