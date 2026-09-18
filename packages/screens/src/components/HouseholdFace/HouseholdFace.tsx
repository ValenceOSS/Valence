import { accountAvatarUrl, householdAvatarUrl } from '@ValenceContracts/schemas/Household';
import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import type { HouseholdFaceProps } from './HouseholdFace.types';

/**
 * Draws what a household looks like — its picture, its drawn avatar, or its initial.
 *
 * @param household - Whose face to draw.
 * @param accountId - Whose household it is, where somebody is looking at another account's.
 * @param pending - A picture being uploaded, drawn in place of the stored one.
 * @param className - Extra classes for the caller's own layout.
 */
const HouseholdFace = ({ household, accountId, pending = null, className }: HouseholdFaceProps) => (
  <FaceCircle
    name={household.name}
    colour={household.colour}
    avatar={household.avatar}
    source={
      accountId === undefined
        ? householdAvatarUrl(household)
        : accountAvatarUrl(accountId, household)
    }
    pending={pending}
    {...(className === undefined ? {} : { className })}
  />
);

HouseholdFace.displayName = 'HouseholdFace';

export { HouseholdFace };
