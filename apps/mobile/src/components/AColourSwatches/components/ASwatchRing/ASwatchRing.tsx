import { StyleSheet, View } from 'react-native';
import { SWATCH } from '@ValenceMobile/components/AColourSwatches/SWATCH';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ASwatchRingProps } from './ASwatchRing.types';

const RING = 2;

const styles = StyleSheet.create({
  ring: { borderRadius: SWATCH / 2 + RING * 2, borderWidth: RING, padding: RING },
});

/**
 * A swatch ringed in the accent while it is the one chosen, and held apart from it by a gap.
 *
 * @param isChosen - Whether it is the one chosen.
 * @param children - The swatch.
 */
const ASwatchRing = ({ isChosen, children }: ASwatchRingProps) => {
  const colours = useTheColours();

  return (
    <View style={[styles.ring, { borderColor: isChosen ? colours.accent : 'transparent' }]}>
      {children}
    </View>
  );
};

ASwatchRing.displayName = 'ASwatchRing';

export { ASwatchRing };
