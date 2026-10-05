import { StyleSheet, Text, View } from 'react-native';
import { LETTER_FONTS } from '@ValenceContracts/schemas/LetterFont';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { AColourSwatches } from '@ValenceMobile/components/AColourSwatches/AColourSwatches';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { LETTER_FACES } from '@ValenceMobile/theme/LETTER_FACES';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ALetterStudioProps } from './ALetterStudio.types';
import { say } from '@ValenceI18n/say';

const TILE = 56;

const styles = StyleSheet.create({
  fonts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  letter: { fontSize: 26 },
  section: { gap: 10 },
  tile: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    height: TILE,
    justifyContent: 'center',
    width: TILE,
  },
});

/**
 * The letter studio: the profile's first letter set in each of the fonts a letter can be drawn in,
 * and the colour behind it.
 *
 * @param name - The profile's name, whose first letter is drawn.
 * @param font - The chosen font.
 * @param colour - The chosen colour.
 * @param onFont - Told which font was chosen.
 * @param onColour - Told which colour was chosen.
 */
const ALetterStudio = ({ name, font, colour, onFont, onColour }: ALetterStudioProps) => {
  const colours = useTheColours();
  const letter = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.section}>
      <Words size="small" tone="muted">
        {say('common.font')}
      </Words>
      <View style={styles.fonts}>
        {LETTER_FONTS.map((one) => (
          <Button
            key={one}
            tone="bare"
            label={say('screens.faceEditor.letterStudio.setItInName', { name: one })}
            isChosen={one === font}
            onPress={() => {
              onFont(one);
            }}
          >
            <View
              style={[
                styles.tile,
                {
                  backgroundColor: withAlpha(colours.text, 0.06),
                  borderColor: one === font ? colours.accent : 'transparent',
                },
              ]}
            >
              <Text style={[styles.letter, { color: colours.text, fontFamily: LETTER_FACES[one] }]}>
                {letter}
              </Text>
            </View>
          </Button>
        ))}
      </View>

      <Words size="small" tone="muted">
        {say('common.colour')}
      </Words>
      <AColourSwatches value={colour} options={PROFILE_COLOURS} onChoose={onColour} />
    </View>
  );
};

ALetterStudio.displayName = 'ALetterStudio';

export { ALetterStudio };
