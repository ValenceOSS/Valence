import { Animated, StyleSheet } from 'react-native';
import type { ASwipedTitleProps } from './ASwipedTitle.types';

const styles = StyleSheet.create({
  whole: { alignSelf: 'stretch', overflow: 'hidden' },
});

/**
 * What is playing, moved as far as the bar it sits in has been swiped: sliding off the way it was
 * pushed and fading as it goes, so the next song's words can slide in from the other side.
 *
 * @param shift - How far across it has been pushed.
 * @param by - How far it goes before it has gone.
 * @param children - What is playing, as it is written.
 */
const ASwipedTitle = ({ shift, by, children }: ASwipedTitleProps) => (
  <Animated.View style={styles.whole}>
    <Animated.View
      style={{
        opacity: shift.interpolate({
          inputRange: [-by, 0, by],
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

ASwipedTitle.displayName = 'ASwipedTitle';

export { ASwipedTitle };
