import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { ASegmentProps } from './ASegment.types';

const FADES_OVER = 300;

const DIM = 0.18;

const CORNER_SHARE = 0.35;

const styles = StyleSheet.create({
  segment: { left: '50%', position: 'absolute', top: '50%' },
});

/**
 * One segment of the loading ring, fading in as it lights and out as it goes dark, as the web's
 * segments ease between the two rather than switching.
 *
 * @param isLit - Whether it is lit.
 * @param colour - Its colour.
 * @param at - Which segment it is, counting round from the top.
 * @param count - How many segments the ring has.
 * @param length - How long it is drawn.
 * @param stroke - How thick it is drawn.
 * @param radius - How far from the middle it sits.
 */
const ASegment = ({ isLit, colour, at, count, length, stroke, radius }: ASegmentProps) => {
  const [shown] = useState(() => new Animated.Value(isLit ? 1 : DIM));

  useEffect(() => {
    Animated.timing(shown, {
      toValue: isLit ? 1 : DIM,
      duration: FADES_OVER,
      easing: EASINGS.outCubic,
      useNativeDriver: true,
    }).start();
  }, [isLit, shown]);

  return (
    <Animated.View
      style={[
        styles.segment,
        {
          backgroundColor: colour,
          borderRadius: stroke * CORNER_SHARE,
          height: stroke,
          marginLeft: -length / 2,
          marginTop: -stroke / 2,
          opacity: shown,
          transform: [{ rotate: `${((360 / count) * at).toString()}deg` }, { translateY: -radius }],
          width: length,
        },
      ]}
    />
  );
};

ASegment.displayName = 'ASegment';

export { ASegment };
