import { useRef } from 'react';
import { Host, Slider } from '@expo/ui/swift-ui';
import { accessibilityLabel, tint as tinted } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';
import type { ASystemSliderProps } from './ASystemSlider.types';

const styles = StyleSheet.create({
  whole: { alignSelf: 'stretch' },
});

/**
 * The system's own slider, drawn by SwiftUI, stepping through whole numbers from nothing to the
 * furthest. Where it is dragged is told as it moves, and where it was let go once it is.
 *
 * @param label - What it moves through, for somebody who cannot see it.
 * @param value - Where it sits.
 * @param furthest - The furthest it goes.
 * @param tint - The colour of the part behind the thumb.
 * @param onScrubbing - Told where it is while it is being dragged.
 * @param onScrubbed - Told where it was let go.
 */
const ASystemSlider = ({
  label,
  value,
  furthest,
  tint,
  onScrubbing,
  onScrubbed,
}: ASystemSliderProps) => {
  const held = useRef(value);

  return (
    <Host matchContents={{ vertical: true }} colorScheme="dark" style={styles.whole}>
      <Slider
        value={value}
        min={0}
        max={Math.max(furthest, 1)}
        step={1}
        modifiers={[tinted(tint), accessibilityLabel(label)]}
        onValueChange={(to) => {
          held.current = Math.round(to);
          onScrubbing(held.current);
        }}
        onEditingChanged={(isEditing) => {
          if (!isEditing) {
            onScrubbed(held.current);
          }
        }}
      />
    </Host>
  );
};

ASystemSlider.displayName = 'ASystemSlider';

export { ASystemSlider };
