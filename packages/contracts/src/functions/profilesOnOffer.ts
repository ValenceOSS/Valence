import type { ProfileKind, QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

type Asker = {
  accountId: string;
  roleIds: readonly string[];
};

type OnOffer = {
  choices: QualityProfile[];
  forcedId: string | null;
};

/**
 * Whether somebody may choose a profile: anybody may choose one that names no roles and no
 * accounts, and otherwise only those it names.
 *
 * @param profile - The profile.
 * @param asker - Who is asking.
 * @returns Whether it is theirs to choose.
 */
const isTheirs = (profile: QualityProfile, asker: Asker): boolean =>
  (profile.roleIds.length === 0 && profile.accountIds.length === 0) ||
  profile.accountIds.includes(asker.accountId) ||
  profile.roleIds.some((roleId) => asker.roleIds.includes(roleId));

/**
 * The profiles somebody may ask for a kind of media with, and the one they are given no say over.
 *
 * A profile marked as the default is what every request of its kind goes through, so it is the only
 * choice and `forcedId` names it. Where none is marked, the choices are those the asker's roles or
 * their own account are named on, plus every profile that names nobody at all.
 *
 * Gating is on the profiles rather than on the asker so that an operator can lock 2160p to a role
 * without having to think about anybody who does not hold it: a profile that names nobody is for
 * the house, and one that names somebody is for them.
 *
 * @param profiles - Every profile.
 * @param kind - Whether the request is for music or for video.
 * @param asker - Who is asking, as their account and the roles they hold.
 * @returns The profiles to offer, and the one that overrides them.
 */
const profilesOnOffer = (
  profiles: readonly QualityProfile[],
  kind: ProfileKind,
  asker: Asker,
): OnOffer => {
  const fitting = profiles.filter((profile) => profile.kind === kind);
  const forced = fitting.find((profile) => profile.isDefault);

  if (forced !== undefined) {
    return { choices: [forced], forcedId: forced.id };
  }

  return {
    choices: fitting.filter((profile) => isTheirs(profile, asker)),
    forcedId: null,
  };
};

export type { Asker, OnOffer };

export { profilesOnOffer };
