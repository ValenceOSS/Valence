import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { askWhetherTheDeviceMayIn, startDeviceGrant } from '@ValenceClient/session/auth';
import { anAddressAPhoneCanReach } from '@ValenceClient/session/anAddressAPhoneCanReach';
import { whereToTypeTheCode } from '@ValenceClient/session/whereToTypeTheCode';
import { QrCode } from '@ValenceTv/components/QrCode/QrCode';
import { theServersOrigin } from '@ValenceTv/platform/theServersOrigin';
import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { tokens } from '@ValenceTv/theme/tokens';
import type { DeviceGrant } from '@ValenceClient/session/auth';
import type { PhoneSignInProps } from './PhoneSignIn.types';

const SLOWS_BY_SECONDS = 5;

const A_SECOND = 1000;

/**
 * Signing in from a phone: a code to scan that opens the page for letting a television in, or its
 * address to type, and the code to enter there, while the television waits for the phone to say
 * yes. The scanned code carries only the address, never the code to enter, so whoever says yes has
 * to be able to read this screen. A code that runs out, or a phone that says no, is
 * answered with a new code rather than a dead end. The address is put on the server this
 * television reached rather than the one the server believes it is, since a self-hosted server often
 * calls itself `localhost` — true on its own machine and useless on a phone across the room.
 *
 * @param onSignedIn - Told once the phone has let the television in.
 * @param isStacked - Whether the words sit beneath the code to scan, for a narrow column, rather
 *   than beside it.
 */
const PhoneSignIn = ({ onSignedIn, isStacked = false }: PhoneSignInProps) => {
  const [grant, setGrant] = useState<DeviceGrant | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const toldIn = useRef(onSignedIn);

  useEffect(() => {
    toldIn.current = onSignedIn;
  });

  useEffect(() => {
    let isAbandoned = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const ask = async (started: DeviceGrant, everySeconds: number) => {
      const outcome = await askWhetherTheDeviceMayIn(started.deviceCode);

      if (isAbandoned) {
        return;
      }

      if (outcome.kind === 'signedIn') {
        await holdTheSession(outcome.token);
        toldIn.current();

        return;
      }

      if (outcome.kind === 'refused' || outcome.kind === 'expired' || outcome.kind === 'failed') {
        setProblem(
          outcome.kind === 'refused'
            ? 'That phone said no.'
            : outcome.kind === 'expired'
              ? 'That code ran out. Here is a new one.'
              : outcome.reason,
        );
        setAttempt((was) => was + 1);

        return;
      }

      const next = outcome.kind === 'slowDown' ? everySeconds + SLOWS_BY_SECONDS : everySeconds;

      timer = setTimeout(() => {
        void ask(started, next);
      }, next * A_SECOND);
    };

    void startDeviceGrant().then((started) => {
      if (isAbandoned) {
        return;
      }

      if (started === null) {
        setProblem('This Valence would not start a sign-in.');

        return;
      }

      setGrant(started);
      timer = setTimeout(() => {
        void ask(started, started.intervalSeconds);
      }, started.intervalSeconds * A_SECOND);
    });

    return () => {
      isAbandoned = true;

      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [attempt]);

  const origin = theServersOrigin() ?? '';

  if (grant === null) {
    return (
      <View style={styles.waiting}>
        {problem === null ? (
          <ActivityIndicator size="large" color={tokens.colours.text} />
        ) : (
          <Text style={styles.problem}>{problem}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.handoff, isStacked && styles.stacked]}>
      <QrCode
        value={anAddressAPhoneCanReach(grant.verificationUri, origin)}
        size={isStacked ? 300 : 360}
        label="A code to scan with your phone's camera"
      />

      <View style={[styles.steps, isStacked && styles.stackedSteps]}>
        <Text style={styles.step}>Scan the code with your phone, or go to</Text>
        <Text style={styles.address}>
          {whereToTypeTheCode(anAddressAPhoneCanReach(grant.verificationUri, origin))}
        </Text>
        <Text style={styles.step}>and enter</Text>
        <Text style={[styles.code, isStacked && styles.stackedCode]}>{grant.userCode}</Text>
        {problem === null ? null : <Text style={styles.problem}>{problem}</Text>}
      </View>
    </View>
  );
};

PhoneSignIn.displayName = 'PhoneSignIn';

const styles = StyleSheet.create({
  waiting: { minHeight: 300, alignItems: 'center', justifyContent: 'center' },
  handoff: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xl },
  stacked: { flexDirection: 'column', gap: tokens.space.lg },
  steps: { gap: tokens.space.sm, maxWidth: 720 },
  stackedSteps: { alignItems: 'center' },
  step: { color: tokens.colours.muted, fontSize: tokens.type.body },
  address: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '600' },
  code: {
    color: tokens.colours.text,
    fontSize: tokens.type.hero,
    fontWeight: '700',
    letterSpacing: 12,
    fontFamily: 'Menlo',
  },
  stackedCode: { fontSize: tokens.type.title },
  problem: { color: tokens.colours.danger, fontSize: tokens.type.small },
});

export { PhoneSignIn };
