import { nameTheClient } from '@ValenceCore/functions/nameTheClient';
import { nameTheDevice } from '@ValenceCore/functions/nameTheDevice';
import type { RequestDevice } from '@ValenceServer/devices/deviceOfRequest';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';
import { say } from '@ValenceI18n/say';

const SIGN_IN_PATH = '/sign-in';

const DEVICE_TOKEN_PATH = '/device/token';

const REFUSED = say('server.auth.describeSignInAttempt.thoseDetailsWereNotAccepted');

type SignInAttempt = {
  path: string;
  statusCode: number | null;
  account: { id: string; name: string } | null;
  signedInAs: { id: string; name: string } | null;
  identifier: string | null;
  userAgent: string | null;
  device: RequestDevice;
  address: string | null;
};

/**
 * Turns one finished sign-in request into the event worth telling somebody about, or into nothing.
 *
 * A failure says which identifier was tried and never why it was refused. "Wrong password" and "no
 * such account" are the same sentence here on purpose: told apart, a webhook pointed at a chat
 * channel becomes an account-enumeration oracle that anybody in that channel can read.
 *
 * A television signing in with a code shown on its screen has signed in too, when its code is
 * approved; while it waits it asks again every few seconds and is turned away each time, which is
 * no failure worth telling anybody about.
 *
 * @param attempt - The request, as the hook that watched it finish saw it.
 * @param renamed - What the account's owner renamed this device to, where they did.
 * @returns What to publish, or nothing where this was not a sign-in worth reporting.
 */
const describeSignInAttempt = (
  attempt: SignInAttempt,
  renamed: string | null = null,
): WebhookOccurrence | null => {
  const isWithACode = attempt.path === DEVICE_TOKEN_PATH;

  if (!attempt.path.startsWith(SIGN_IN_PATH) && !isWithACode) {
    return null;
  }

  const deviceLabel = nameTheDevice(attempt.device.identity, renamed).message;
  const clientLabel = nameTheClient(attempt.device.identity).message;

  if (attempt.account !== null) {
    return {
      event: 'auth.succeeded',
      data: {
        accountId: attempt.account.id,
        name: attempt.account.name,
        deviceLabel,
        clientLabel,
        address: attempt.address,
      },
    };
  }

  if (isWithACode || attempt.statusCode === null || attempt.statusCode < 400) {
    return null;
  }

  return {
    event: 'auth.failed',
    data: {
      identifier:
        attempt.identifier ?? say('server.auth.describeSignInAttempt.somebodyWhoGaveNoAddress'),
      deviceLabel,
      clientLabel,
      address: attempt.address,
      reason: REFUSED,
    },
  };
};

export type { SignInAttempt };

export { describeSignInAttempt };
