import { describeGuest } from '@ValenceCore/functions/describeGuest';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import { say } from '@ValenceI18n/say';

/**
 * What to call whoever has a tab open, on a screen listing who is watching.
 *
 * A guest signs in as nobody, so the only thing worth showing is whose link let them in — "Dan's
 * guest". Somebody watching from a linked server is named with it — "Sam from Kai's Valence" — or
 * as somebody from it, where that server keeps names to itself. Everybody else is their own name,
 * and a tab that has not said who it belongs to yet is neither.
 *
 * @param session - The open tab.
 * @returns What to call them.
 */
const nameOfSession = (
  session: Pick<ActiveSession, 'isGuest' | 'guestOf' | 'profileName'> &
    Partial<Pick<ActiveSession, 'fromServer'>>,
): string => {
  if (session.fromServer !== null && session.fromServer !== undefined) {
    return session.profileName === null
      ? say('common.someoneFromName', { name: session.fromServer })
      : say('common.nameFromServer', { name: session.profileName, server: session.fromServer });
  }

  return session.isGuest
    ? describeGuest(session.guestOf)
    : (session.profileName ?? say('screens.admin.nameOfSession.unknownViewer'));
};

export { nameOfSession };
