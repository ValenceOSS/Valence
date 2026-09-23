import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import type { BadgesProps } from './Badges.types';

/**
 * The small outlined marks beside a title's year that say how it looks and sounds — 4K, Dolby
 * Vision, 5.1 — as the television's streaming apps set them.
 *
 * @param badges - What to mark.
 */
const Badges = ({ badges }: BadgesProps) => (
  <>
    {badges.map((badge) => (
      <View key={badge} style={styles.badge}>
        <Text style={styles.text}>{badge}</Text>
      </View>
    ))}
  </>
);

Badges.displayName = 'Badges';

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    borderColor: withAlpha(tokens.colours.text, 0.7),
    borderRadius: tokens.radii.xs,
    paddingHorizontal: tokens.space.xs,
  },
  text: { color: tokens.colours.text, fontSize: tokens.type.small - 4, fontWeight: '700' },
});

export { Badges };
