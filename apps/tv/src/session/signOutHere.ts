import { signOut } from '@ValenceClient/session/auth';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';

/**
 * Signs this television out of Valence altogether, so the way in asks who is watching again.
 *
 * A television can hold two sessions at once — the one its token names and one a cookie left from
 * an earlier sign-in — and signing out ends only the session a request is signed with. So the
 * token's session is ended first, the token forgotten, and then whatever session the cookie still
 * holds is ended too; otherwise the cookie's session answers that somebody is still signed in.
 */
const signOutHere = async (): Promise<void> => {
  await signOut().catch(() => false);
  keepTheSessionToken(null);
  await signOut().catch(() => false);
};

export { signOutHere };
