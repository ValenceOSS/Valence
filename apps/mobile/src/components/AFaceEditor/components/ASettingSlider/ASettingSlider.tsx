import { StyleSheet, View } from 'react-native';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ASettingSliderProps } from './ASettingSlider.types';

const styles = StyleSheet.create({
  setting: { gap: 4 },
});

/**
 * One setting that slides between two numbers, with its name above it.
 *
 * @param label - What the setting is.
 * @param value - Where it sits.
 * @param min - The least it can be.
 * @param max - The most it can be.
 * @param onChange - Told where it was moved to.
 */
const ASettingSlider = ({ label, value, min, max, onChange }: ASettingSliderProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.setting}>
      <Words size="small" tone="muted">
        {label}
      </Words>
      <Slider
        label={label}
        value={value - min}
        furthest={max - min}
        colour={colours.text}
        restColour={withAlpha(colours.text, 0.15)}
        aheadColour={withAlpha(colours.text, 0.15)}
        onScrubbing={(to) => {
          onChange(min + to);
        }}
        onScrubbed={(to) => {
          onChange(min + to);
        }}
      />
    </View>
  );
};

ASettingSlider.displayName = 'ASettingSlider';

export { ASettingSlider };
