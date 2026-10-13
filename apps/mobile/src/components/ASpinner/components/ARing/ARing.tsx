import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ASegment } from '@ValenceMobile/components/ASpinner/components/ASegment/ASegment';
import { segmentsLitAt } from '@ValenceCore/functions/segmentsLitAt';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { ARingProps } from './ARing.types';
import { say } from '@ValenceI18n/say';

const SEGMENTS = 8;

const TICK_MILLISECONDS = 360;

const FINISH_TICK_MILLISECONDS = 45;

const GAP_SHARE = 0.38;

const ICON_SHARE = 0.8;

/**
 * The ring Valence's loading mark is drawn with, in whatever colour it is given, as the web draws it: eight short segments round a ring, lighting one
 * by one until it is full and then going dark from where they began. Held still, most of the way
 * lit, for somebody who asked for less movement. Told the wait is over, it fills the rest of the ring
 * quickly, as the web's does, and says so once it is whole, so whoever shows it can let it go then.
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
  const [ticks, setTicks] = useState(0);
  const [finish, setFinish] = useState<{ from: number; lit: number } | null>(null);
  const shown = useRef({ from: 0, lit: 0 });

  useEffect(() => {
    if (!isFinishing) {
      setFinish(null);

      return undefined;
    }

    if (isStill) {
      onFilled?.();

      return undefined;
    }

    setFinish((was) => was ?? shown.current);

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
    if (finish !== null && finish.lit === SEGMENTS && finish.from === 0) {
      onFilled?.();
    }
  }, [finish, onFilled]);

  useEffect(() => {
    if (isStill || isFinishing) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTicks((was) => was + 1);
    }, TICK_MILLISECONDS);

    return () => {
      clearInterval(timer);
    };
  }, [isStill, isFinishing]);

  const { from, lit } =
    finish ?? (isStill ? { from: 0, lit: SEGMENTS - 2 } : segmentsLitAt(ticks, SEGMENTS));

  useEffect(() => {
    shown.current = { from, lit };
  });
  const drawn = size * ICON_SHARE;
  const stroke = Math.max(1.5, drawn / 9);
  const radius = (drawn - stroke) / 2;
  const length = ((2 * Math.PI * radius) / SEGMENTS) * (1 - GAP_SHARE);

  return (
    <View
      style={{ height: size, width: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      {Array.from({ length: SEGMENTS }, (_, at) => (
        <ASegment
          key={at}
          isLit={at >= from && at < lit}
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
