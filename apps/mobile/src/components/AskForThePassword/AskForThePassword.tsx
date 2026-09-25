import { ChevronLeft } from '@keyline-icons/react-native';
import { Play as PlayFilled } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInAsProfile } from '@ValenceClient/profiles/fetchEveryone';
import { ACarriedMark } from '@ValenceMobile/components/ACarriedMark/ACarriedMark';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { AskForTheCode } from '@ValenceMobile/components/AskForTheCode/AskForTheCode';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { UseAPasskey } from '@ValenceMobile/components/UseAPasskey/UseAPasskey';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useArrivingFrom } from '@ValenceMobile/hooks/useArrivingFrom';
import { say } from '@ValenceI18n/say';
import type { AskForThePasswordProps } from './AskForThePassword.types';

const NAMED_AFTER = 100;

const MARK_HIGH = 40;

const styles = StyleSheet.create({
  asking: { alignSelf: 'stretch', gap: 14 },
  gone: { opacity: 0 },
  markAtTheTop: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
  page: { flex: 1 },
  whole: { alignItems: 'center', gap: 28 },
});

/**
 * Asks for the password of the face somebody picked, as the web asks for it: their face flying up
 * from where it was on the wall to sit large at the head of the screen, their name beneath it, and
 * the password, a way to use a passkey instead, and a way back to the other faces rising in under
 * it. Going back says where the face is, so it can fly home.
 *
 * An account with a second factor goes on to be asked for it once the password has been accepted,
 * rather than the two being asked for together: somebody whose password was wrong should hear
 * that, not be asked for a code they will then be refused over.
 *
 * @param profile - Whose face was picked.
 * @param from - Where the face was on the wall, and how big.
 * @param onIn - Told once they are through, with where their face is, for it to fly on from.
 * @param isGoing - Whether their face has taken off for the library, and so is no longer drawn here.
 * @param onBack - Told they want a different face, and where this one is.
 */
const AskForThePassword = ({
  profile,
  from = null,
  onIn,
  onBack,
  isGoing = false,
}: AskForThePasswordProps) => {
  const room = useSafeAreaInsets();
  const { placed, onPlaced, flying } = useArrivingFrom(() => from, from !== null, true);
  const [password, setPassword] = useState('');
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isTrying, setIsTrying] = useState(false);
  const [wantsCode, setWantsCode] = useState(false);

  const tryIt = async () => {
    setIsTrying(true);
    setRefusal(null);

    const outcome = await signInAsProfile(profile.id, password);

    setIsTrying(false);

    if (outcome.kind === 'signedIn') {
      goIn();

      return;
    }

    if (outcome.kind === 'needsCode') {
      setWantsCode(true);

      return;
    }

    setRefusal(outcome.reason);
  };

  const goIn = () => {
    if (placed.current === null) {
      onIn(null);

      return;
    }

    placed.current.measureInWindow((x, y, width, height) => {
      onIn({ x, y, width, height });
    });
  };

  const leave = () => {
    if (placed.current === null) {
      onBack(null);

      return;
    }

    placed.current.measureInWindow((x, y, width, height) => {
      onBack({ x, y, width, height });
    });
  };

  if (wantsCode) {
    return (
      <AskForTheCode
        onIn={() => {
          onIn(null);
        }}
        onBack={() => {
          onBack(null);
        }}
      />
    );
  }

  return (
    <View style={styles.page}>
      <Screen scrolls centres isSeeThrough>
        <View style={styles.whole}>
          <View ref={placed} collapsable={false} onLayout={onPlaced} style={isGoing && styles.gone}>
            <Animated.View style={flying}>
              <AFace profile={profile} isLarge />
            </Animated.View>
          </View>

          <ARising after={NAMED_AFTER}>
            <Words size="title">{profile.name}</Words>
          </ARising>

          <ARising after={NAMED_AFTER} turn={1} stretches>
            <View style={styles.asking}>
              <TextField
                label={say('phone.askForThePassword.passwordLabel')}
                value={password}
                onValueChange={setPassword}
                placeholder={say('phone.askForThePassword.passwordLabel')}
                isSecret
                onSubmit={() => {
                  void tryIt();
                }}
              />

              {refusal === null ? null : <Words tone="danger">{refusal}</Words>}

              <Button
                tone="bold"
                icon={PlayFilled}
                isBusy={isTrying}
                isDisabled={password === ''}
                onPress={() => {
                  void tryIt();
                }}
              >
                {say('phone.askForThePassword.watch')}
              </Button>

              <UseAPasskey
                label={say('phone.askForThePassword.usePasskey')}
                onIn={goIn}
                profileId={profile.id}
              />

              <Button tone="ghost" icon={ChevronLeft} onPress={leave}>
                {say('phone.askForThePassword.somebodyElse')}
              </Button>
            </View>
          </ARising>
        </View>
      </Screen>

      <View style={[styles.markAtTheTop, { top: room.top + SCREEN_EDGE }]} pointerEvents="none">
        <ACarriedMark high={MARK_HIGH} />
      </View>
    </View>
  );
};

AskForThePassword.displayName = 'AskForThePassword';

export { AskForThePassword };
