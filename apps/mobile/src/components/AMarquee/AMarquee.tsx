import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet } from 'react-native';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { AMarqueeProps } from './AMarquee.types';

const POINTS_A_SECOND = 28;

const RESTS_MS = 1800;

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
  const isStill = usePrefersStillness();
  const [room, setRoom] = useState(0);
  const [wanted, setWanted] = useState(0);
  const [along] = useState(() => new Animated.Value(0));
  const over = Math.max(0, wanted - room);

  useEffect(() => {
    along.setValue(0);

    if (isStill || over < 1 || room === 0) {
      return undefined;
    }

    const sliding = (toValue: number) =>
      Animated.timing(along, {
        toValue,
        duration: (over / POINTS_A_SECOND) * 1000,
        easing: (at) => Easing.inOut((t) => Easing.quad(t))(at),
        useNativeDriver: true,
      });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(RESTS_MS),
        sliding(-over),
        Animated.delay(RESTS_MS),
        sliding(0),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [over, room, isStill, along]);

  return (
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      style={styles.whole}
      onLayout={({ nativeEvent }) => {
        setRoom(nativeEvent.layout.width);
      }}
      onContentSizeChange={(width) => {
        setWanted(width);
      }}
    >
      <Animated.View style={{ transform: [{ translateX: along }] }}>{children}</Animated.View>
    </ScrollView>
  );
};

AMarquee.displayName = 'AMarquee';

export { AMarquee };
