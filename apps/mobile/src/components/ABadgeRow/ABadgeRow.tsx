import { StyleSheet, View } from 'react-native';
import { ABadge } from '@ValenceMobile/components/ABadge/ABadge';
import type { ABadgeRowProps } from './ABadgeRow.types';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

/**
 * A run of badges that wraps onto another line where the screen is too narrow for them, or nothing
 * at all where there are none.
 *
 * @param badges - What each says, and how it is drawn.
 * @param isLarge - Whether they are drawn larger, as they are on a card about one title.
 */
const ABadgeRow = ({ badges, isLarge = false }: ABadgeRowProps) =>
  badges.length === 0 ? null : (
    <View style={styles.row}>
      {badges.map((badge) => (
        <ABadge
          key={badge.label}
          isLarge={isLarge}
          {...(badge.tone === undefined ? {} : { tone: badge.tone })}
          {...(badge.icon === undefined ? {} : { icon: badge.icon })}
        >
          {badge.label}
        </ABadge>
      ))}
    </View>
  );

ABadgeRow.displayName = 'ABadgeRow';

export { ABadgeRow };
