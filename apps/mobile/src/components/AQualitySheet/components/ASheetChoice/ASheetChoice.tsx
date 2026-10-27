import { Check } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ASheetChoiceProps } from './ASheetChoice.types';

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  said: { flex: 1, gap: 2 },
});

/**
 * One choice in the music's quality sheet: what it is called and what it means, lit and ticked
 * where it is the one chosen.
 *
 * @param label - What it is called.
 * @param detail - What it means, where there is more to say.
 * @param isChosen - Whether it is the one chosen.
 * @param onPress - Told it was pressed.
 */
const ASheetChoice = ({ label, detail, isChosen, onPress }: ASheetChoiceProps) => {
  const colours = useTheColours();

  return (
    <Button tone="bare" label={label} isChosen={isChosen} onPress={onPress}>
      <View
        style={[styles.row, isChosen ? { backgroundColor: withAlpha(colours.text, 0.08) } : null]}
      >
        <View style={styles.said}>
          <Words isStrong={isChosen}>{label}</Words>
          {detail === undefined ? null : (
            <Words size="small" tone="muted">
              {detail}
            </Words>
          )}
        </View>
        {isChosen ? <Icon of={Check} size={18} colour={colours.text} /> : null}
      </View>
    </Button>
  );
};

ASheetChoice.displayName = 'ASheetChoice';

export { ASheetChoice };
