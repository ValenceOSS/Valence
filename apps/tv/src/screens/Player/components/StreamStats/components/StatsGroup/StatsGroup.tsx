import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { StatsGroupProps } from './StatsGroup.types';

/**
 * A titled group of the stream's statistics, drawn as a card the way the web's are: its name at the
 * head, then each fact's name on the left and the fact on the right, wrapping onto a second line
 * rather than running off the card.
 *
 * @param name - What the group is about.
 * @param rows - Each fact's name and the fact.
 */
const StatsGroup = ({ name, rows }: StatsGroupProps) => (
  <View style={styles.card}>
    <Text style={styles.heading}>{name}</Text>

    {rows.map(([fact, value]) => (
      <View key={fact} style={styles.row}>
        <Text numberOfLines={1} style={styles.name}>
          {fact}
        </Text>
        <Text numberOfLines={2} style={styles.value}>
          {value}
        </Text>
      </View>
    ))}
  </View>
);

StatsGroup.displayName = 'StatsGroup';

const styles = StyleSheet.create({
  card: {
    gap: 4,
    padding: tokens.space.sm,
    borderRadius: tokens.radii.lg,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space.sm },
  name: { flexShrink: 0, color: tokens.colours.muted, fontSize: tokens.type.small, lineHeight: 28 },
  value: {
    flex: 1,
    color: tokens.colours.text,
    fontSize: tokens.type.small,
    lineHeight: 28,
    fontWeight: '500',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});

export { StatsGroup };
