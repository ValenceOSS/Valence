import { say } from '@ValenceI18n/say';
import { readRefusal } from '@ValenceClient/admin/readRefusal';
import type { Refusal } from '@ValenceClient/admin/readRefusal';

/**
 * Gives an account that was just set up without a password its first one, for somebody whose
 * passkey did not take.
 *
 * @param password - The password chosen.
 * @returns Any refusal from the server.
 */
const giveFirstPassword = async (password: string): Promise<Refusal> => {
  const response = await fetch('/api/setup-links/password', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

export { giveFirstPassword };
