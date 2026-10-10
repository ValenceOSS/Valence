import { StyleSheet, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { WayInBackdropProps } from './WayInBackdrop.types';

/**
 * The ground behind every screen of the way in, in a television's browser: the plain canvas.
 *
 * On a television it is twelve large blooms, each tinted through a filter the browser has no cheap
 * way to draw, laid over each other under a field of dots. In a browser that was the slowest part
 * of signing in.
 */
const WayInBackdrop = (_props: WayInBackdropProps) => (
  <View style={[StyleSheet.absoluteFill, styles.surface]} pointerEvents="none" />
);

WayInBackdrop.displayName = 'WayInBackdrop';

const styles = StyleSheet.create({
  surface: { backgroundColor: tokens.colours.canvas },
});

export { WayInBackdrop };
