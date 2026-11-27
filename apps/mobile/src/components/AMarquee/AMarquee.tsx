import { Animated, ScrollView, StyleSheet } from 'react-native';
import { useMarquee } from '@ValenceNative/motion/useMarquee';
import type { AMarqueeProps } from './AMarquee.types';

const styles = StyleSheet.create({
  whole: { flexGrow: 0 },
});

/**
 * A line of words that slides along to show the rest of itself where it is too long for the room
 * it has — resting at its start, sliding until its end shows, resting there and sliding back — and
 * keeps still where it fits. Somebody who has asked for less motion sees its start, cut off.
 *
 * @param children - The line, written on one line.
 */
const AMarquee = ({ children }: AMarqueeProps) => {
  const marquee = useMarquee();

  return (
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      style={styles.whole}
      onLayout={({ nativeEvent }) => {
        marquee.onRoom(nativeEvent.layout.width);
      }}
      onContentSizeChange={(width) => {
        marquee.onWanted(width);
      }}
    >
      <Animated.View style={{ transform: [{ translateX: marquee.along }] }}>
        {children}
      </Animated.View>
    </ScrollView>
  );
};

AMarquee.displayName = 'AMarquee';

export { AMarquee };
