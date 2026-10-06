import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PictureWash } from '@ValenceTv/components/PictureWash/PictureWash';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CoverGlowProps } from './CoverGlow.types';

const BLUR = 70;

/**
 * The whole screen washed in the colours of what is playing, as the television's music apps light
 * their now-playing screen: its cover blown up past the edges and blurred until only its colours
 * are left, under a shade that keeps words readable, crossfading from one song to the next.
 *
 * @param path - Where the cover is served, or nothing for a plain dark screen.
 */
const CoverGlowLight = ({ path }: CoverGlowProps) => (
  <View style={[StyleSheet.absoluteFill, styles.surface]} pointerEvents="none">
    {path === null ? null : <PictureWash path={path} blur={BLUR} style={styles.cover} />}

    <View style={[StyleSheet.absoluteFill, styles.shade]} />
  </View>
);

const CoverGlow = memo(CoverGlowLight);

CoverGlow.displayName = 'CoverGlow';

const styles = StyleSheet.create({
  surface: { backgroundColor: tokens.colours.canvas, overflow: 'hidden' },
  cover: { opacity: 0.9, transform: [{ scale: 1.35 }] },
  shade: { backgroundColor: 'rgba(0,0,0,0.38)' },
});

export { CoverGlow };
