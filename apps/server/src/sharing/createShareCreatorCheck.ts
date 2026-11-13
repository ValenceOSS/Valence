import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type ShareCreatorCheckOptions = {
  isBanned: (accountId: string) => Promise<boolean>;
  permissionsOf: (accountId: string) => Promise<ReadonlySet<GrantedPermission>>;
  isOutOfReach: (viewer: Viewer, mediaId: string) => Promise<boolean>;
};

/**
 * Makes the checks a share link's creator must still pass each time a guest uses it: still allowed
 * to share and not banned, and still able to reach what the guest is asking for, so a link stops
 * working once its creator would no longer be allowed to make it.
 *
 * @param options - How to tell what an account may still do and reach.
 * @returns The two checks.
 */
const createShareCreatorCheck = ({
  isBanned,
  permissionsOf,
  isOutOfReach,
}: ShareCreatorCheckOptions) => ({
  stillShares: async (accountId: string): Promise<boolean> =>
    !(await isBanned(accountId)) && (await permissionsOf(accountId)).has('sharing.link'),

  reaches: async (accountId: string, mediaId: string): Promise<boolean> => {
    const held = await permissionsOf(accountId);
    const viewer: Viewer = {
      kind: 'account',
      accountId,
      profileId: null,
      isAdministrator: held.has('administrator'),
    };

    return !(await isOutOfReach(viewer, mediaId));
  },
});

export { createShareCreatorCheck };
