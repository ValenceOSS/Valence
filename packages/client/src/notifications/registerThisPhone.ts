import type { PhonePush } from '@ValenceContracts/schemas/Notification';

/**
 * Tells the server this phone can be woken for notifications, and how to reach it through Apple or
 * Google, as whichever profile is signed in on it now.
 *
 * @param phone - The phone's push token, its platform, and Apple's environment.
 * @returns Whether the server took it.
 */
const registerThisPhone = async (phone: PhonePush): Promise<boolean> => {
  const answer = await fetch('/api/notifications/phones', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(phone),
  }).catch(() => null);

  return answer?.ok === true;
};

export { registerThisPhone };
