import { ADMINISTRATOR } from '@ValenceContracts/schemas/Permission';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { Acting } from '@ValenceServer/profiles/acting/Acting';
import { unlockHolderOf } from '@ValenceServer/locks/unlockHolderOf';

type ReadsViewers = {
  acting: (headers: Headers) => Promise<Acting | null>;
  grants: (headers: Headers) => Promise<ReadonlySet<GrantedPermission>>;
  lockedLibraries?: (headers: Headers, holder: string) => Promise<readonly string[]>;
};

const answered = new WeakMap<Headers, Promise<Viewer | null>>();

/**
 * Works out who a request is for, once, as both the account it belongs to and the profile acting
 * for it.
 *
 * The two are different questions and this feature needs both. What an account may *see* is
 * enforcement an administrator set and the viewer cannot lift; what a profile may see is the
 * account's owner narrowing it further; what a person has *hidden* is their own preference.
 * Resolving them together means the split is decided in one place rather than in every handler
 * that has an opinion about it.
 *
 * The profile is the one the session chose, never one a client names, so a request cannot speak
 * for another profile on its account. Only the owner profile of an administrator's account sees
 * past every limit.
 *
 * Deduped on the request's headers, as sessions are, since one request asks several times.
 *
 * @param reads - Who is acting, what they may do, and which libraries are locked.
 * @param headers - The request's headers, which also serve as the key for the request.
 * @returns Who the request is for, or nothing where nobody is signed in.
 */
const readViewer = (reads: ReadsViewers, headers: Headers): Promise<Viewer | null> => {
  const asked = answered.get(headers);

  if (asked !== undefined) {
    return asked;
  }

  const answering = (async (): Promise<Viewer | null> => {
    const acting = await reads.acting(headers);

    if (acting === null) {
      return null;
    }

    const held = await reads.grants(headers);
    const locked =
      (await reads.lockedLibraries?.(
        headers,
        unlockHolderOf({ accountId: acting.account.id, profileId: acting.profile?.id ?? null }),
      )) ?? [];

    return {
      kind: 'account',
      accountId: acting.account.id,
      profileId: acting.profile?.id ?? null,
      isAdministrator: held.has(ADMINISTRATOR),
      ...(locked.length === 0 ? {} : { lockedLibraries: locked }),
    };
  })();

  answered.set(headers, answering);

  return answering;
};

export type { ReadsViewers };

export { readViewer };
