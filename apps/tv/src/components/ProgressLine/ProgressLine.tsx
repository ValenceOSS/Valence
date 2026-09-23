import { StyleSheet, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ProgressLineProps } from './ProgressLine.types';

const HEIGHT = 8;

/**
 * The line that says how far through a title somebody is — along the foot of its picture, or in a
 * line of words beside what resumes it. It is read out as how much has been watched.
 *
 * @param fraction - How much of it has been watched, from nothing to all of it.
 * @param isInline - Whether it sits in a line of words rather than over a picture.
 */
const ProgressLine = ({ fraction, isInline = false }: ProgressLineProps) => (
  <View
    accessible
    accessibilityRole="progressbar"
    accessibilityLabel="Watched"
    accessibilityValue={{
      min: 0,
      max: 100,
      now: Math.round(Math.min(Math.max(fraction, 0), 1) * 100),
    }}
    style={[styles.track, isInline && styles.inline]}
  >
    <View style={[styles.watched, { flex: fraction }]} />
    <View style={{ flex: 1 - fraction }} />
  </View>
);

ProgressLine.displayName = 'ProgressLine';

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    left: tokens.space.sm,
    right: tokens.space.sm,
    bottom: tokens.space.sm,
    height: HEIGHT,
    borderRadius: tokens.radii.round,
    backgroundColor: tokens.colours.scrim,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  inline: { position: 'relative', left: 0, right: 0, bottom: 0, width: 140, height: 6 },
  watched: { backgroundColor: tokens.colours.accent },
});

export { ProgressLine };
