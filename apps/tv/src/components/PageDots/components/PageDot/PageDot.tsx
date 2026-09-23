import { Animated, StyleSheet, View } from 'react-native';
import type { PageDotProps } from './PageDot.types';

const DOT = 12;

const CURRENT_WIDTH = 56;

/**
 * One of the dots beneath the front page's hero: a dot for a turn still to come or already had, and
 * for the turn now a longer pill that fills from the left as the turn runs.
 *
 * The fill is a scale the native side runs, never a change of size, since laying the screen out
 * again on every frame resets the television's focus guides and leaves the remote unable to move.
 *
 * @param isCurrent - Whether this is the turn now.
 * @param fill - How far through the turn is, from nought to one, for the current dot to fill by.
 */
const PageDot = ({ isCurrent, fill }: PageDotProps) => (
  <View style={[styles.dot, isCurrent && styles.current]}>
    {isCurrent ? (
      <Animated.View style={[styles.filled, { transform: [{ scaleX: fill }] }]} />
    ) : null}
  </View>
);

PageDot.displayName = 'PageDot';

const styles = StyleSheet.create({
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  current: { width: CURRENT_WIDTH },
  filled: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#ffffff',
    transformOrigin: 'left center',
  },
});

export { PageDot };
