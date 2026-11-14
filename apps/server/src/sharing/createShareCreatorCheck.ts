import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type ShareCreatorCheckOptions = {
  isBanned: (accountId: string) => Promise<boolean>;
  permissionsOf: (accountId: string) => Promise<ReadonlySet<GrantedPermission>>;
  isOutOfReach: (viewer: Viewer, mediaId: string) => Promise<boolean>;
  canReachBook: (viewer: Viewer, bookId: string) => Promise<boolean>;
  now?: () => number;
};

const REMEMBERED_FOR_MILLISECONDS = 10_000;

type Standing = { stillShares: boolean; isAdministrator: boolean };

/**
 * Makes the checks a share link's creator must still pass each time a guest uses it: still allowed
 * to share and not banned, and still able to reach what the guest is asking for, so a link stops
 * working once its creator would no longer be allowed to make it.
 *
 * What an account may do is remembered for ten seconds, so a request is not charged for it again.
 *
 * @param options - How to tell what an account may still do and reach.
 * @returns The three checks.
 */
const createShareCreatorCheck = ({
  isBanned,
  permissionsOf,
  isOutOfReach,
  canReachBook,
  now = Date.now,
}: ShareCreatorCheckOptions) => {
  const remembered = new Map<string, { standing: Standing; until: number }>();

  /**
   * What a creator may do, looked up at most once in a few seconds, since a guest streaming makes
   * a request for every segment.
   */
  const standingOf = async (accountId: string): Promise<Standing> => {
    const at = now();
    const known = remembered.get(accountId);

    if (known !== undefined && known.until > at) {
      return known.standing;
    }

    const [banned, held] = await Promise.all([isBanned(accountId), permissionsOf(accountId)]);
    const standing = {
      stillShares: !banned && held.has('sharing.link'),
      isAdministrator: held.has('administrator'),
    };

    for (const [id, entry] of remembered) {
      if (entry.until <= at) {
        remembered.delete(id);
      }
    }

    remembered.set(accountId, { standing, until: at + REMEMBERED_FOR_MILLISECONDS });

    return standing;
  };

  const viewerFor = async (accountId: string): Promise<Viewer> => ({
    kind: 'account',
    accountId,
    profileId: null,
    isAdministrator: (await standingOf(accountId)).isAdministrator,
  });

  return {
    stillShares: async (accountId: string): Promise<boolean> =>
      (await standingOf(accountId)).stillShares,

    reaches: async (accountId: string, mediaId: string): Promise<boolean> =>
      !(await isOutOfReach(await viewerFor(accountId), mediaId)),

    reachesBook: async (accountId: string, bookId: string): Promise<boolean> =>
      canReachBook(await viewerFor(accountId), bookId),
  };
};

export { createShareCreatorCheck };
