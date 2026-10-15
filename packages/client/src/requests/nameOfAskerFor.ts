import { nameOfAsker } from '@ValenceContracts/functions/nameOfAsker';
import type { Me } from '@ValenceContracts/functions/isMyAsk';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * What to call somebody who asked, to the person looking: a profile on their own account by its
 * name alone, and anybody else's as the profile from its household.
 *
 * @param asker - Who asked.
 * @param me - Who is looking, where anybody is.
 * @returns What to call them.
 */
const nameOfAskerFor = (asker: Requester, me: Me | null): string => {
  const profileName = asker.askingProfile?.name ?? null;

  return profileName !== null && me !== null && asker.id === me.accountId
    ? profileName
    : nameOfAsker({ profileName, household: asker.name });
};

export { nameOfAskerFor };
