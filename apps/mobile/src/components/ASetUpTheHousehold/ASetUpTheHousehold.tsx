import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ImagePlus } from '@keyline-icons/react-native';
import { finishOnboarding, saveHousehold } from '@ValenceClient/household/fetchHousehold';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { AFaceEditor } from '@ValenceMobile/components/AFaceEditor/AFaceEditor';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Words } from '@ValenceMobile/components/Words/Words';
import { sendAPhoto } from '@ValenceMobile/platform/sendAPhoto';
import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { ASetUpTheHouseholdProps } from './ASetUpTheHousehold.types';
import { say } from '@ValenceI18n/say';

const HOUSEHOLD = 'household';

const styles = StyleSheet.create({
  face: { alignItems: 'center', gap: 14 },
  step: { gap: 16 },
});

/**
 * Sets a household up the first time somebody signs in to it on a phone, as the web does: its name,
 * then its picture, drawn in the same editor as a profile's. The web's third step, adding a passkey,
 * is left out, because a phone adds passkeys from the web. Nothing is recorded as finished until
 * Finish is pressed, so closing the app halfway offers it again.
 *
 * @param household - The household as it stands, which names the first field.
 * @param onDone - Told once setting up is finished, so the app can let them through.
 */
const ASetUpTheHousehold = ({ household, onDone }: ASetUpTheHouseholdProps) => {
  const [step, setStep] = useState<'name' | 'picture'>('name');
  const [name, setName] = useState(household.name);
  const [colour, setColour] = useState<ProfileColour>(household.colour);
  const [avatar, setAvatar] = useState<Avatar>(household.avatar);
  const [picked, setPicked] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const face = { id: HOUSEHOLD, name, colour, avatar, updatedAt: household.updatedAt };

  const finish = async () => {
    setIsSaving(true);
    setRefusal(null);

    const turnedDown = picked === null ? null : await sendAPhoto('/api/account/photo', picked);
    const saved =
      turnedDown === null
        ? await saveHousehold({
            name: name.trim() === '' ? household.name : name.trim(),
            colour,
            avatar,
          })
        : null;

    if (turnedDown !== null || saved === null) {
      setIsSaving(false);
      setRefusal(turnedDown ?? say('screens.householdOnboarding.thatNameCouldNotBeSaved'));

      return;
    }

    await finishOnboarding();
    setIsSaving(false);
    onDone();
  };

  return (
    <Screen scrolls>
      <Words size="title">{say('screens.householdOnboarding.setUpYourHousehold')}</Words>

      {step === 'name' ? (
        <View style={styles.step}>
          <Words size="heading">
            {say('screens.householdOnboarding.whatIsThisHouseholdCalled')}
          </Words>
          <Words tone="muted">
            {say('screens.householdOnboarding.everybodyWhoWatchesHereSharesThis')}
          </Words>
          <TextField
            label={say('common.name')}
            value={name}
            onValueChange={setName}
            isLabelHidden
            onSubmit={() => {
              setStep('picture');
            }}
          />
          <Button
            isDisabled={name.trim() === ''}
            onPress={() => {
              setStep('picture');
            }}
          >
            {say('common.continue')}
          </Button>
        </View>
      ) : (
        <View style={styles.step}>
          <Words tone="muted">
            {say('screens.householdOnboarding.giveTheHouseholdAPictureOr')}
          </Words>
          <View style={styles.face}>
            <AFace profile={face} picked={picked} isLarge />
            <Button
              tone="quiet"
              icon={ImagePlus}
              onPress={() => {
                setIsEditing(true);
              }}
            >
              {say('phone.theAccount.theProfile.changePicture')}
            </Button>
          </View>

          {refusal === null ? null : <Words tone="danger">{refusal}</Words>}

          <Button
            isBusy={isSaving}
            onPress={() => {
              void finish();
            }}
          >
            {say('screens.householdOnboarding.finish')}
          </Button>
        </View>
      )}

      <AFaceEditor
        key={isEditing ? 'open' : 'shut'}
        isOpen={isEditing}
        profile={face}
        onClose={() => {
          setIsEditing(false);
        }}
        onUse={(choice) => {
          setAvatar(choice.avatar);
          setColour(choice.colour);
          setPicked(choice.file);
          setIsEditing(false);
        }}
      />
    </Screen>
  );
};

ASetUpTheHousehold.displayName = 'ASetUpTheHousehold';

export { ASetUpTheHousehold };
