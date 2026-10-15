import { EVERY_PROFILE_MAY } from '@ValenceContracts/constants/EVERY_PROFILE_MAY';
import { REQUESTING_PERMISSIONS } from '@ValenceContracts/constants/REQUESTING_PERMISSIONS';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import type { Acting } from './Acting';

/**
 * Works out what the acting profile may do with what its account holds: everything, for the
 * account's owner; for any other profile, only the everyday things every profile may do, and not
 * requesting where the owner switched that off; and nothing for a session that has not chosen.
 *
 * @param held - What the account may do.
 * @param acting - Who is acting.
 * @returns What the profile may do.
 */
const narrowToProfile = (
  held: ReadonlySet<GrantedPermission>,
  acting: Pick<Acting, 'profile' | 'mustChoose'>,
): ReadonlySet<GrantedPermission> => {
  if (acting.mustChoose) {
    return new Set();
  }

  if (acting.profile === null || acting.profile.isOwner) {
    return held;
  }

  const { mayRequest } = acting.profile;

  return new Set(
    [...held].filter(
      (permission) =>
        EVERY_PROFILE_MAY.has(permission) &&
        (mayRequest || !REQUESTING_PERMISSIONS.has(permission)),
    ),
  );
};

export { narrowToProfile };
