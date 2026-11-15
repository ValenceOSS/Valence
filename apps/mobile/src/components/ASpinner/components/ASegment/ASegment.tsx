import { Animated, StyleSheet } from 'react-native';
import type { ASegmentProps } from './ASegment.types';

const CORNER_SHARE = 0.35;

const styles = StyleSheet.create({
  segment: { left: '50%', position: 'absolute', top: '50%' },
});

/**
 * One segment of the loading ring, as bright as the ring says it is at the moment.
 *
 * @param glow - How bright it is, which the ring animates.
 * @param colour - Its colour.
 * @param at - Which segment it is, counting round from the top.
 * @param count - How many segments the ring has.
 * @param length - How long it is drawn.
 * @param stroke - How thick it is drawn.
 * @param radius - How far from the middle it sits.
 */
const ASegment = ({ glow, colour, at, count, length, stroke, radius }: ASegmentProps) => (
  <Animated.View
    style={[
      styles.segment,
      {
        backgroundColor: colour,
        borderRadius: stroke * CORNER_SHARE,
        height: stroke,
        marginLeft: -length / 2,
        marginTop: -stroke / 2,
        opacity: glow,
        transform: [{ rotate: `${((360 / count) * at).toString()}deg` }, { translateY: -radius }],
        width: length,
      },
    ]}
  />
);

ASegment.displayName = 'ASegment';

export { ASegment };
