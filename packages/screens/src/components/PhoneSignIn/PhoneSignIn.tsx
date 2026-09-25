import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { Button } from '@ValenceUI/Button';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { handBackToThePhone } from '@ValenceClient/phone/handBackToThePhone';
import { signedInOnThisPage } from '@ValenceScreens/phone/signedInOnThisPage';
import type { PhoneSignInProps } from './PhoneSignIn.types';
import { say } from '@ValenceI18n/say';

type Standing = 'asking' | 'handing' | 'handed' | 'failed';

/**
 * The page the phone app opens to sign somebody in with what only a browser can do, such as a
 * passkey, and hands the session back to it.
 *
 * Somebody who signed in on this page just now is handed straight back, since signing in was them
 * saying yes. Somebody the browser already had signed in says yes first: handing it back the moment
 * the page loaded would let a link sent to somebody already signed in give their session to whatever
 * answers to the app's address on their phone. Only this page's own memory says which it was, so
 * nothing in a link can claim it. Handing back can be tried again where it did not go through.
 *
 * @param name - What this instance is called.
 */
const PhoneSignIn = ({ name }: PhoneSignInProps) => {
  const { challenge } = useSearch({ strict: false });
  const who = useQuery(sessionQueries.who());
  const [standing, setStanding] = useState<Standing>('asking');
  const hasHandedOnItsOwn = useRef(false);

  const handBack = async (asked: string): Promise<void> => {
    setStanding('handing');

    const url = await handBackToThePhone(asked);

    if (url === null) {
      setStanding('failed');

      return;
    }

    setStanding('handed');
    window.location.assign(url);
  };

  useEffect(() => {
    if (challenge === undefined || hasHandedOnItsOwn.current || !signedInOnThisPage.read()) {
      return;
    }

    hasHandedOnItsOwn.current = true;
    signedInOnThisPage.forget();
    void handBack(challenge);
  });

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-text">{say('screens.phoneSignIn.heading')}</h1>

        <p className="text-sm text-text-muted">
          {who.data?.name === undefined
            ? say('screens.phoneSignIn.askedAsYou', { name })
            : say('screens.phoneSignIn.askedAs', { name, who: who.data.name })}
        </p>
      </header>

      {challenge === undefined ? (
        <p className="text-base text-text">{say('screens.phoneSignIn.openedByTheApp')}</p>
      ) : standing === 'handed' ? (
        <p className="text-base text-text">{say('screens.phoneSignIn.signedIn')}</p>
      ) : standing === 'failed' ? (
        <div className="flex flex-col gap-4">
          <p className="text-base text-text">{say('screens.phoneSignIn.failed')}</p>

          <Button
            variant="glossy"
            size="lg"
            onClick={() => {
              void handBack(challenge);
            }}
          >
            {say('common.tryAgain')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-base text-text">{say('screens.phoneSignIn.onlyContinueIf')}</p>

          <Button
            variant="glossy"
            size="lg"
            isLoading={standing === 'handing'}
            onClick={() => {
              void handBack(challenge);
            }}
          >
            {say('screens.phoneSignIn.continue')}
          </Button>
        </div>
      )}
    </main>
  );
};

PhoneSignIn.displayName = 'PhoneSignIn';

export { PhoneSignIn };
