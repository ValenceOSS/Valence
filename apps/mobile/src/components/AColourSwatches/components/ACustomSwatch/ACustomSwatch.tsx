import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Palette } from '@keyline-icons/react-native';
import { Canvas, Circle, SweepGradient, vec } from '@shopify/react-native-skia';
import { inkFor } from '@ValenceClient/library/inkFor';
import { AColourPicker } from '@ValenceMobile/components/AColourPicker/AColourPicker';
import { SWATCH } from '@ValenceMobile/components/AColourSwatches/SWATCH';
import { ASwatchRing } from '@ValenceMobile/components/AColourSwatches/components/ASwatchRing/ASwatchRing';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { HUES } from '@ValenceMobile/pictures/HUES';
import { LETTER_INKS } from '@ValenceNative/library/LETTER_INKS';
import type { ACustomSwatchProps } from './ACustomSwatch.types';

const WHEEL = 3;

const styles = StyleSheet.create({
  middle: {
    alignItems: 'center',
    borderRadius: SWATCH / 2 - WHEEL,
    height: SWATCH - WHEEL * 2,
    justifyContent: 'center',
    left: WHEEL,
    position: 'absolute',
    top: WHEEL,
    width: SWATCH - WHEEL * 2,
  },
  swatch: { borderRadius: SWATCH / 2, height: SWATCH, overflow: 'hidden', width: SWATCH },
});

/**
 * A ring of every hue that opens a picker for any colour at all, in a sheet of its own: filled with
 * a colour chosen there and ringed as chosen, its palette drawn dark or light to be read on it.
 *
 * @param label - What the colour is for, said for it and across the top of its sheet.
 * @param value - A colour chosen here, or empty while none is.
 * @param onChoose - Told each colour as the picker moves.
 */
const ACustomSwatch = ({ label, value, onChoose }: ACustomSwatchProps) => {
  const colours = useTheColours();
  const [isPicking, setIsPicking] = useState(false);
  const isOwn = value !== '';

  return (
    <>
      <Button
        tone="bare"
        label={label}
        isChosen={isOwn}
        onPress={() => {
          setIsPicking(true);
        }}
      >
        <ASwatchRing isChosen={isOwn}>
          <View style={styles.swatch}>
            <Canvas style={styles.swatch} pointerEvents="none">
              <Circle cx={SWATCH / 2} cy={SWATCH / 2} r={SWATCH / 2}>
                <SweepGradient c={vec(SWATCH / 2, SWATCH / 2)} colors={HUES} />
              </Circle>
            </Canvas>
            <View
              style={[styles.middle, { backgroundColor: isOwn ? value : colours.surfaceRaised }]}
            >
              <Icon
                of={Palette}
                size={20}
                colour={isOwn ? LETTER_INKS[inkFor(value)] : colours.text}
              />
            </View>
          </View>
        </ASwatchRing>
      </Button>

      <ASheet
        isOpen={isPicking}
        title={label}
        isSteady
        onClose={() => {
          setIsPicking(false);
        }}
      >
        <AColourPicker value={value} onChange={onChoose} />
      </ASheet>
    </>
  );
};

ACustomSwatch.displayName = 'ACustomSwatch';

export { ACustomSwatch };
