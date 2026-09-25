import { StyleSheet, View } from 'react-native';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { HowFarProps } from './HowFar.types';

const styles = StyleSheet.create({
  bar: { borderRadius: 2, flexDirection: 'row', overflow: 'hidden', width: '100%' },
});

/**
 * A line filled as far as something has got.
 *
 * @param fraction - How far, from nothing to all of it.
 * @param label - What it is the progress of, for somebody who cannot see it.
 * @param thickness - How tall the line is.
 */
const HowFar = ({ fraction, label, thickness = 3 }: HowFarProps) => {
  const colours = useTheColours();
  const done = Math.min(Math.max(fraction, 0), 1);

  return (
    <View
      style={[styles.bar, { backgroundColor: colours.border, height: thickness }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(done * 100) }}
    >
      <View style={{ backgroundColor: colours.accent, flex: done }} />
      <View style={{ flex: 1 - done }} />
    </View>
  );
};

HowFar.displayName = 'HowFar';

export { HowFar };
