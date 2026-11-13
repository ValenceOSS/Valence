import { StyleSheet, Text, View } from 'react-native';
import { languageChoices } from '@ValenceClient/language/languageChoices';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import type { LanguageChoiceProps } from './LanguageChoice.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  choice: { alignItems: 'flex-start', gap: tokens.space.sm },
  heading: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
  note: { color: tokens.colours.muted, fontSize: tokens.type.small },
});

/**
 * Which language Valence speaks on this television: a button naming the language, in itself, that
 * opens the list to choose another from. One written the other way says the layout turns the next
 * time Valence opens, since that is when a television settles which way an app runs.
 *
 * @param chosen - The language chosen here, or the choice to follow the television.
 * @param isTurningNextTime - Whether the layout turns the next time Valence opens.
 * @param onOpen - Called to open the list of languages.
 * @param onFocus - Told when the remote lands on the button.
 */
const LanguageChoice = ({ chosen, isTurningNextTime, onOpen, onFocus }: LanguageChoiceProps) => (
  <View style={styles.choice}>
    <Text style={styles.heading}>{say('common.language')}</Text>

    <Button
      label={languageChoices().find((choice) => choice.id === chosen)?.label ?? chosen}
      detail={say('common.whatValenceSpeaksHere')}
      variant="secondary"
      {...(onFocus === undefined ? {} : { onFocus })}
      onPress={onOpen}
    />

    {isTurningNextTime ? (
      <Text style={styles.note}>{say('common.layoutTurnsNextTime')}</Text>
    ) : null}
  </View>
);

LanguageChoice.displayName = 'LanguageChoice';

export { LanguageChoice };
