import { Animated, ScrollView, StyleSheet, Text } from 'react-native';
import { useMarquee } from '@ValenceNative/motion/useMarquee';
import type { MarqueeProps } from './Marquee.types';

const POINTS_A_SECOND = 60;

/**
 * A line of the song playing — its name, or who sings it and on which album — that slides along
 * to show the rest of itself where it is too long for its room, pausing at each end and sliding
 * back, and starts again from its start when the words change. Where it fits, or where somebody
 * has asked for less motion, it keeps still, cut short with an ellipsis.
 *
 * @param text - The line.
 * @param style - How its words are set.
 */
const Marquee = ({ text, style }: MarqueeProps) => {
  const marquee = useMarquee({ pointsASecond: POINTS_A_SECOND, restartsWith: text });

  if (marquee.isStill) {
    return (
      <Text numberOfLines={1} style={style}>
        {text}
      </Text>
    );
  }

  return (
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      focusable={false}
      style={styles.room}
      onLayout={({ nativeEvent }) => {
        marquee.onRoom(nativeEvent.layout.width);
      }}
      onContentSizeChange={(width) => {
        marquee.onWanted(width);
      }}
    >
      <Animated.Text style={[style, { transform: [{ translateX: marquee.along }] }]}>
        {text}
      </Animated.Text>
    </ScrollView>
  );
};

Marquee.displayName = 'Marquee';

const styles = StyleSheet.create({
  room: { flexGrow: 0 },
});

export { Marquee };
