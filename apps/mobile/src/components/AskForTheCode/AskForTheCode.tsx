import { ChevronLeft, KeyRound, Smartphone } from '@keyline-icons/react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { verifyBackupCode, verifyTotp } from '@ValenceClient/session/auth';
import { ACarriedMark } from '@ValenceMobile/components/ACarriedMark/ACarriedMark';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Words } from '@ValenceMobile/components/Words/Words';
import { say } from '@ValenceI18n/say';
import type { AskForTheCodeProps } from './AskForTheCode.types';

const MARK_HIGH = 40;

const styles = StyleSheet.create({
  mark: { alignItems: 'center', marginBottom: 12 },
});

/**
 * Asks for the second factor of an account that has one, once its password has been accepted.
 *
 * The authenticator's code first, with a way over to a backup code for somebody who has lost the
 * device it was on. The words are the browser client's, so an account read about on one is the
 * same account on the other.
 *
 * The keyboard is digits for a code, and says it wants a one-time code, which is what lets iOS
 * offer one straight from the password manager it is already stored in.
 *
 * @param onIn - Told once they are through.
 * @param onBack - Told they want to start again.
 */
const AskForTheCode = ({ onIn, onBack }: AskForTheCodeProps) => {
  const [isTotp, setIsTotp] = useState(true);
  const [code, setCode] = useState('');
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isTrying, setIsTrying] = useState(false);

  const tryIt = async () => {
    const said = code.trim();

    if (said === '') {
      setRefusal(
        isTotp ? say('phone.askForTheCode.enterTotp') : say('phone.askForTheCode.enterBackup'),
      );

      return;
    }

    setIsTrying(true);
    setRefusal(null);

    const accepted = await (isTotp ? verifyTotp(said) : verifyBackupCode(said)).catch(() => null);

    setIsTrying(false);

    if (accepted === null) {
      setRefusal(say('phone.askForTheCode.unreachable'));

      return;
    }

    if (!accepted) {
      setRefusal(
        isTotp ? say('phone.askForTheCode.totpInvalid') : say('phone.askForTheCode.backupInvalid'),
      );

      return;
    }

    onIn();
  };

  return (
    <Screen centres isSeeThrough>
      <View style={styles.mark}>
        <ACarriedMark high={MARK_HIGH} />
      </View>

      <Words size="title">{say('phone.askForTheCode.heading')}</Words>

      <Words tone="muted">
        {isTotp ? say('phone.askForTheCode.totpLede') : say('phone.askForTheCode.backupLede')}
      </Words>

      <TextField
        label={
          isTotp ? say('phone.askForTheCode.totpLabel') : say('phone.askForTheCode.backupLabel')
        }
        value={code}
        onValueChange={setCode}
        keyboard={isTotp ? 'code' : 'default'}
        {...(isTotp ? { placeholder: '123456' } : {})}
        onSubmit={() => {
          void tryIt();
        }}
      />

      {refusal === null ? null : <Words tone="danger">{refusal}</Words>}

      <Button
        tone="bold"
        isBusy={isTrying}
        isDisabled={code.trim() === ''}
        onPress={() => {
          void tryIt();
        }}
      >
        {say('phone.askForTheCode.continue')}
      </Button>

      <Button
        tone="ghost"
        icon={isTotp ? KeyRound : Smartphone}
        onPress={() => {
          setIsTotp((was) => !was);
          setCode('');
          setRefusal(null);
        }}
      >
        {isTotp ? say('phone.askForTheCode.useBackup') : say('phone.askForTheCode.useTotp')}
      </Button>

      <Button tone="ghost" icon={ChevronLeft} onPress={onBack}>
        {say('phone.askForTheCode.somebodyElse')}
      </Button>
    </Screen>
  );
};

AskForTheCode.displayName = 'AskForTheCode';

export { AskForTheCode };
