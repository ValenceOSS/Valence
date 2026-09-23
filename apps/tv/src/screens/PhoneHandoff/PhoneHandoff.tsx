import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { askWhetherTheDeviceMayIn, startDeviceGrant } from '@ValenceClient/session/auth';
import { anAddressAPhoneCanReach } from '@ValenceClient/session/anAddressAPhoneCanReach';
import { whereToTypeTheCode } from '@ValenceClient/session/whereToTypeTheCode';
import { QrCode } from '@ValenceTv/components/QrCode/QrCode';
import { Button } from '@ValenceTv/components/Button/Button';
import { theServersOrigin } from '@ValenceTv/platform/theServersOrigin';
import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { WayInBackdrop } from '@ValenceTv/components/WayInBackdrop/WayInBackdrop';
import { tokens } from '@ValenceTv/theme/tokens';
import type { DeviceGrant } from '@ValenceClient/session/auth';
import type { PhoneHandoffProps } from './PhoneHandoff.types';

const SLOWS_BY_SECONDS = 5;

const A_SECOND = 1000;

/**
 * Signs this television in from a phone: a code to scan or type, and a wait while somebody approves
 * it on a device that already has a keyboard and a session.
 *
 * The address is put on the server this television reached rather than the one the server believes
 * it is, since a self-hosted server often calls itself `localhost` — true on its own machine and
 * useless on a phone across the room.
 *
 * @param onSignedIn - Told once the phone has let this television in.
 * @param onBack - Told when somebody would rather pick a face and type a PIN.
 */
const PhoneHandoff = ({ onSignedIn, onBack }: PhoneHandoffProps) => {
  const [grant, setGrant] = useState<DeviceGrant | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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
        onSignedIn();

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
  }, [attempt, onSignedIn]);

  const origin = theServersOrigin() ?? '';

  return (
    <View style={styles.screen}>
      <WayInBackdrop />
      <Text style={styles.title}>Sign in with your phone</Text>

      {grant === null ? (
        <ActivityIndicator size="large" color={tokens.colours.text} />
      ) : (
        <View style={styles.handoff}>
          <QrCode
            value={anAddressAPhoneCanReach(grant.verificationUriComplete, origin)}
            size={360}
            label="A code to scan with your phone's camera"
          />

          <View style={styles.steps}>
            <Text style={styles.step}>Scan the code with your phone, or go to</Text>
            <Text style={styles.address}>
              {whereToTypeTheCode(anAddressAPhoneCanReach(grant.verificationUri, origin))}
            </Text>
            <Text style={styles.step}>and enter</Text>
            <Text style={styles.code}>{grant.userCode}</Text>
          </View>
        </View>
      )}

      {problem === null ? null : <Text style={styles.problem}>{problem}</Text>}

      <Button label="Pick a face instead" variant="secondary" onPress={onBack} hasPreferredFocus />
    </View>
  );
};

PhoneHandoff.displayName = 'PhoneHandoff';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.colours.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.lg,
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  handoff: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xl },
  steps: { gap: tokens.space.sm, maxWidth: 720 },
  step: { color: tokens.colours.muted, fontSize: tokens.type.body },
  address: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '600' },
  code: {
    color: tokens.colours.text,
    fontSize: tokens.type.hero,
    fontWeight: '700',
    letterSpacing: 12,
    fontFamily: 'Menlo',
  },
  problem: { color: tokens.colours.danger, fontSize: tokens.type.small },
});

export { PhoneHandoff };
