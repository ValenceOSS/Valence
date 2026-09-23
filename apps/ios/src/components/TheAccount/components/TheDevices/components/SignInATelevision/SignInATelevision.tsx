import { Check, Monitor, ScanQrCode, X } from '@keyline-icons/react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { answerDeviceRequest, readDeviceRequest } from '@ValenceClient/session/auth';
import { theCodeInAScan } from '@ValenceClient/session/theCodeInAScan';
import { tidyTheCode } from '@ValenceClient/session/tidyTheCode';
import { Button } from '@ValencePhone/components/Button/Button';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import { scanACode } from '@ValencePhone/platform/scanACode';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { SignInATelevisionProps } from './SignInATelevision.types';

type Standing = 'asking' | 'reading' | 'waiting' | 'allowed' | 'refused' | 'wrong';

type Trouble = 'notATelevision' | 'typeTheCode' | 'noCamera' | 'noScanner';

const TROUBLE: Record<Trouble, string> = {
  notATelevision: 'That QR code is not one a television showed.',
  typeTheCode: 'Type the code the television shows, so it is known you are in front of it.',
  noCamera: 'Valence may not use the camera. It can be allowed in Settings.',
  noScanner: 'This device cannot scan codes. Type the one on the television instead.',
};

const A_HOST = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/iu;

const styles = StyleSheet.create({
  section: { gap: 12 },
});

/**
 * The host an address names, lower-cased, for telling whether two addresses are one server.
 *
 * @param address - The address.
 * @returns Its host, or null where it names none.
 */
const hostOf = (address: string | null): string | null =>
  address === null ? null : (A_HOST.exec(address)?.[1]?.toLowerCase() ?? null);

/**
 * The phone's half of signing a television in, as the web's page for it has it: the code the
 * television shows — typed, or read off its QR code with the camera — checked against the server,
 * then a plain yes or no.
 *
 * Turning it down is offered as plainly as letting it in, because somebody who was not expecting to
 * be asked is the case this exists for.
 *
 * Opened from a television's QR code scanned with the camera, it starts with that code already asked
 * about; where the code is not this server's, it says which server the television was asking.
 *
 * @param startsWith - A code to ask about straight away, where one came with the page.
 * @param askedFrom - The server the television asked, where the code came from a link.
 */
const SignInATelevision = ({ startsWith, askedFrom = null }: SignInATelevisionProps) => {
  const colours = useTheColours();
  const [typed, setTyped] = useState(startsWith ?? '');
  const [standing, setStanding] = useState<Standing>('asking');
  const [isAnswering, setIsAnswering] = useState(false);
  const [trouble, setTrouble] = useState<Trouble | null>(null);

  const check = async (code: string) => {
    setTrouble(null);
    setStanding('reading');

    const found = await readDeviceRequest(code);

    setStanding(found?.status === 'pending' ? 'waiting' : 'wrong');
  };

  const elsewhere =
    askedFrom !== null && hostOf(askedFrom) !== hostOf(platformInUse().serverAddress())
      ? hostOf(askedFrom)
      : null;

  useEffect(() => {
    if (startsWith !== undefined && tidyTheCode(startsWith) !== '') {
      void check(tidyTheCode(startsWith));
    }
  }, [startsWith]);

  const scan = async () => {
    const scanned = await scanACode();

    if (scanned.kind === 'closed') {
      return;
    }

    if (scanned.kind !== 'read') {
      setTrouble(scanned.kind === 'refused' ? 'noCamera' : 'noScanner');

      return;
    }

    const code = theCodeInAScan(scanned.text);

    if (code === null) {
      setTrouble(hostOf(scanned.text.trim()) === null ? 'notATelevision' : 'typeTheCode');

      return;
    }

    setTyped(code);
    await check(code);
  };

  const answer = async (isAllowed: boolean) => {
    setIsAnswering(true);

    const recorded = await answerDeviceRequest(tidyTheCode(typed), isAllowed);

    setIsAnswering(false);
    setStanding(!recorded ? 'wrong' : isAllowed ? 'allowed' : 'refused');
  };

  const again = () => {
    setTyped('');
    setTrouble(null);
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
            A television showing a code can be signed in from here, as you. Type the code, or scan
            the QR code beside it.
          </Words>
          <TextField
            label="The code on the television"
            value={typed}
            onValueChange={setTyped}
            placeholder="ABCD-1234"
            onSubmit={() => {
              if (tidyTheCode(typed) !== '') {
                void check(tidyTheCode(typed));
              }
            }}
            action={{
              icon: ScanQrCode,
              label: 'Scan the QR code',
              onPress: () => {
                void scan();
              },
            }}
          />
          {trouble === null ? null : <Words tone="danger">{TROUBLE[trouble]}</Words>}
          {trouble === 'noCamera' ? (
            <Button
              tone="quiet"
              onPress={() => {
                void Linking.openSettings();
              }}
            >
              Open Settings
            </Button>
          ) : null}
          {standing === 'wrong' ? (
            <Words tone="danger">
              {elsewhere === null
                ? 'That code has run out, or there is no television waiting on it.'
                : `That television is asking ${elsewhere}, and this phone uses a different server.`}
            </Words>
          ) : null}
          <Button
            icon={Monitor}
            isDisabled={tidyTheCode(typed) === ''}
            onPress={() => {
              void check(tidyTheCode(typed));
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
