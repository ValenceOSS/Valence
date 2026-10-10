import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CoverGlowProps } from './CoverGlow.types';

/**
 * The ground behind what is playing in a television's browser: the plain canvas, where a television
 * draws a blurred glow of the cover that a browser would have to blur on the processor.
 */
const CoverGlowPlain = (_props: CoverGlowProps) => (
  <View style={[StyleSheet.absoluteFill, styles.surface]} pointerEvents="none" />
);

const CoverGlow = memo(CoverGlowPlain);

CoverGlow.displayName = 'CoverGlow';

const styles = StyleSheet.create({
  surface: { backgroundColor: tokens.colours.canvas },
});

export { CoverGlow };
