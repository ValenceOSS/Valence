import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ASegment } from '@ValenceMobile/components/ASpinner/components/ASegment/ASegment';
import { segmentsLitAt } from '@ValenceCore/functions/segmentsLitAt';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { ASpinnerProps } from './ASpinner.types';
import { say } from '@ValenceI18n/say';

const SEGMENTS = 8;

const TICK_MILLISECONDS = 360;

const GAP_SHARE = 0.38;

const ICON_SHARE = 0.8;

/**
 * Valence's own loading mark, as the web draws it: eight short segments round a ring, lighting one
 * by one until it is full and then going dark from where they began. Held still, most of the way
 * lit, for somebody who asked for less movement.
 *
 * @param colour - The colour of the lit segments, the page's quieter text unless told otherwise.
 * @param size - How wide it is drawn.
 * @param label - What is being waited for, read out in place of the mark.
 */
const ASpinner = ({ colour, size = 24, label = say('common.reading') }: ASpinnerProps) => {
  const colours = useTheColours();
  const ink = colour ?? colours.textMuted;
  const isStill = usePrefersStillness();
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (isStill) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTicks((was) => was + 1);
    }, TICK_MILLISECONDS);

    return () => {
      clearInterval(timer);
    };
  }, [isStill]);

  const { from, lit } = isStill ? { from: 0, lit: SEGMENTS - 2 } : segmentsLitAt(ticks, SEGMENTS);
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
          colour={ink}
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

ASpinner.displayName = 'ASpinner';

export { ASpinner };
