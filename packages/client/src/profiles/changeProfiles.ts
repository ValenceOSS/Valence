import { readRefusal } from '@ValenceClient/admin/readRefusal';
import { say } from '@ValenceI18n/say';
import { profilesAddress } from './profilesAddress';

/**
 * Asks the server for a change to an account's profiles, at the account's own address or, for an
 * administrator, at the account's address in the admin area.
 *
 * @param change - Where under the profiles' address, how, with what, and on whose account.
 * @param change.path - What follows the profiles' address, such as a profile's id and its PIN.
 * @param change.method - How to ask.
 * @param change.body - What to send, where anything.
 * @param change.accountId - Whose account, where an administrator is changing somebody else's.
 * @returns Why it was refused, in the server's words, or nothing where it was done.
 */
const changeProfiles = async (change: {
  path: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: object;
  accountId?: string;
}): Promise<string | null> => {
  const response = await fetch(`${profilesAddress(change.accountId)}${change.path}`, {
    method: change.method,
    ...(change.body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(change.body) }),
  }).catch(() => null);

  if (response === null) {
    return say('common.valenceCouldNotBeReached');
  }

  return (await readRefusal(response))?.message ?? null;
};

export { changeProfiles };
