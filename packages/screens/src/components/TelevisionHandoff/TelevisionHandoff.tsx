import { useCallback, useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { QrCode } from '@ValenceUI/QrCode';
import { Spinner } from '@ValenceUI/Spinner';
import { askWhetherTheDeviceMayIn, startDeviceGrant } from '@ValenceClient/session/auth';
import { anAddressAPhoneCanReach } from '@ValenceClient/session/anAddressAPhoneCanReach';
import { whereToTypeTheCode } from '@ValenceClient/session/whereToTypeTheCode';
import type { DeviceGrant } from '@ValenceClient/session/auth';
import type { TelevisionHandoffProps } from './TelevisionHandoff.types';
import { say } from '@ValenceI18n/say';

const SLOWS_BY_SECONDS = 5;

/**
 * Signs a television in from a phone, because spelling an address and a password out with a remote
 * is the worst few minutes anybody has with a media server.
 *
 * The television asks for a code, shows it, and waits. Somebody opens the address on their phone,
 * signs in there the way they always do, and says yes. Nothing secret is typed on the television and
 * nothing secret is shown on it: the code on screen is not the one being polled with, so a person
 * reading it off a photograph gets nowhere without also being signed in to this household.
 *
 * Polled rather than pushed, and the reason is the whole situation: a television that has not signed
 * in has no account for a realtime message to be addressed to. The grant names its own rate to ask
 * at, and a server that says to slow down is obeyed rather than argued with.
 *
 * @param name - What this instance is called.
 * @param onSignedIn - Told when the television has been let in.
 */
const TelevisionHandoff = ({ name, onSignedIn }: TelevisionHandoffProps) => {
  const [grant, setGrant] = useState<DeviceGrant | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const askAgain = useCallback(() => {
    setGrant(null);
    setProblem(null);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let isStillHere = true;

    void startDeviceGrant().then((started) => {
      if (!isStillHere) {
        return;
      }

      if (started === null) {
        setProblem(say('screens.televisionHandoff.unreachable'));

        return;
      }

      setGrant(started);
    });

    return () => {
      isStillHere = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (grant === null) {
      return;
    }

    let isStillHere = true;
    let waitSeconds = grant.intervalSeconds;
    let next: ReturnType<typeof setTimeout> | null = null;

    const ask = async (): Promise<void> => {
      const outcome = await askWhetherTheDeviceMayIn(grant.deviceCode);

      if (!isStillHere) {
        return;
      }

      if (outcome.kind === 'signedIn') {
        onSignedIn();

        return;
      }

      if (outcome.kind === 'refused') {
        setProblem(say('screens.televisionHandoff.refused'));

        return;
      }

      if (outcome.kind === 'expired') {
        setProblem(say('screens.televisionHandoff.expired'));

        return;
      }

      if (outcome.kind === 'failed') {
        setProblem(outcome.reason);

        return;
      }

      if (outcome.kind === 'slowDown') {
        waitSeconds += SLOWS_BY_SECONDS;
      }

      next = setTimeout(() => {
        void ask();
      }, waitSeconds * 1000);
    };

    next = setTimeout(() => {
      void ask();
    }, waitSeconds * 1000);

    return () => {
      isStillHere = false;

      if (next !== null) {
        clearTimeout(next);
      }
    };
  }, [grant, onSignedIn]);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center gap-8 px-8 text-center">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-medium text-text">
          {say('screens.televisionHandoff.heading')}
        </h1>

        <p className="text-base text-text-muted">
          {say('screens.televisionHandoff.lede', { name })}
        </p>
      </header>

      {problem !== null ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-base text-danger">{problem}</p>

          <Button variant="glossy" size="lg" onClick={askAgain}>
            {say('screens.televisionHandoff.anotherCode')}
          </Button>
        </div>
      ) : grant === null ? (
        <Spinner label={say('screens.televisionHandoff.asking')} size="lg" />
      ) : (
        <div className="flex flex-col items-center gap-6">
          <QrCode
            value={anAddressAPhoneCanReach(grant.verificationUriComplete, window.location.origin)}
            label={say('screens.televisionHandoff.qrLabel')}
            size={200}
          />

          <p className="text-base text-text-muted">
            {whereToTypeTheCode(
              anAddressAPhoneCanReach(grant.verificationUri, window.location.origin),
            )}
          </p>

          <p className="font-mono text-5xl font-semibold tracking-[0.2em] text-text">
            {grant.userCode}
          </p>

          <p className="text-sm text-text-muted">{say('screens.televisionHandoff.waiting')}</p>
        </div>
      )}
    </main>
  );
};

TelevisionHandoff.displayName = 'TelevisionHandoff';

export { TelevisionHandoff };
