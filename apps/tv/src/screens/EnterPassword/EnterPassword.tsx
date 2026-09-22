import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { signInAsProfile } from '@ValenceClient/profiles/fetchEveryone';
import { verifyTotp } from '@ValenceClient/session/auth';
import { Face } from '@ValenceTv/components/Face/Face';
import { Button } from '@ValenceTv/components/Button/Button';
import { TextField } from '@ValenceTv/components/TextField/TextField';
import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { tokens } from '@ValenceTv/theme/tokens';
import type { EnterPasswordProps } from './EnterPassword.types';

/**
 * Asks the face that was picked for its PIN, and then for the code from its authenticator where the
 * account asks for one too.
 *
 * @param profile - Who is signing in.
 * @param onSignedIn - Told once they are in.
 * @param onBack - Told when somebody would rather pick someone else.
 */
const EnterPassword = ({ profile, onSignedIn, onBack }: EnterPasswordProps) => {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const settle = async (isIn: boolean, refusal: string) => {
    if (!isIn) {
      setProblem(refusal);
      setIsAsking(false);

      return;
    }

    await holdTheSession();
    onSignedIn();
  };

  const signIn = async () => {
    if (password === '' || isAsking) {
      return;
    }

    setIsAsking(true);
    setProblem(null);

    const answer = await signInAsProfile(profile.id, password);

    if (answer.kind === 'needsCode') {
      setNeedsCode(true);
      setIsAsking(false);

      return;
    }

    await settle(answer.kind === 'signedIn', answer.kind === 'refused' ? answer.reason : '');
  };

  const confirmCode = async () => {
    if (code === '' || isAsking) {
      return;
    }

    setIsAsking(true);
    await settle(await verifyTotp(code), 'That code is not right.');
  };

  return (
    <View style={styles.screen}>
      <Face profile={profile} size={200} />

      <Text style={styles.name}>{profile.name}</Text>

      <View style={styles.form}>
        {needsCode ? (
          <TextField
            label="The code from your authenticator"
            value={code}
            onChange={setCode}
            onSubmit={() => {
              void confirmCode();
            }}
            keyboardType="number-pad"
            hasPreferredFocus
          />
        ) : (
          <TextField
            label="Password"
            value={password}
            onChange={setPassword}
            onSubmit={() => {
              void signIn();
            }}
            isSecret
            hasPreferredFocus
          />
        )}

        {problem === null ? null : <Text style={styles.problem}>{problem}</Text>}

        <Button
          label={isAsking ? 'Signing in…' : 'Watch'}
          variant="secondary"
          isWide
          isDisabled={isAsking || (needsCode ? code === '' : password === '')}
          onPress={() => {
            void (needsCode ? confirmCode() : signIn());
          }}
        />

        <Button label="Someone else" variant="ghost" onPress={onBack} />
      </View>
    </View>
  );
};

EnterPassword.displayName = 'EnterPassword';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colours.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.md,
  },
  name: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  form: { width: 760, gap: tokens.space.md, alignItems: 'center' },
  problem: { color: tokens.colours.danger, fontSize: tokens.type.small },
});

export { EnterPassword };
