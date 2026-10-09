import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MoodBackdropProps } from './MoodBackdrop.types';

/**
 * The ground behind every signed-in page in a television's browser: the plain canvas.
 *
 * On a television itself the page is lit by a blurred wash of whatever is featured, dissolving to
 * the next as focus moves. A browser draws that blur on the processor at full screen, again on every
 * change, which was a large part of why the TV layout dragged on an LG set.
 */
const MoodPlain = (_props: MoodBackdropProps) => (
  <View style={[StyleSheet.absoluteFill, styles.surface]} pointerEvents="none" />
);

const MoodBackdrop = memo(MoodPlain);

MoodBackdrop.displayName = 'MoodBackdrop';

const styles = StyleSheet.create({
  surface: { backgroundColor: tokens.colours.canvas },
});

export { MoodBackdrop };
