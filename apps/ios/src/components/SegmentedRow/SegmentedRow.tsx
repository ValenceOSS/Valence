import { StyleSheet, View } from 'react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { SegmentedRowProps } from './SegmentedRow.types';

const styles = StyleSheet.create({
  pill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

/**
 * One choice out of a few, all of them visible at once.
 *
 * Named after the browser client's own, because a household with a phone and a laptop open should
 * find the same control in the same place under the same name.
 *
 * @param label - What is being chosen, for anyone who cannot see the row.
 * @param items - What there is to choose from.
 * @param value - Which one is picked, or none yet.
 * @param onSelect - Told which one they picked.
 */
const SegmentedRow = ({ label, items, value, onSelect }: SegmentedRowProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel={label}>
      {items.map((item) => {
        const isChosen = item.id === value;

        return (
          <Button
            key={item.id}
            tone="bare"
            isChosen={isChosen}
            label={item.label}
            onPress={() => {
              onSelect(item.id);
            }}
          >
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: isChosen ? colours.accent : colours.surfaceRaised,
                  borderColor: isChosen ? colours.accent : colours.border,
                },
              ]}
            >
              <Words size="small" tone={isChosen ? 'plain' : 'muted'}>
                {item.label}
              </Words>
            </View>
          </Button>
        );
      })}
    </View>
  );
};

SegmentedRow.displayName = 'SegmentedRow';

export { SegmentedRow };
