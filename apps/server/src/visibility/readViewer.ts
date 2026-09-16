import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { ResolvesSessions } from '@ValenceServer/auth/readSessionOnce';
import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const PROFILE_HEADER = 'x-valence-profile';

type NamesProfiles = {
  belongsTo: (userId: string, profileId: string) => Promise<boolean>;
  ensureDefault: (userId: string, name: string) => Promise<{ id: string }>;
};

type ResolvesPermissions = {
  resolve: (userId: string) => Promise<ReadonlySet<Permission>>;
};

type ReadsViewers = {
  auth: ResolvesSessions;
  permissions: ResolvesPermissions;
  profiles?: NamesProfiles;
};

const answered = new WeakMap<Headers, Promise<Viewer | null>>();

/**
 * Works out who a request is for, once, as both the account it belongs to and the person watching.
 *
 * The two are different questions and this feature needs both. What an account may *see* is
 * enforcement an administrator set and the viewer cannot lift; what a person has *hidden* is their
 * own preference. Resolving them together means the split is decided in one place rather than in
 * every handler that has an opinion about it.
 *
 * The profile arrives in a header and is checked against the session before it is believed, so a
 * client cannot name somebody else's. A header naming nobody, or naming a profile on another
 * account, falls back to the account's own default rather than refusing — which is what the rest of
 * the server already does, and changing it here would quietly break every client that has never
 * sent one.
 *
 * Answers with no profile at all where the server runs without profiles, rather than with nobody.
 * An account with no faces can still watch; it simply has nothing hidden.
 *
 * Deduped on the request's headers, as sessions are, since one request asks several times.
 *
 * @param reads - The session, permission and profile services to ask.
 * @param headers - The request's headers, which also serve as the key for the request.
 * @returns Who the request is for, or nothing where nobody is signed in.
 */
const readViewer = (reads: ReadsViewers, headers: Headers): Promise<Viewer | null> => {
  const asked = answered.get(headers);

  if (asked !== undefined) {
    return asked;
  }

  const answering = (async (): Promise<Viewer | null> => {
    const session = await readSessionOnce(reads.auth, headers);
    const account = session?.user;

    if (account === undefined) {
      return null;
    }

    const held = await reads.permissions.resolve(account.id);

    return {
      kind: 'account',
      accountId: account.id,
      profileId: await readProfileFor(reads, headers, account),
      isAdministrator: held.has(ADMINISTRATOR),
    };
  })();

  answered.set(headers, answering);

  return answering;
};

/**
 * Which face on this account the request is for, believing the header only once it has been checked.
 *
 * @param reads - The profile service to ask, where there is one.
 * @param headers - The request's headers.
 * @param account - Whose account it is.
 * @returns The profile watching, or nothing where the server keeps none.
 */
const readProfileFor = async (
  reads: ReadsViewers,
  headers: Headers,
  account: { id: string; name: string },
): Promise<string | null> => {
  const { profiles } = reads;

  if (profiles === undefined) {
    return null;
  }

  const named = headers.get(PROFILE_HEADER);

  if (named !== null && (await profiles.belongsTo(account.id, named))) {
    return named;
  }

  return (await profiles.ensureDefault(account.id, account.name)).id;
};

export type { NamesProfiles, ReadsViewers, ResolvesPermissions };

export { PROFILE_HEADER, readViewer };
