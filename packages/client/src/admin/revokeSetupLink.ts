import { say } from '@ValenceI18n/say';
import { readRefusal } from './readRefusal';
import type { Refusal } from './readRefusal';

/**
 * Stops an account's setup link working.
 *
 * @param userId - The account.
 * @returns Any refusal from the server.
 */
const revokeSetupLink = async (userId: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${encodeURIComponent(userId)}/setup-link`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

export { revokeSetupLink };
