import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ADetailRowProps } from './ADetailRow.types';

const styles = StyleSheet.create({
  between: { flex: 1 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  value: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 6 },
});

/**
 * One fact on a grouped card, as the phone's own settings set one out: what it is on the left and
 * what it says on the right, and, where it can be changed, pressable with a mark saying so.
 *
 * @param label - What the fact is.
 * @param value - What it says.
 * @param before - What stands just before the value, such as a critic's mark.
 * @param icon - The mark after the value on one that can be changed.
 * @param onPress - Told it was pressed, on one that can be changed.
 */
const ADetailRow = ({ label, value, before, icon, onPress }: ADetailRowProps) => {
  const colours = useTheColours();
  const row = (
    <View style={styles.row}>
      <Words>{label}</Words>
      <View style={styles.between} />
      <View style={styles.value}>
        {before}
        <Words tone="muted" lines={1}>
          {value}
        </Words>
        {icon === undefined ? null : <Icon of={icon} size={16} colour={colours.textMuted} />}
      </View>
    </View>
  );

  return onPress === undefined ? (
    row
  ) : (
    <Button tone="bare" label={label} onPress={onPress}>
      {row}
    </Button>
  );
};

ADetailRow.displayName = 'ADetailRow';

export { ADetailRow };
