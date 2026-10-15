import { ChevronLeft, LogOut } from '@keyline-icons/react-native';
import type { ChoosingStep } from '@ValenceClient/profiles/ChoosingStep';
import { Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACarriedMark } from '@ValenceMobile/components/ACarriedMark/ACarriedMark';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { StyleSheet, View } from 'react-native';
import { chooseProfile } from '@ValenceClient/profiles/chooseProfile';
import type { ProfileChoice } from '@ValenceClient/profiles/chooseProfile';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Words } from '@ValenceMobile/components/Words/Words';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { AWhoIsWatchingProps } from './AWhoIsWatching.types';
import { say } from '@ValenceI18n/say';
import { isAPin } from '@ValenceContracts/functions/isAPin';
import { AWayInLights } from '@ValenceMobile/components/AWayInLights/AWayInLights';

const MARK_HIGH = 40;

const styles = StyleSheet.create({
  asking: { alignSelf: 'stretch', gap: 14 },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' },
  leftOut: { opacity: 0 },
  markAtTheTop: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
  page: { flex: 1 },
  whole: { alignItems: 'center', gap: 28 },
});

/**
 * Asks who is watching on the phone, once somebody has signed in to an account more than one
 * person shares: the account's faces, and then a profile's PIN where it has one, a new PIN for an
 * owner who needs one, or the account's password and a new PIN for anybody who forgot theirs.
 *
 * @param profiles - The profiles on the account.
 * @param onChosen - Told once one is chosen.
 * @param onSignOut - Told to sign the account out of this phone.
 * @param onFaceAt - Told where the owner's face is, for the face picked on the way in to land on.
 * @param isFaceArriving - Whether that face is still flying in, so the owner's tile waits for it.
 */
const AWhoIsWatching = ({
  profiles,
  onChosen,
  onSignOut,
  onFaceAt,
  isFaceArriving = false,
}: AWhoIsWatchingProps) => {
  const room = useSafeAreaInsets();

  const [step, setStep] = useState<ChoosingStep>({ kind: 'faces' });
  const [pin, setPin] = useState('');
  const [again, setAgain] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

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
        setProblem(choice.reason);
        break;
      case 'needsNewPin':
        clear();
        setStep({ kind: 'newPin', profile, why: choice.reason });
        break;
      case 'waiting':
      case 'refused':
        setPin('');
        setProblem(choice.reason);
        break;
    }
  };

  const ask = async (profile: ViewerProfile, proof: Parameters<typeof chooseProfile>[1]) => {
    setIsAsking(true);
    setProblem(null);
    settle(profile, await chooseProfile(profile.id, proof));
  };

  /**
   * Draws a step of the picker under Valence's mark, carried on from the screen before, and over the
   * way in's lights, so the mark moves from the password to the picker and on to the library
   * rather than vanishing, and the picker is lit as the wall and the password are.
   *
   * @param screen - The step.
   * @returns It, under the mark.
   */
  const withTheMark = (screen: ReactNode) => (
    <View style={styles.page}>
      <AWayInLights profile={step.kind === 'faces' ? null : step.profile} />

      {screen}

      <View style={[styles.markAtTheTop, { top: room.top + SCREEN_EDGE }]} pointerEvents="none">
        <ACarriedMark high={MARK_HIGH} />
      </View>
    </View>
  );

  if (step.kind === 'faces') {
    return withTheMark(
      <Screen scrolls centres isSeeThrough>
        <View style={styles.whole}>
          <ARising>
            <Words size="title" isCentred>
              {say('common.whoIsWatching')}
            </Words>
          </ARising>

          <ARising turn={1}>
            <View style={styles.faces}>
              {profiles.map((profile) => (
                <Button
                  key={profile.id}
                  tone="bare"
                  label={profile.name}
                  isDisabled={isAsking}
                  onPress={() => {
                    clear();

                    if (profile.hasPin) {
                      setStep({ kind: 'pin', profile });
                    } else {
                      void ask(profile, {});
                    }
                  }}
                >
                  <View
                    collapsable={false}
                    onLayout={({ currentTarget }) => {
                      if (!profile.isOwner || typeof currentTarget === 'number') {
                        return;
                      }

                      currentTarget.measureInWindow((x, y, width) => {
                        onFaceAt?.({ x, y, width, height: width }, true);
                      });
                    }}
                  >
                    <AFace
                      profile={profile}
                      {...(profile.isOwner && isFaceArriving ? { tileMotion: styles.leftOut } : {})}
                    />
                  </View>
                </Button>
              ))}
            </View>
          </ARising>

          {problem === null ? null : <Words tone="danger">{problem}</Words>}

          <ARising turn={2}>
            <Button tone="ghost" icon={LogOut} isDisabled={isAsking} onPress={onSignOut}>
              {say('common.signOut')}
            </Button>
          </ARising>
        </View>
      </Screen>,
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

  return withTheMark(
    <Screen scrolls centres isSeeThrough>
      <View style={styles.whole}>
        <AFace profile={profile} isLarge />

        <ARising>
          <Words size="title" isCentred>
            {step.kind === 'newPin' ? say('screens.whoIsWatching.choosePin') : profile.name}
          </Words>
        </ARising>

        {step.kind === 'newPin' ? (
          <Words tone="muted" isCentred>
            {step.why}
          </Words>
        ) : step.kind === 'forgot' ? (
          <Words tone="muted" isCentred>
            {say('screens.whoIsWatching.enterThePasswordToChoose', { name: profile.name })}
          </Words>
        ) : null}

        <ARising turn={1} stretches>
          <View style={styles.asking}>
            {step.kind === 'forgot' ? (
              <TextField
                label={say('common.password')}
                value={password}
                onValueChange={setPassword}
                placeholder={say('common.password')}
                isSecret
                fills="password"
              />
            ) : null}

            <TextField
              label={
                isSettingAPin
                  ? say('screens.whoIsWatching.newPin')
                  : say('screens.whoIsWatching.pin')
              }
              value={pin}
              onValueChange={(typed) => {
                setPin(typed.replace(/\D/gu, '').slice(0, 8));
              }}
              placeholder={
                isSettingAPin
                  ? say('screens.whoIsWatching.fourToEightDigits')
                  : say('screens.whoIsWatching.pin')
              }
              keyboard="code"
              isSecret
              onSubmit={send}
            />

            {isSettingAPin ? (
              <TextField
                label={say('screens.whoIsWatching.typeThePinAgain')}
                value={again}
                onValueChange={(typed) => {
                  setAgain(typed.replace(/\D/gu, '').slice(0, 8));
                }}
                placeholder={say('screens.whoIsWatching.typeThePinAgain')}
                keyboard="code"
                isSecret
                onSubmit={send}
              />
            ) : null}

            {again !== '' && isSettingAPin && again !== pin ? (
              <Words tone="danger">{say('screens.whoIsWatching.thosePinsDoNotMatch')}</Words>
            ) : null}

            {problem === null ? null : <Words tone="danger">{problem}</Words>}

            <Button
              tone="bold"
              icon={PlayFilled}
              isBusy={isAsking}
              isDisabled={!canSend}
              onPress={send}
            >
              {say('common.continue')}
            </Button>

            {step.kind === 'pin' ? (
              <Button
                tone="ghost"
                onPress={() => {
                  clear();
                  setStep({ kind: 'forgot', profile });
                }}
              >
                {say('screens.whoIsWatching.forgotThePin')}
              </Button>
            ) : null}

            <Button
              tone="ghost"
              icon={ChevronLeft}
              onPress={() => {
                clear();
                setStep({ kind: 'faces' });
              }}
            >
              {say('common.somebodyElse')}
            </Button>
          </View>
        </ARising>
      </View>
    </Screen>,
  );
};

AWhoIsWatching.displayName = 'AWhoIsWatching';

export { AWhoIsWatching };
