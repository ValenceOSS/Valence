import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Says in a few words who asks with a profile: everybody with no say in it, anybody who may ask, or
 * however many roles and people are named on it.
 *
 * @param profile - The profile.
 * @returns Who asks with it.
 */
const describeAskers = (profile: QualityProfile): string => {
  if (profile.isDefault) {
    return say('admin.describeAskers.everything');
  }

  const roles = sayCount('admin.describeAskers.roles', profile.roleIds.length);
  const people = sayCount('admin.describeAskers.people', profile.accountIds.length);

  if (profile.roleIds.length > 0 && profile.accountIds.length > 0) {
    return say('admin.describeAskers.rolesAndPeople', { roles, people });
  }

  if (profile.roleIds.length > 0) {
    return roles;
  }

  return profile.accountIds.length > 0 ? people : say('admin.describeAskers.anybody');
};

export { describeAskers };
