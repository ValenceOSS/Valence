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
    return 'Everything, with no choice';
  }

  const counted = [
    { many: profile.roleIds.length, one: 'role', more: 'roles' },
    { many: profile.accountIds.length, one: 'person', more: 'people' },
  ]
    .filter(({ many }) => many > 0)
    .map(({ many, one, more }) => `${many} ${many === 1 ? one : more}`);

  return counted.length === 0 ? 'Anybody who may ask' : counted.join(' and ');
};

export { describeAskers };
