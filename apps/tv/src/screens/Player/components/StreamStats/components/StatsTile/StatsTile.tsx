import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { StatsTileProps } from './StatsTile.types';

/**
 * One figure at the head of the stream's statistics, as the web's summary draws them: what it is,
 * small, over the figure itself, large enough to read across the room, or a quiet dash where it is
 * not known yet.
 *
 * @param label - What the figure is.
 * @param value - The figure, or nothing where it is not known yet.
 */
const StatsTile = ({ label, value }: StatsTileProps) => (
  <View style={styles.tile}>
    <Text numberOfLines={1} style={styles.label}>
      {label}
    </Text>
    <Text numberOfLines={1} style={[styles.value, value === null && styles.unknown]}>
      {value ?? '—'}
    </Text>
  </View>
);

StatsTile.displayName = 'StatsTile';

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs + 4,
    borderRadius: tokens.radii.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  label: { color: tokens.colours.muted, fontSize: tokens.type.small - 2, fontWeight: '500' },
  value: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unknown: { color: tokens.colours.muted, fontWeight: '400' },
});

export { StatsTile };
