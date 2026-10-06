import { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ASwipedTitleProps } from './ASwipedTitle.types';

const styles = StyleSheet.create({
  beside: { position: 'absolute', top: 0 },
  whole: { alignSelf: 'stretch', overflow: 'hidden' },
});

/**
 * What is playing, with the song before it and the song after it laid either side out of sight,
 * so a swipe across the bar drags the next one's words in as the current one's go — rather than
 * the same words sliding back once the song has changed. The bar moves it; this lays it out.
 *
 * @param shift - How far across it has been dragged.
 * @param previous - The song before, as it is written, or nothing where there is none.
 * @param current - The song playing, as it is written.
 * @param next - The song after, as it is written, or nothing where there is none.
 * @param onWidth - Told how wide one song's room is, which is how far a swipe has to carry it.
 */
const ASwipedTitle = ({ shift, previous, current, next, onWidth }: ASwipedTitleProps) => {
  const [width, setWidth] = useState(0);

  return (
    <View
      style={styles.whole}
      onLayout={({ nativeEvent }) => {
        setWidth(nativeEvent.layout.width);
        onWidth(nativeEvent.layout.width);
      }}
    >
      <Animated.View style={{ transform: [{ translateX: shift }] }}>
        {width > 0 && previous !== null ? (
          <View style={[styles.beside, { left: -width, width }]}>{previous}</View>
        ) : null}
        <View>{current}</View>
        {width > 0 && next !== null ? (
          <View style={[styles.beside, { left: width, width }]}>{next}</View>
        ) : null}
      </Animated.View>
    </View>
  );
};

ASwipedTitle.displayName = 'ASwipedTitle';

export { ASwipedTitle };
