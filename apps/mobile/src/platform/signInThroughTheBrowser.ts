import { swapTheHandBack } from '@ValenceClient/phone/swapTheHandBack';
import { aSecretAndItsChallenge } from '@ValenceMobile/platform/aSecretAndItsChallenge';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { signInOnTheWeb } from '@ValenceMobile/platform/signInOnTheWeb';
import { theCodeIn } from '@ValenceMobile/platform/theCodeIn';

/**
 * Signs this phone in through the Valence web page, which can do what the app cannot, such as ask
 * for a passkey.
 *
 * The page is sent a challenge and the phone keeps the secret it was made from, so the code the page
 * hands back is worth nothing to anything else that catches it on the way. Where somebody already
 * chose who they are in the app, the page is told, so it does not ask again.
 *
 * @param profileId - The profile somebody chose in the app, where they chose one.
 * @returns Whether somebody is now signed in, gave up, or could not be.
 */
const signInThroughTheBrowser = async (
  profileId: string | null = null,
): Promise<'in' | 'cancelled' | 'failed'> => {
  const { secret, challenge } = await aSecretAndItsChallenge();
  const asking = profileId === null ? '' : `&profile=${encodeURIComponent(profileId)}`;
  const came = await signInOnTheWeb(
    onThisServer(`/phone-sign-in?challenge=${challenge}${asking}`),
  ).catch(() => undefined);

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
