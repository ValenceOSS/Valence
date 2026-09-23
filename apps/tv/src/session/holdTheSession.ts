import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';

const SessionSchema = z.object({ session: z.object({ token: z.string().min(1) }) }).nullable();

/**
 * Keeps hold of the session this television just signed in with, as the token it sends from now on.
 *
 * Signing in with a password answers with a cookie, which `fetch` keeps; the player and the socket
 * keep no cookies of their own, so the session is asked for once and its token kept for them. A
 * phone's approval hands the token over directly, and that is kept the same way.
 *
 * @param token - The token, where the sign-in handed one over; otherwise it is asked for.
 * @returns Whether a session was there to keep.
 */
const holdTheSession = async (token?: string): Promise<boolean> => {
  if (token !== undefined) {
    keepTheSessionToken(token);

    return true;
  }

  const read = await readFromServer('/api/auth/get-session', SessionSchema).catch(() => null);

  if (read === null) {
    return false;
  }

  keepTheSessionToken(read.session.token);

  return true;
};

export { holdTheSession };
