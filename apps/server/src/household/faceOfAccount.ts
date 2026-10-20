import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { householdNameOf } from './householdNameOf';
import type { Household } from '@ValenceContracts/schemas/Household';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { StoredHousehold } from './StoredHousehold';

const [DEFAULT_COLOUR] = PROFILE_COLOURS;

/**
 * What an account looks like to everybody else: its owner profile, where it holds one person, and
 * otherwise whatever it chose for itself with its owner profile standing in for anything it did not.
 *
 * @param account - The account's own name, what it chose for itself, and its profiles, owner first.
 * @param account.name - The account's name, for an account with no profile yet.
 * @param account.stored - What the account chose for itself.
 * @param account.profiles - Its profiles.
 * @returns The face to show.
 */
const faceOfAccount = (account: {
  name: string;
  stored: StoredHousehold;
  profiles: readonly ViewerProfile[];
}): Household => {
  const { stored, profiles } = account;
  const owner = profiles.find((profile) => profile.isOwner) ?? profiles[0];
  const name = householdNameOf({ name: account.name, household: stored.name, profiles });

  if (owner === undefined) {
    return {
      name,
      colour: stored.colour ?? DEFAULT_COLOUR,
      avatar: stored.avatar ?? { kind: 'initial', font: 'gilroy' },
      updatedAt: stored.updatedAt,
      hasOwnName: stored.name !== null,
      hasOwnPicture: stored.avatar !== null,
    };
  }

  if (profiles.length === 1) {
    return {
      name,
      colour: owner.colour,
      avatar: owner.avatar,
      updatedAt: owner.updatedAt,
      hasOwnName: false,
      hasOwnPicture: false,
    };
  }

  return {
    name,
    colour: stored.colour ?? owner.colour,
    avatar: stored.avatar ?? owner.avatar,
    updatedAt: stored.updatedAt > owner.updatedAt ? stored.updatedAt : owner.updatedAt,
    hasOwnName: stored.name !== null,
    hasOwnPicture: stored.avatar !== null,
  };
};

export { faceOfAccount };
