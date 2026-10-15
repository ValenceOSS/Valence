import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { ChoosingStep } from '@ValenceClient/profiles/ChoosingStep';
import { useState } from 'react';
import { chooseProfile } from '@ValenceClient/profiles/chooseProfile';
import type { ProfileChoice } from '@ValenceClient/profiles/chooseProfile';
import { Button } from '@ValenceTv/components/Button/Button';
import { Face } from '@ValenceTv/components/Face/Face';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { TextField } from '@ValenceTv/components/TextField/TextField';
import { WayInBackdrop } from '@ValenceTv/components/WayInBackdrop/WayInBackdrop';
import { tokens } from '@ValenceTv/theme/tokens';
import { useReportSpot } from '@ValenceTv/layout/useReportSpot';
import mark from '@ValenceTv/assets/valence-mark.png';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ChooseProfileProps } from './ChooseProfile.types';
import { say } from '@ValenceI18n/say';
import { isAPin } from '@ValenceContracts/functions/isAPin';

const FACE_SIZE = 200;

const MARK = { width: 76, height: 56 };

const STAGGER_MS = 70;

/**
 * Asks who is watching on the television, once it is signed in to an account more than one person
 * shares: the account's faces along the screen, and then a profile's PIN where it has one, typed
 * with the remote's number pad. An owner who needs a PIN chooses one here, and anybody who forgot
 * theirs can set a new one with the account's password.
 *
 * @param profiles - The profiles on the account.
 * @param onChosen - Told once one is chosen.
 * @param onSignOut - Told to sign the account out of this television.
 * @param isArriving - Whether the face picked on the way in and the mark are still flying in, and
 *   so not yet drawn here.
 * @param onFaceAt - Told where the owner's face sits here, for the face picked on the way in to fly to.
 * @param onMarkAt - Told where Valence's mark sits here, for it to fly to.
 */
const ChooseProfile = ({
  profiles,
  onChosen,
  onSignOut,
  isArriving,
  onFaceAt,
  onMarkAt,
}: ChooseProfileProps) => {
  const { ref: holdFace, onLayout: faceLaidOut } = useReportSpot(onFaceAt);
  const { ref: holdMark, onLayout: markLaidOut } = useReportSpot(onMarkAt);
  const [step, setStep] = useState<ChoosingStep>({ kind: 'faces' });
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [tries, setTries] = useState(0);

  const clear = () => {
    setPin('');
    setAgain('');
    setPassword('');
    setProblem(null);
  };

  const settle = (profile: ViewerProfile, choice: ProfileChoice) => {
    setIsAsking(false);

    switch (choice.kind) {
      case 'chosen':
        onChosen();
        break;
      case 'needsPin':
        setStep({ kind: 'pin', profile });
        setPin('');
        setTries((made) => made + 1);
        setProblem(choice.reason);
        break;
      case 'needsNewPin':
        clear();
        setStep({ kind: 'newPin', profile, why: choice.reason });
        break;
      case 'waiting':
      case 'refused':
        setPin('');
        setTries((made) => made + 1);
        setProblem(choice.reason);
        break;
    }
  };

  const ask = async (profile: ViewerProfile, proof: Parameters<typeof chooseProfile>[1]) => {
    setIsAsking(true);
    setProblem(null);
    settle(profile, await chooseProfile(profile.id, proof));
  };

  if (step.kind === 'faces') {
    return (
      <View style={styles.screen}>
        <WayInBackdrop />
        <View
          ref={holdMark}
          collapsable={false}
          style={[styles.mark, isArriving && styles.hidden]}
          onLayout={markLaidOut}
        >
          <Image source={mark} style={MARK} contentFit="contain" />
        </View>

        <FadeIn isFilling={false}>
          <Text style={styles.title}>{say('common.whoIsWatching')}</Text>
        </FadeIn>

        <FlatList
          horizontal
          data={profiles}
          keyExtractor={(profile) => profile.id}
          style={styles.faces}
          contentContainerStyle={styles.facesInside}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeIn isFilling={false} delayMs={STAGGER_MS * index}>
              <Focusable
                label={item.name}
                hasPreferredFocus={index === 0}
                onPress={() => {
                  clear();

                  if (item.hasPin) {
                    setStep({ kind: 'pin', profile: item });
                  } else {
                    void ask(item, {});
                  }
                }}
              >
                {(isFocused) => (
                  <View style={styles.person}>
                    {item.isOwner ? (
                      <View
                        ref={holdFace}
                        collapsable={false}
                        style={isArriving && styles.hidden}
                        onLayout={faceLaidOut}
                      >
                        <Face profile={item} size={FACE_SIZE} isFocused={isFocused} />
                      </View>
                    ) : (
                      <Face profile={item} size={FACE_SIZE} isFocused={isFocused} />
                    )}
                    <Text style={[styles.name, isFocused && styles.nameFocused]}>{item.name}</Text>
                  </View>
                )}
              </Focusable>
            </FadeIn>
          )}
        />

        {problem === null ? null : <Text style={styles.problem}>{problem}</Text>}

        <FadeIn isFilling={false} delayMs={STAGGER_MS * profiles.length}>
          <Button
            label={say('common.signOut')}
            variant="ghost"
            isDisabled={isAsking}
            onPress={onSignOut}
          />
        </FadeIn>
      </View>
    );
  }

  const { profile } = step;
  const isSettingAPin = step.kind === 'newPin' || step.kind === 'forgot';
  const canSend =
    isAPin(pin) &&
    (!isSettingAPin || pin === again) &&
    (step.kind !== 'forgot' || password !== '') &&
    !isAsking;

  const send = () => {
    if (!canSend) {
      return;
    }

    void ask(
      profile,
      step.kind === 'pin'
        ? { pin }
        : step.kind === 'forgot'
          ? { password, newPin: pin }
          : { newPin: pin },
    );
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

      <View style={styles.side}>
        <Face profile={profile} size={180} />

        <Text style={styles.heading}>
          {step.kind === 'newPin' ? say('screens.whoIsWatching.choosePin') : profile.name}
        </Text>

        {step.kind === 'newPin' ? (
          <Text style={styles.note}>{step.why}</Text>
        ) : step.kind === 'forgot' ? (
          <Text style={styles.note}>
            {say('screens.whoIsWatching.enterThePasswordToChoose', { name: profile.name })}
          </Text>
        ) : null}

        <View style={styles.form}>
          {step.kind === 'forgot' ? (
            <TextField
              key="password"
              label={say('common.password')}
              value={password}
              onChange={setPassword}
              onSubmit={send}
              isSecret
              hasPreferredFocus
            />
          ) : null}

          <TextField
            key={`pin-${step.kind}-${tries.toString()}`}
            label={
              isSettingAPin ? say('screens.whoIsWatching.newPin') : say('screens.whoIsWatching.pin')
            }
            value={pin}
            onChange={(typed) => {
              setPin(typed.replace(/\D/gu, '').slice(0, 8));
            }}
            onSubmit={send}
            keyboardType="number-pad"
            isSecret
            hasPreferredFocus={step.kind !== 'forgot'}
          />

          {isSettingAPin ? (
            <TextField
              key="again"
              label={say('screens.whoIsWatching.typeThePinAgain')}
              value={again}
              onChange={(typed) => {
                setAgain(typed.replace(/\D/gu, '').slice(0, 8));
              }}
              onSubmit={send}
              keyboardType="number-pad"
              isSecret
            />
          ) : null}

          {again !== '' && isSettingAPin && again !== pin ? (
            <Text style={styles.problem}>{say('screens.whoIsWatching.thosePinsDoNotMatch')}</Text>
          ) : null}

          {problem === null ? null : <Text style={styles.problem}>{problem}</Text>}

          <Button
            label={say('common.continue')}
            variant="secondary"
            isWide
            isDisabled={!canSend}
            onPress={send}
          />

          {step.kind === 'pin' ? (
            <Button
              label={say('screens.whoIsWatching.forgotThePin')}
              variant="ghost"
              onPress={() => {
                clear();
                setStep({ kind: 'forgot', profile });
              }}
            />
          ) : null}
        </View>
      </View>

      <Button
        label={say('common.somebodyElse')}
        variant="ghost"
        onPress={() => {
          clear();
          setStep({ kind: 'faces' });
        }}
      />
    </View>
  );
};

ChooseProfile.displayName = 'ChooseProfile';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.xl,
    paddingVertical: tokens.space.xl,
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.hero,
    fontWeight: '700',
    textAlign: 'center',
  },
  faces: { flexGrow: 0 },
  facesInside: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.space.edge,
    gap: tokens.space.lg,
    paddingVertical: 30,
  },
  person: { alignItems: 'center', gap: tokens.space.sm, width: FACE_SIZE + 20 },
  name: { color: tokens.colours.muted, fontSize: tokens.type.body },
  nameFocused: { color: tokens.colours.text, fontWeight: '600' },
  side: { width: 700, alignItems: 'center', gap: tokens.space.md },
  heading: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  note: { color: tokens.colours.muted, fontSize: tokens.type.small, textAlign: 'center' },
  form: { alignSelf: 'stretch', gap: tokens.space.md, alignItems: 'center' },
  problem: { color: tokens.colours.danger, fontSize: tokens.type.small, textAlign: 'center' },
  hidden: { opacity: 0 },
  mark: { position: 'absolute', top: tokens.space.xl, alignSelf: 'center' },
});

export { ChooseProfile };
