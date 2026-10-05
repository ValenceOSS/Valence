import { StyleSheet, View } from 'react-native';
import { ABadge } from '@ValenceMobile/components/ABadge/ABadge';
import type { ABadgeRowProps } from './ABadgeRow.types';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});

/**
 * A run of badges that wraps onto another line where the screen is too narrow for them, or nothing
 * at all where there are none.
 *
 * @param badges - What each says, and how it is drawn.
 */
const ABadgeRow = ({ badges }: ABadgeRowProps) =>
  badges.length === 0 ? null : (
    <View style={styles.row}>
      {badges.map((badge) => (
        <ABadge key={badge.label} {...(badge.tone === undefined ? {} : { tone: badge.tone })}>
          {badge.label}
        </ABadge>
      ))}
    </View>
  );

ABadgeRow.displayName = 'ABadgeRow';

export { ABadgeRow };
