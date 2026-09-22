import { useState } from 'react';
import { View } from 'react-native';
import { signInAsProfile } from '@ValenceClient/profiles/fetchEveryone';
import { AFace } from '@ValencePhone/components/AFace/AFace';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import type { AskForThePasswordProps } from './AskForThePassword.types';

/**
 * Asks for the password of the face somebody picked.
 *
 * A second factor is not handled here and says so plainly rather than failing silently — an
 * account with one cannot get in from a phone yet, and being told that is better than a password
 * that appears to be wrong.
 *
 * @param profile - Whose face was picked.
 * @param onIn - Told once they are through.
 * @param onBack - Told they want a different face.
 */
const AskForThePassword = ({ profile, onIn, onBack }: AskForThePasswordProps) => {
  const [password, setPassword] = useState('');
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isTrying, setIsTrying] = useState(false);

  const tryIt = async () => {
    setIsTrying(true);
    setRefusal(null);

    const outcome = await signInAsProfile(profile.id, password);

    setIsTrying(false);

    if (outcome.kind === 'signedIn') {
      onIn();

      return;
    }

    setRefusal(
      outcome.kind === 'needsCode'
        ? 'This account asks for a code, which a phone cannot do yet.'
        : outcome.reason,
    );
  };

  return (
    <Screen centres>
      <View style={{ alignItems: 'center' }}>
        <AFace profile={profile} />
      </View>

      <TextField
        label="Password"
        value={password}
        onValueChange={setPassword}
        placeholder="Password"
        isSecret
        onSubmit={() => {
          void tryIt();
        }}
      />

      {refusal === null ? null : <Words tone="danger">{refusal}</Words>}

      <Button
        isBusy={isTrying}
        onPress={() => {
          void tryIt();
        }}
      >
        Sign in
      </Button>

      <Button tone="quiet" onPress={onBack}>
        Somebody else
      </Button>
    </Screen>
  );
};

AskForThePassword.displayName = 'AskForThePassword';

export { AskForThePassword };
