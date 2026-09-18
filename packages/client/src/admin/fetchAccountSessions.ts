import { readFromServer } from '@ValenceClient/query/readFromServer';
import { readRefusal } from './readRefusal';
import type { Refusal } from './readRefusal';
import { z } from 'zod';

const AccountSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  signedInAt: z.string(),
  expiresAt: z.string(),
});

const AccountSessionListSchema = z.object({ sessions: z.array(AccountSessionSchema) });

type AccountSession = z.infer<typeof AccountSessionSchema>;

/**
 * Everywhere an account is signed in, for an administrator reviewing it rather than the account
 * itself — there is no session here that is "this one," since the administrator is not signed in as
 * them.
 *
 * @param userId - The account to read sessions for.
 */
const fetchAccountSessions = async (userId: string): Promise<AccountSession[]> => {
  return (await readFromServer(`/api/admin/accounts/${userId}/sessions`, AccountSessionListSchema))
    .sessions;
};

/**
 * Ends one of an account's sessions, for an administrator signing out a device that account does not
 * recognise.
 *
 * @param userId - The account the session belongs to.
 * @param sessionId - The session to end.
 * @returns Any refusal from the server.
 */
const endAccountSession = async (userId: string, sessionId: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/sessions/${sessionId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: 'The server could not be reached.' }
    : readRefusal(response);
};

/**
 * Ends every session an account holds, signing it out everywhere at once.
 *
 * @param userId - The account to sign out.
 * @returns Any refusal from the server.
 */
const endAccountSessions = async (userId: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/sessions`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: 'The server could not be reached.' }
    : readRefusal(response);
};

export type { AccountSession };
export { fetchAccountSessions, endAccountSession, endAccountSessions };
