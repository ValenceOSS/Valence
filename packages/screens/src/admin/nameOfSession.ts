import { describeGuest } from '@ValenceCore/functions/describeGuest';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

/**
 * What to call whoever has a tab open, on a screen listing who is watching.
 *
 * A guest signs in as nobody, so the only thing worth showing is whose link let them in — "Dan's
 * guest". Everybody else is their own name, and a tab that has not said who it belongs to yet is
 * neither.
 *
 * @param session - The open tab.
 * @returns What to call them.
 */
const nameOfSession = (
  session: Pick<ActiveSession, 'isGuest' | 'guestOf' | 'profileName'>,
): string =>
  session.isGuest ? describeGuest(session.guestOf) : (session.profileName ?? 'Unknown viewer');

export { nameOfSession };
