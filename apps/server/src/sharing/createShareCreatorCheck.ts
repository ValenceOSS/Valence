import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type ShareCreatorCheckOptions = {
  isBanned: (accountId: string) => Promise<boolean>;
  permissionsOf: (accountId: string) => Promise<ReadonlySet<GrantedPermission>>;
  isOutOfReach: (viewer: Viewer, mediaId: string) => Promise<boolean>;
  canReachBook: (viewer: Viewer, bookId: string) => Promise<boolean>;
};

/**
 * Makes the checks a share link's creator must still pass each time a guest uses it: still allowed
 * to share and not banned, and still able to reach what the guest is asking for, so a link stops
 * working once its creator would no longer be allowed to make it.
 *
 * @param options - How to tell what an account may still do and reach.
 * @returns The three checks.
 */
const createShareCreatorCheck = ({
  isBanned,
  permissionsOf,
  isOutOfReach,
  canReachBook,
}: ShareCreatorCheckOptions) => {
  const viewerFor = async (accountId: string): Promise<Viewer> => {
    const held = await permissionsOf(accountId);

    return {
      kind: 'account',
      accountId,
      profileId: null,
      isAdministrator: held.has('administrator'),
    };
  };

  return {
    stillShares: async (accountId: string): Promise<boolean> =>
      !(await isBanned(accountId)) && (await permissionsOf(accountId)).has('sharing.link'),

    reaches: async (accountId: string, mediaId: string): Promise<boolean> =>
      !(await isOutOfReach(await viewerFor(accountId), mediaId)),

    reachesBook: async (accountId: string, bookId: string): Promise<boolean> =>
      canReachBook(await viewerFor(accountId), bookId),
  };
};

export { createShareCreatorCheck };
