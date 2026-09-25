import { say } from '@ValenceI18n/say';

type NamedViewer = {
  accountName: string | null;
  profileName: string | null;
  guestOf?: string | null;
};

/**
 * Names whoever is at the other end, preferring the profile because that is who picked it, then the
 * account, and then whoever shared the link they came in on — a guest has no account and no profile,
 * and "somebody" is a worse answer than the person who let them in.
 *
 * @param viewer - Who is watching, or has Valence open.
 * @returns What to call them.
 */
const nameOfViewer = (viewer: NamedViewer): string => {
  const host = viewer.guestOf ?? null;

  if (viewer.profileName !== null) {
    return viewer.profileName;
  }

  if (viewer.accountName !== null) {
    return viewer.accountName;
  }

  return host === null
    ? say('server.webhook.shareViewer')
    : say('server.webhook.guestOf', { host });
};

export type { NamedViewer };

export { nameOfViewer };
