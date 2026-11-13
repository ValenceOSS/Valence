import { ScrollView, StyleSheet, View } from 'react-native';
import { colourName } from '@ValenceClient/profiles/colourName';
import { SWATCH } from '@ValenceMobile/components/AColourSwatches/SWATCH';
import { ACustomSwatch } from '@ValenceMobile/components/AColourSwatches/components/ACustomSwatch/ACustomSwatch';
import { ASwatchRing } from '@ValenceMobile/components/AColourSwatches/components/ASwatchRing/ASwatchRing';
import { Button } from '@ValenceMobile/components/Button/Button';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { AColourSwatchesProps } from './AColourSwatches.types';
import { say } from '@ValenceI18n/say';

const CHECKS = 4;

const styles = StyleSheet.create({
  check: { height: SWATCH / CHECKS, width: SWATCH / CHECKS },
  checks: { flexDirection: 'row', flexWrap: 'wrap' },
  divider: { alignSelf: 'center', borderRadius: 1, height: 28, marginHorizontal: 4, width: 2 },
  row: { alignItems: 'center', gap: 10, paddingHorizontal: 2, paddingVertical: 4 },
  swatch: { borderRadius: SWATCH / 2, height: SWATCH, overflow: 'hidden', width: SWATCH },
});

/**
 * A row of colours to choose from, as the web's: the chosen one ringed in the accent, scrolling
 * sideways where there are more than fit. Where it is wanted, no colour at all is offered first, as
 * a checkerboard; after the colours comes a picker for any colour at all. Where gradients are
 * offered they follow past a divider, ending in a picker for where a gradient of one's own ends.
 *
 * @param value - The chosen colour, or empty where none is.
 * @param options - The colours offered.
 * @param onChoose - Told which colour was chosen.
 * @param clear - Whether no colour is the one chosen, and what to tell when it is.
 * @param gradients - Ready gradients offered after the colours, where any are: which is chosen, and
 *   what to tell when one is, by where it starts and ends.
 */
const AColourSwatches = ({ value, options, onChoose, clear, gradients }: AColourSwatchesProps) => {
  const colours = useTheColours();
  const chosen = value.toLowerCase();
  const isReady = (colour: string) =>
    options.some((option) => option.toLowerCase() === colour.toLowerCase());
  const gradient = gradients?.chosen ?? null;
  const isReadyGradient =
    gradient !== null &&
    (gradients?.options ?? []).some((one) => one.from === gradient.from && one.to === gradient.to);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {clear === undefined ? null : (
        <Button
          tone="bare"
          label={say('common.transparent')}
          isChosen={clear.isChosen}
          onPress={clear.onChoose}
        >
          <ASwatchRing isChosen={clear.isChosen}>
            <View style={[styles.swatch, styles.checks]}>
              {Array.from({ length: CHECKS * CHECKS }, (_, at) => (
                <View
                  key={at}
                  style={[
                    styles.check,
                    {
                      backgroundColor:
                        (Math.floor(at / CHECKS) + at) % 2 === 0
                          ? withAlpha(colours.text, 0.45)
                          : withAlpha(colours.text, 0.1),
                    },
                  ]}
                />
              ))}
            </View>
          </ASwatchRing>
        </Button>
      )}
      {options.map((option) => (
        <Button
          key={option}
          tone="bare"
          label={colourName(option)}
          isChosen={option.toLowerCase() === chosen}
          onPress={() => {
            onChoose(option);
          }}
        >
          <ASwatchRing isChosen={option.toLowerCase() === chosen}>
            <View style={[styles.swatch, { backgroundColor: option }]} />
          </ASwatchRing>
        </Button>
      ))}
      <ACustomSwatch
        label={say('screens.colourChoice.customColour')}
        value={chosen !== '' && gradient === null && !isReady(chosen) ? value : ''}
        onChoose={onChoose}
      />
      {gradients === undefined ? null : (
        <>
          <View style={[styles.divider, { backgroundColor: withAlpha(colours.text, 0.35) }]} />
          {gradients.options.map((one) => {
            const isChosen = gradient?.from === one.from && gradient.to === one.to;

            return (
              <Button
                key={`${one.from}${one.to}`}
                tone="bare"
                label={say(one.name)}
                isChosen={isChosen}
                onPress={() => {
                  gradients.onChoose(one.from, one.to);
                }}
              >
                <ASwatchRing isChosen={isChosen}>
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: one.from,
                        experimental_backgroundImage: `linear-gradient(135deg, ${one.from}, ${one.to})`,
                      },
                    ]}
                  />
                </ASwatchRing>
              </Button>
            );
          })}
          <ACustomSwatch
            label={say('screens.faceEditor.letterStudio.whereTheGradientEnds')}
            value={gradient !== null && !isReadyGradient ? gradient.to : ''}
            onChoose={(to) => {
              gradients.onChoose(gradient?.from ?? value, to);
            }}
          />
        </>
      )}
    </ScrollView>
  );
};

AColourSwatches.displayName = 'AColourSwatches';

export { AColourSwatches };
