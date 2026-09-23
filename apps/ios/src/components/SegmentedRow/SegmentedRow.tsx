import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { AFadedEdge } from '@ValencePhone/components/AFadedEdge/AFadedEdge';
import { ASegmentedControl } from '@ValencePhone/components/ASegmentedControl/ASegmentedControl';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { ACapsuleRow } from '@ValencePhone/components/SegmentedRow/components/ACapsuleRow/ACapsuleRow';
import type { SegmentedRowProps } from './SegmentedRow.types';

const FADE = 24;

const styles = StyleSheet.create({
  pill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sideways: { gap: 8, paddingRight: FADE },
});

/**
 * One choice out of a few, all of them visible at once.
 *
 * Named after the browser client's own, because a household with a phone and a laptop open should
 * find the same control in the same place under the same name.
 *
 * On iOS it is the system's own segmented control, as every other app on the phone draws a choice,
 * scrolling across its choices where they are wider than the screen. Only the glass capsule across
 * the head of the library, and Android, draw it here as pills.
 *
 * @param label - What is being chosen, for anyone who cannot see the row.
 * @param items - What there is to choose from.
 * @param value - Which one is picked, or none yet.
 * @param onSelect - Told which one they picked.
 * @param isGlass - Whether it is drawn as one capsule, on liquid glass where the phone has it, with
 *   a highlight that slides to the one picked, as the row across the head of the library is.
 * @param scrolls - Whether the row scrolls sideways, fading out at its edges, rather than wrapping
 *   onto more lines, for a row that can outgrow its room.
 */
const SegmentedRow = ({
  label,
  items,
  value,
  onSelect,
  isGlass = false,
  scrolls = false,
}: SegmentedRowProps) => {
  const colours = useTheColours();
  const [isScrolled, setIsScrolled] = useState(false);

  if (Platform.OS === 'ios' && !isGlass && items.length > 0) {
    return <ASegmentedControl label={label} items={items} value={value} onSelect={onSelect} />;
  }

  const pills = items.map((item) => {
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
          <Words size="small" tone={isChosen ? 'onAccent' : 'muted'}>
            {item.label}
          </Words>
        </View>
      </Button>
    );
  });

  const row = isGlass ? (
    <ACapsuleRow label={label} items={items} value={value} onSelect={onSelect} />
  ) : null;

  if (scrolls) {
    return (
      <AFadedEdge leading={isScrolled ? FADE : 0} trailing={FADE}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sideways}
          scrollEventThrottle={32}
          onScroll={(event) => {
            setIsScrolled(event.nativeEvent.contentOffset.x > 1);
          }}
          {...(row === null ? { accessibilityRole: 'tablist', accessibilityLabel: label } : {})}
        >
          {row ?? pills}
        </ScrollView>
      </AFadedEdge>
    );
  }

  return (
    row ?? (
      <View style={styles.row} accessibilityRole="tablist" accessibilityLabel={label}>
        {pills}
      </View>
    )
  );
};

SegmentedRow.displayName = 'SegmentedRow';

export { SegmentedRow };
