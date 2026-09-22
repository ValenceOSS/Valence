import { swapTheHandBack } from '@ValenceClient/phone/swapTheHandBack';
import { aSecretAndItsChallenge } from '@ValencePhone/platform/aSecretAndItsChallenge';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { signInOnTheWeb } from '@ValencePhone/platform/signInOnTheWeb';
import { theCodeIn } from '@ValencePhone/platform/theCodeIn';

/**
 * Signs this phone in through the Valence web page, which can do what the app cannot, such as ask
 * for a passkey.
 *
 * The page is sent a challenge and the phone keeps the secret it was made from, so the code the page
 * hands back is worth nothing to anything else that catches it on the way.
 *
 * @returns Whether somebody is now signed in, gave up, or could not be.
 */
const signInThroughTheBrowser = async (): Promise<'in' | 'cancelled' | 'failed'> => {
  const { secret, challenge } = await aSecretAndItsChallenge();
  const came = await signInOnTheWeb(onThisServer(`/phone-sign-in?challenge=${challenge}`)).catch(
    () => undefined,
  );

  if (came === null) {
    return 'cancelled';
  }

  const code = came === undefined ? null : theCodeIn(came);

  if (code === null) {
    return 'failed';
  }

  return (await swapTheHandBack(code, secret)) ? 'in' : 'failed';
};

export { signInThroughTheBrowser };
