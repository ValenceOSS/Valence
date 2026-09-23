import { ChevronLeft, KeyRound, Smartphone } from '@keyline-icons/react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { verifyBackupCode, verifyTotp } from '@ValenceClient/session/auth';
import { ACarriedMark } from '@ValencePhone/components/ACarriedMark/ACarriedMark';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
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
      setRefusal(isTotp ? 'Enter the code from your authenticator app.' : 'Enter a backup code.');

      return;
    }

    setIsTrying(true);
    setRefusal(null);

    const accepted = await (isTotp ? verifyTotp(said) : verifyBackupCode(said)).catch(() => null);

    setIsTrying(false);

    if (accepted === null) {
      setRefusal('Could not reach the server. Check that it is still running.');

      return;
    }

    if (!accepted) {
      setRefusal(
        isTotp ? 'That code is not valid. Try the next one.' : 'That backup code is not valid.',
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

      <Words size="title">One more step</Words>

      <Words tone="muted">
        {isTotp
          ? 'Enter the current code from your authenticator app.'
          : 'Enter one of the backup codes you saved. Each can be used once.'}
      </Words>

      <TextField
        label={isTotp ? 'Authenticator code' : 'Backup code'}
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
        Continue
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
        {isTotp ? 'Use a backup code instead' : 'Use my authenticator app instead'}
      </Button>

      <Button tone="ghost" icon={ChevronLeft} onPress={onBack}>
        Somebody else
      </Button>
    </Screen>
  );
};

AskForTheCode.displayName = 'AskForTheCode';

export { AskForTheCode };
