import { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ChevronLeft, Play } from 'lucide-react-native';
import { signInAsProfile } from '@ValenceClient/profiles/fetchEveryone';
import { ACarriedMark } from '@ValencePhone/components/ACarriedMark/ACarriedMark';
import { AFace } from '@ValencePhone/components/AFace/AFace';
import { ARising } from '@ValencePhone/components/ARising/ARising';
import { AskForTheCode } from '@ValencePhone/components/AskForTheCode/AskForTheCode';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { UseAPasskey } from '@ValencePhone/components/UseAPasskey/UseAPasskey';
import { Words } from '@ValencePhone/components/Words/Words';
import { useArrivingFrom } from '@ValencePhone/hooks/useArrivingFrom';
import type { AskForThePasswordProps } from './AskForThePassword.types';

const NAMED_AFTER = 100;

const MARK_HIGH = 40;

const styles = StyleSheet.create({
  asking: { alignSelf: 'stretch', gap: 14 },
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
 * @param onIn - Told once they are through.
 * @param onBack - Told they want a different face, and where this one is.
 */
const AskForThePassword = ({ profile, from = null, onIn, onBack }: AskForThePasswordProps) => {
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
      onIn();

      return;
    }

    if (outcome.kind === 'needsCode') {
      setWantsCode(true);

      return;
    }

    setRefusal(outcome.reason);
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
        onIn={onIn}
        onBack={() => {
          onBack(null);
        }}
      />
    );
  }

  return (
    <Screen scrolls centres isSeeThrough>
      <View style={styles.whole}>
        <ACarriedMark high={MARK_HIGH} />

        <View ref={placed} collapsable={false} onLayout={onPlaced}>
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
              tone="bold"
              icon={Play}
              isBusy={isTrying}
              isDisabled={password === ''}
              onPress={() => {
                void tryIt();
              }}
            >
              Watch
            </Button>

            <UseAPasskey label="Use a passkey instead" onIn={onIn} />

            <Button tone="ghost" icon={ChevronLeft} onPress={leave}>
              Somebody else
            </Button>
          </View>
        </ARising>
      </View>
    </Screen>
  );
};

AskForThePassword.displayName = 'AskForThePassword';

export { AskForThePassword };
