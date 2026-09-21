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
 * Whether a profile is for a library: one naming no library is for all of them, and one naming
 * libraries is only for those.
 *
 * @param profile - The profile.
 * @param libraryId - The library the request would be filed into, or null where none is known.
 * @returns Whether it applies there.
 */
const isForLibrary = (profile: QualityProfile, libraryId: string | null): boolean =>
  profile.libraryIds.length === 0 || libraryId === null || profile.libraryIds.includes(libraryId);

/**
 * The profiles somebody may ask for a kind of media with, and the one they are given no say over.
 *
 * Narrowed to the library the request would be filed into, because a profile written for films says
 * nothing useful about a programme and offering it is offering a wrong answer. A profile that names
 * no library is for every library, which is what makes naming one mean something.
 *
 * Gating on who may choose comes after that, and is on the profile rather than on the asker so that
 * an operator can lock 2160p to a role without having to think about anybody who does not hold it:
 * a profile that names nobody is for the house, and one that names somebody is for them.
 *
 * A profile marked as the default is what every request it applies to goes through, so within what
 * is left it is the only choice and `forcedId` names it. Scoped by library like everything else: a
 * default written for films forces films and leaves programmes alone.
 *
 * @param profiles - Every profile.
 * @param kind - Whether the request is for music or for video.
 * @param asker - Who is asking, as their account and the roles they hold.
 * @param libraryId - The library the request would be filed into, or null where none is known.
 * @returns The profiles to offer, and the one that overrides them.
 */
const profilesOnOffer = (
  profiles: readonly QualityProfile[],
  kind: ProfileKind,
  asker: Asker,
  libraryId: string | null = null,
): OnOffer => {
  const fitting = profiles.filter(
    (profile) => profile.kind === kind && isForLibrary(profile, libraryId),
  );
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

export { isForLibrary, profilesOnOffer };
