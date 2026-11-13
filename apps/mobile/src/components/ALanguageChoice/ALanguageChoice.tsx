import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { changeLanguage } from '@ValenceClient/language/changeLanguage';
import { chosenLanguageHere } from '@ValenceClient/language/chosenLanguageHere';
import { languageChoices } from '@ValenceClient/language/languageChoices';
import { SAME_AS_THE_DEVICE } from '@ValenceClient/language/SAME_AS_THE_DEVICE';
import { layOutFor } from '@ValenceNative/language/layOutFor';
import { ABottomSheet } from '@ValenceMobile/components/ABottomSheet/ABottomSheet';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ASheetChoice } from '@ValenceMobile/components/AQualitySheet/components/ASheetChoice/ASheetChoice';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  choices: { gap: 4, paddingBottom: 12 },
  row: { gap: 12, padding: 16 },
});

/**
 * Which language Valence speaks on this phone: the phone's own, or one chosen here from a sheet
 * listing every language named in itself. A new language is spoken at once, fetched from the server
 * where the phone does not hold it yet; one written the other way says the layout turns the next
 * time Valence opens, since that is when a phone settles which way an app runs.
 */
const ALanguageChoice = () => {
  const [chosen, setChosen] = useState(() => chosenLanguageHere() ?? SAME_AS_THE_DEVICE);
  const [isChoosing, setIsChoosing] = useState(false);
  const [isTurningNextTime, setIsTurningNextTime] = useState(false);
  const choices = languageChoices();

  return (
    <AGroup title={say('common.language')}>
      <View style={styles.row}>
        <Words size="small" tone="muted">
          {say('common.whatValenceSpeaksHere')}
        </Words>

        <Button
          tone="ghost"
          isWide
          label={say('common.language')}
          onPress={() => {
            setIsChoosing(true);
          }}
        >
          {choices.find((choice) => choice.id === chosen)?.label ?? chosen}
        </Button>

        {isTurningNextTime ? (
          <Words size="small" tone="muted">
            {say('common.layoutTurnsNextTime')}
          </Words>
        ) : null}
      </View>

      <ABottomSheet
        isOpen={isChoosing}
        label={say('common.language')}
        title={say('common.language')}
        onClose={() => {
          setIsChoosing(false);
        }}
        isTall
      >
        <ScrollView contentContainerStyle={styles.choices}>
          {choices.map((choice) => (
            <ASheetChoice
              key={choice.id}
              label={choice.label}
              isChosen={choice.id === chosen}
              onPress={() => {
                setChosen(choice.id);
                setIsChoosing(false);
                void changeLanguage(choice.id).then((language) => {
                  setIsTurningNextTime(layOutFor(language));
                });
              }}
            />
          ))}
        </ScrollView>
      </ABottomSheet>
    </AGroup>
  );
};

ALanguageChoice.displayName = 'ALanguageChoice';

export { ALanguageChoice };
