import { readFromServer } from '@ValenceClient/query/readFromServer';
import { readRefusal } from './readRefusal';
import type { Refusal } from './readRefusal';
import { AccountListSchema, AccountSchema } from '@ValenceContracts/schemas/Account';
import type { Account } from '@ValenceContracts/schemas/Account';
import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import { IssuedSetupLinkSchema } from '@ValenceContracts/schemas/SetupLink';
import type { SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';
import { z } from 'zod';
import { say } from '@ValenceI18n/say';

const AddedAccountSchema = z.object({
  account: AccountSchema,
  setupLink: IssuedSetupLinkSchema.nullable(),
});

type AddedAccount = z.infer<typeof AddedAccountSchema>;

/**
 * Everybody with an account on this server, with what each may do and whether they are banned. What
 * the administration page needs to show them all in one table.
 */
const fetchAccounts = async (): Promise<Account[]> =>
  (await readFromServer('/api/admin/accounts', AccountListSchema)).accounts;

/**
 * Bans an account, with a reason the person is shown when they next try to sign in. Their sessions
 * end; nothing they have watched or kept is touched.
 *
 * @param userId - The account to ban.
 * @param reason - What they are told.
 * @returns Any refusal from the server.
 */
const banAccount = async (userId: string, reason: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/ban`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason }),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Lifts a ban, letting the account sign in again with everything it had before.
 *
 * @param userId - The account to unban.
 * @returns Any refusal from the server.
 */
const unbanAccount = async (userId: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/ban`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Removes an account and everything hanging off it — its profiles, their history and their progress.
 * A ban is the reversible version of this; removal is not.
 *
 * @param userId - The account to remove.
 * @returns Any refusal from the server.
 */
const removeAccount = async (userId: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Adds an account. With no password it is given a setup link for its owner to choose their own,
 * which comes back with it; anything else left out is left for its owner too.
 *
 * @param request - Its name, and any username, address, password and link lifetime.
 * @returns The account and its link, or why it was refused.
 */
const inviteAccount = async (request: {
  name: string;
  username?: string;
  email?: string;
  password?: string;
  lifetimeDays?: SetupLinkLifetime;
}): Promise<{ kind: 'added'; added: AddedAccount } | { kind: 'refused'; refusal: Refusal }> => {
  const response = await fetch('/api/admin/accounts', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  }).catch(() => null);

  if (response === null) {
    return { kind: 'refused', refusal: { message: say('common.theServerCouldNotBeReached') } };
  }

  if (!response.ok) {
    return { kind: 'refused', refusal: await readRefusal(response) };
  }

  const read = AddedAccountSchema.safeParse(await response.json().catch(() => null));

  return read.success
    ? { kind: 'added', added: read.data }
    : {
        kind: 'refused',
        refusal: { message: say('client.admin.readRefusal.thatCouldNotBeDoneTry') },
      };
};

/**
 * Changes an account's name, username or address. Takes only what changed rather than the whole
 * account, so an administrator editing one field does not have to resend the others.
 *
 * @param userId - The account to change.
 * @param changes - What to change about it.
 * @returns Any refusal from the server.
 */
const editAccount = async (
  userId: string,
  changes: { name?: string; username?: string; email?: string | null },
): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Sets an account's password directly, ending every session it holds so signing back in needs the new
 * one. There is nowhere to send it, so whoever resets it has to tell the account holder themselves.
 *
 * @param userId - The account to change.
 * @param password - The new password.
 * @returns Any refusal from the server.
 */
const resetAccountPassword = async (userId: string, password: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/password`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Uploads a new picture for an account, on its behalf.
 *
 * @param userId - The account to change.
 * @param photo - The picture to save.
 * @returns Any refusal from the server.
 */
const setAccountPhoto = async (userId: string, photo: File): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/photo`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': photo.type },
    body: photo,
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Gives an account a drawn face, an initial, or a new colour, on its behalf.
 *
 * @param userId - The account to change.
 * @param changes - What to change about how it appears.
 * @returns Any refusal from the server.
 */
const setAccountAvatar = async (
  userId: string,
  changes: { avatar?: Avatar; colour?: ProfileColour },
): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/avatar`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

export {
  fetchAccounts,
  banAccount,
  unbanAccount,
  removeAccount,
  inviteAccount,
  editAccount,
  resetAccountPassword,
  setAccountPhoto,
  setAccountAvatar,
};
export type { Account, AddedAccount };
