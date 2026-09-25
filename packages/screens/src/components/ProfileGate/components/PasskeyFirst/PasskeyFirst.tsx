import { useEffect, useRef } from 'react';
import { Key as KeyIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import type { PasskeyFirstProps } from './PasskeyFirst.types';

/**
 * The way in the phone app's sheet opens on: a passkey, asked for the moment the page opens, with a
 * button to ask again and a way to the usual sign-in for somebody without one.
 *
 * The first ask is quiet: a browser that will only ask for a passkey after a tap refuses it, and that
 * is no reason to show somebody an error before they have touched anything.
 *
 * @param name - What this server calls itself.
 * @param isUsingPasskey - Whether a passkey is being asked for.
 * @param problem - What went wrong with the last one, where anything did.
 * @param onPasskey - Told to ask for a passkey, and whether to stay quiet about a refusal.
 * @param onOtherWays - Told somebody wants to sign in another way.
 */
const PasskeyFirst = ({
  name,
  isUsingPasskey,
  problem,
  onPasskey,
  onOtherWays,
}: PasskeyFirstProps) => {
  const hasAsked = useRef(false);

  useEffect(() => {
    if (hasAsked.current) {
      return;
    }

    hasAsked.current = true;
    onPasskey(true);
  }, [onPasskey]);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-text">Sign in to the app</h1>

        <p className="text-sm text-text-muted">
          Use the passkey you sign in to {name} with, and the app on your phone signs in too.
        </p>
      </header>

      {problem === null ? null : <p className="text-sm text-danger">{problem}</p>}

      <div className="flex flex-col gap-3">
        <Button
          variant="glossy"
          size="lg"
          isLoading={isUsingPasskey}
          onClick={() => {
            onPasskey(false);
          }}
        >
          <Icon of={KeyIcon} size={18} />
          Use a passkey
        </Button>

        <Button variant="ghost" size="sm" onClick={onOtherWays}>
          Other ways to sign in
        </Button>
      </div>
    </main>
  );
};

PasskeyFirst.displayName = 'PasskeyFirst';

export { PasskeyFirst };
