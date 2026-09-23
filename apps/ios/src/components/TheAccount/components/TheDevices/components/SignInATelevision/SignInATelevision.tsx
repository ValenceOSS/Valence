import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Check, Tv, X } from 'lucide-react-native';
import { answerDeviceRequest, readDeviceRequest } from '@ValenceClient/session/auth';
import { tidyTheCode } from '@ValenceClient/session/tidyTheCode';
import { Button } from '@ValencePhone/components/Button/Button';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';

type Standing = 'asking' | 'reading' | 'waiting' | 'allowed' | 'refused' | 'wrong';

const styles = StyleSheet.create({
  section: { gap: 12 },
});

/**
 * The phone's half of signing a television in, as the web's page for it has it: the code the
 * television shows, checked against the server, then a plain yes or no.
 *
 * Turning it down is offered as plainly as letting it in, because somebody who was not expecting to
 * be asked is the case this exists for.
 */
const SignInATelevision = () => {
  const colours = useTheColours();
  const [typed, setTyped] = useState('');
  const [standing, setStanding] = useState<Standing>('asking');
  const [isAnswering, setIsAnswering] = useState(false);

  const check = async () => {
    setStanding('reading');

    const found = await readDeviceRequest(tidyTheCode(typed));

    setStanding(found?.status === 'pending' ? 'waiting' : 'wrong');
  };

  const answer = async (isAllowed: boolean) => {
    setIsAnswering(true);

    const recorded = await answerDeviceRequest(tidyTheCode(typed), isAllowed);

    setIsAnswering(false);
    setStanding(!recorded ? 'wrong' : isAllowed ? 'allowed' : 'refused');
  };

  const again = () => {
    setTyped('');
    setStanding('asking');
  };

  return (
    <View style={styles.section}>
      <Words size="heading">Sign in a television</Words>

      {standing === 'allowed' || standing === 'refused' ? (
        <>
          <Words>
            {standing === 'allowed'
              ? 'Done. The television should be watching in a moment.'
              : 'Turned down. Nothing was signed in, and the code on that screen no longer works.'}
          </Words>
          <Button tone="quiet" onPress={again}>
            Another television
          </Button>
        </>
      ) : standing === 'reading' ? (
        <ActivityIndicator color={colours.textMuted} />
      ) : standing === 'waiting' ? (
        <>
          <Words>
            A television is asking to sign in as you. Only say yes if it is the one in front of you.
          </Words>
          <Button
            icon={Check}
            isBusy={isAnswering}
            onPress={() => {
              void answer(true);
            }}
          >
            Yes, that is mine
          </Button>
          <Button
            tone="ghost"
            icon={X}
            isDisabled={isAnswering}
            onPress={() => {
              void answer(false);
            }}
          >
            No, I did not ask for this
          </Button>
        </>
      ) : (
        <>
          <Words tone="muted">
            A television showing a code can be signed in from here, as you.
          </Words>
          <TextField
            label="The code on the television"
            value={typed}
            onValueChange={setTyped}
            placeholder="ABCD-1234"
            onSubmit={() => {
              if (tidyTheCode(typed) !== '') {
                void check();
              }
            }}
          />
          {standing === 'wrong' ? (
            <Words tone="danger">
              That code has run out, or there is no television waiting on it.
            </Words>
          ) : null}
          <Button
            icon={Tv}
            isDisabled={tidyTheCode(typed) === ''}
            onPress={() => {
              void check();
            }}
          >
            Continue
          </Button>
        </>
      )}
    </View>
  );
};

SignInATelevision.displayName = 'SignInATelevision';

export { SignInATelevision };
