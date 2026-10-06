import { StyleSheet, View } from 'react-native';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AMiniProgressProps } from './AMiniProgress.types';

const styles = StyleSheet.create({
  track: { borderRadius: 2, height: 3, marginTop: 5, overflow: 'hidden' },
  played: { borderRadius: 2, height: 3 },
});

/**
 * How far through what is playing it has got, as a thin line under its name: no times, since the
 * whole player has those and this is only a glance.
 *
 * @param positionSeconds - How far in it is.
 * @param durationSeconds - How long it is, or nothing where that is not known.
 */
const AMiniProgress = ({ positionSeconds, durationSeconds }: AMiniProgressProps) => {
  const colours = useTheColours();
  const through =
    durationSeconds > 0 ? Math.min(1, Math.max(0, positionSeconds / durationSeconds)) : 0;

  return (
    <View
      style={[styles.track, { backgroundColor: withAlpha(colours.text, 0.18) }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.played,
          { backgroundColor: colours.text, width: `${(through * 100).toString()}%` },
        ]}
      />
    </View>
  );
};

AMiniProgress.displayName = 'AMiniProgress';

export { AMiniProgress };
