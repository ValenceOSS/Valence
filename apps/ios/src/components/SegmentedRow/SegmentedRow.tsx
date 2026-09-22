import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AFadedEdge } from '@ValencePhone/components/AFadedEdge/AFadedEdge';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { hasLiquidGlass } from '@ValencePhone/platform/hasLiquidGlass';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { SegmentedRowProps } from './SegmentedRow.types';

const PILL_ROUNDNESS = 999;

const FADE = 24;

const styles = StyleSheet.create({
  glassPill: { paddingHorizontal: 16, paddingVertical: 9 },
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
 * @param label - What is being chosen, for anyone who cannot see the row.
 * @param items - What there is to choose from.
 * @param value - Which one is picked, or none yet.
 * @param onSelect - Told which one they picked.
 * @param isGlass - Whether the pills sit on liquid glass, where the phone has it.
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
  const isOnGlass = isGlass && hasLiquidGlass();
  const [isScrolled, setIsScrolled] = useState(false);

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
        {isOnGlass ? (
          <View style={styles.glassPill}>
            <AGlass roundness={PILL_ROUNDNESS} {...(isChosen ? { tint: colours.accent } : {})} />
            <Words size="small" tone={isChosen ? 'onArtwork' : 'plain'}>
              {item.label}
            </Words>
          </View>
        ) : (
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
        )}
      </Button>
    );
  });

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
          accessibilityRole="tablist"
          accessibilityLabel={label}
        >
          {pills}
        </ScrollView>
      </AFadedEdge>
    );
  }

  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel={label}>
      {pills}
    </View>
  );
};

SegmentedRow.displayName = 'SegmentedRow';

export { SegmentedRow };
