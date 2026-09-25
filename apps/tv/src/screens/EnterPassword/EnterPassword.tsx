import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { signInAsProfile } from '@ValenceClient/profiles/fetchEveryone';
import { verifyTotp } from '@ValenceClient/session/auth';
import { Face } from '@ValenceTv/components/Face/Face';
import { PhoneSignIn } from '@ValenceTv/components/PhoneSignIn/PhoneSignIn';
import { Button } from '@ValenceTv/components/Button/Button';
import { TextField } from '@ValenceTv/components/TextField/TextField';
import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { WayInBackdrop } from '@ValenceTv/components/WayInBackdrop/WayInBackdrop';
import { useReportSpot } from '@ValenceTv/layout/useReportSpot';
import mark from '@ValenceTv/assets/valence-mark.png';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { EnterPasswordProps } from './EnterPassword.types';

/**
 * Signs in the face that was picked, two ways side by side: its password on the left — and then the
 * code from its authenticator where the account asks for one too — or, on the right, a code to scan
 * with a phone that is already signed in.
 *
 * @param profile - Who is signing in.
 * @param onSignedIn - Told once they are in, with where their face and Valence's mark are, for them
 *   to fly on from.
 * @param onBack - Told when somebody would rather pick someone else.
 * @param isArriving - Whether their face and the mark are still flying in, and so not yet drawn.
 * @param onFaceAt - Told where their face sits here, for it to fly to.
 * @param onMarkAt - Told where Valence's mark sits here, for it to fly to.
 */
const EnterPassword = ({
  profile,
  onSignedIn,
  onBack,
  isArriving,
  onFaceAt,
  onMarkAt,
}: EnterPasswordProps) => {
  const { ref: holdFace, onLayout: faceLaidOut, whereNow: whereFaceIs } = useReportSpot(onFaceAt);
  const { ref: holdMark, onLayout: markLaidOut, whereNow: whereMarkIs } = useReportSpot(onMarkAt);
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
    const [faceAt, markAt] = await Promise.all([whereFaceIs(), whereMarkIs()]);

    onSignedIn({ face: faceAt, mark: markAt });
  };

  const inByPhone = () => {
    void Promise.all([whereFaceIs(), whereMarkIs()]).then(([faceAt, markAt]) => {
      onSignedIn({ face: faceAt, mark: markAt });
    });
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
    await settle(await verifyTotp(code), say('tv.enterPassword.wrongCode'));
  };

  return (
    <View style={styles.screen}>
      <WayInBackdrop tint={profile.colour} />
      <View
        ref={holdMark}
        collapsable={false}
        style={[styles.mark, isArriving && styles.hidden]}
        onLayout={markLaidOut}
      >
        <Image source={mark} style={MARK} contentFit="contain" />
      </View>

      <View style={styles.choices}>
        <View style={styles.side}>
          <View
            ref={holdFace}
            collapsable={false}
            style={isArriving && styles.hidden}
            onLayout={faceLaidOut}
          >
            <Face profile={profile} size={180} />
          </View>

          <Text style={styles.name}>{profile.name}</Text>

          <View style={styles.form}>
            {needsCode ? (
              <TextField
                key="code"
                label={say('tv.enterPassword.codeLabel')}
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
                key="password"
                label={say('tv.enterPassword.passwordLabel')}
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
              label={isAsking ? say('tv.enterPassword.signingIn') : say('tv.enterPassword.watch')}
              variant="secondary"
              isWide
              isDisabled={isAsking || (needsCode ? code === '' : password === '')}
              onPress={() => {
                void (needsCode ? confirmCode() : signIn());
              }}
            />
          </View>
        </View>

        <View style={styles.between}>
          <View style={styles.rule} />
          <Text style={styles.or}>{say('tv.enterPassword.or')}</Text>
          <View style={styles.rule} />
        </View>

        <View style={styles.side}>
          <Text style={styles.heading}>{say('tv.enterPassword.useYourPhone')}</Text>
          <PhoneSignIn onSignedIn={inByPhone} isStacked />
        </View>
      </View>

      <Button label={say('tv.enterPassword.someoneElse')} variant="ghost" onPress={onBack} />
    </View>
  );
};

EnterPassword.displayName = 'EnterPassword';

const MARK = { width: 76, height: 56 };

const styles = StyleSheet.create({
  hidden: { opacity: 0 },
  mark: { position: 'absolute', top: tokens.space.xl, alignSelf: 'center' },
  screen: {
    flex: 1,
    backgroundColor: tokens.colours.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.md,
  },
  choices: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xl },
  side: { width: 700, alignItems: 'center', gap: tokens.space.md },
  between: { alignSelf: 'stretch', alignItems: 'center', gap: tokens.space.sm },
  rule: { flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  or: { color: tokens.colours.muted, fontSize: tokens.type.body },
  heading: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '700' },
  name: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  form: { alignSelf: 'stretch', gap: tokens.space.md, alignItems: 'center' },
  problem: { color: tokens.colours.danger, fontSize: tokens.type.small },
});

export { EnterPassword };
