import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AColourSwatchesProps } from './AColourSwatches.types';
import { say } from '@ValenceI18n/say';

const SWATCH = 30;

const RING = 2;

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 2, paddingVertical: 4 },
  swatch: { borderRadius: SWATCH / 2, height: SWATCH, width: SWATCH },
  swatchRing: { borderRadius: SWATCH / 2 + RING * 2, borderWidth: RING, padding: RING },
});

/**
 * A row of colours to choose from, the chosen one ringed in the accent, scrolling sideways where
 * there are more than fit.
 *
 * @param value - The chosen colour.
 * @param options - The colours offered.
 * @param onChoose - Told which colour was chosen.
 */
const AColourSwatches = ({ value, options, onChoose }: AColourSwatchesProps) => {
  const colours = useTheColours();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => (
        <Button
          key={option}
          tone="bare"
          label={say('common.useOption', { option })}
          isChosen={option === value.toLowerCase()}
          onPress={() => {
            onChoose(option);
          }}
        >
          <View
            style={[
              styles.swatchRing,
              { borderColor: option === value.toLowerCase() ? colours.accent : 'transparent' },
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: option }]} />
          </View>
        </Button>
      ))}
    </ScrollView>
  );
};

AColourSwatches.displayName = 'AColourSwatches';

export { AColourSwatches };
