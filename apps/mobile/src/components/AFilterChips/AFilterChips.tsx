import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AFilterChipsProps } from './AFilterChips.types';

const styles = StyleSheet.create({
  chip: { borderRadius: 18, height: 36, justifyContent: 'center', paddingHorizontal: 16 },
  row: { gap: 8, paddingHorizontal: SCREEN_EDGE },
});

/**
 * A row of separate pills to narrow a page to one kind of thing, each its own capsule rather than
 * a segment of one bar, so the row reads as filters to tap rather than tabs to move between. It
 * scrolls sideways where there are more than fit, out to the edges of the screen, as a shelf does.
 *
 * @param label - What is being narrowed, for anybody who cannot see the row.
 * @param chips - The kinds there are.
 * @param value - Which is chosen.
 * @param onSelect - Told which was pressed.
 */
const AFilterChips = ({ label, chips, value, onSelect }: AFilterChipsProps) => {
  const colours = useTheColours();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel={label}
    >
      {chips.map((chip) => {
        const isChosen = chip.id === value;

        return (
          <Button
            key={chip.id}
            tone="bare"
            label={chip.label}
            isChosen={isChosen}
            onPress={() => {
              onSelect(chip.id);
            }}
          >
            <View
              style={[
                styles.chip,
                { backgroundColor: isChosen ? colours.accent : withAlpha(colours.text, 0.1) },
              ]}
            >
              <Words size="small" colour={isChosen ? colours.accentContrast : colours.text}>
                {chip.label}
              </Words>
            </View>
          </Button>
        );
      })}
    </ScrollView>
  );
};

AFilterChips.displayName = 'AFilterChips';

export { AFilterChips };
