import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { LETTER_FONTS } from '@ValenceContracts/schemas/LetterFont';
import { PROFILE_COLOURS, profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { facePaint } from '@ValenceClient/profiles/facePaint';
import { PROFILE_GRADIENTS } from '@ValenceClient/profiles/PROFILE_GRADIENTS';
import { LETTER_FONT_NAMES } from '@ValenceClient/profiles/LETTER_FONT_NAMES';
import { AColourSwatches } from '@ValenceMobile/components/AColourSwatches/AColourSwatches';
import { AFaceChoice } from '@ValenceMobile/components/AFaceEditor/components/AFaceChoice/AFaceChoice';
import { LETTER_FACES } from '@ValenceMobile/theme/LETTER_FACES';
import { LETTER_INKS } from '@ValenceNative/library/LETTER_INKS';
import type { ALetterStudioProps } from './ALetterStudio.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  fill: { alignItems: 'center', height: '100%', justifyContent: 'center', width: '100%' },
  letter: { fontSize: 28 },
  row: { paddingVertical: 2 },
  section: { gap: 14 },
});

/**
 * The style a letter face is painted with on a phone: its colour, and its gradient where it has one.
 *
 * @param colour - The colour, or where the gradient starts.
 * @param colourTo - Where the gradient ends, or nothing.
 * @returns The style.
 */
const paintOf = (colour: string, colourTo: string | null): ViewStyle => {
  const { style } = facePaint(colour, colourTo);

  return {
    backgroundColor: style.backgroundColor ?? colour,
    ...(style.backgroundImage === undefined
      ? {}
      : { experimental_backgroundImage: style.backgroundImage }),
  };
};

/**
 * The letter studio, as the web's: a row that scrolls sideways of the profile's first letter set in
 * each font a letter can be drawn in, on its colour, and beneath it the colours to set it on, then
 * the ready gradients.
 *
 * @param name - The profile's name, whose first letter is drawn.
 * @param font - The chosen font.
 * @param colour - The chosen colour, or where its gradient starts.
 * @param colourTo - Where the face's gradient ends, or nothing where it is one colour.
 * @param onFont - Told which font was chosen.
 * @param onColour - Told which colour was chosen, which leaves any gradient behind.
 * @param onGradient - Told a gradient was chosen, by where it starts and ends.
 */
const ALetterStudio = ({
  name,
  font,
  colour,
  colourTo,
  onFont,
  onColour,
  onGradient,
}: ALetterStudioProps) => (
  <View style={styles.section}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {LETTER_FONTS.map((one) => {
        const names = LETTER_FONT_NAMES[one];

        return (
          <AFaceChoice
            key={one}
            label={say('screens.faceEditor.letterStudio.setItInName', { name: say(names.name) })}
            name={say('shortName' in names ? names.shortName : names.name)}
            isChosen={one === font}
            onChoose={() => {
              onFont(one);
            }}
          >
            <View style={[styles.fill, paintOf(colour, colourTo)]}>
              <Text
                style={[
                  styles.letter,
                  {
                    color: LETTER_INKS[facePaint(colour, colourTo).ink],
                    fontFamily: LETTER_FACES[one],
                  },
                ]}
              >
                {profileInitial(name)}
              </Text>
            </View>
          </AFaceChoice>
        );
      })}
    </ScrollView>

    <AColourSwatches
      value={colourTo === null ? colour : ''}
      options={PROFILE_COLOURS}
      gradients={{
        options: PROFILE_GRADIENTS,
        chosen: colourTo === null ? null : { from: colour, to: colourTo },
        onChoose: onGradient,
      }}
      onChoose={onColour}
    />
  </View>
);

ALetterStudio.displayName = 'ALetterStudio';

export { ALetterStudio };
