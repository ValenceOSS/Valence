import { say } from '@ValenceI18n/say';

/**
 * Names somebody as a profile from its household, or by one name alone where the two are the same
 * or only one is known.
 *
 * @param who - The profile's name and the household's, where known.
 * @param who.profileName - The profile's name.
 * @param who.household - The household's name.
 * @returns What to call them.
 */
const nameOfAsker = (who: {
  profileName: string | null | undefined;
  household: string | null;
}): string => {
  if (who.profileName === null || who.profileName === undefined) {
    return who.household ?? '';
  }

  return who.household === null || who.household === who.profileName
    ? who.profileName
    : say('common.profileFromHousehold', {
        profile: who.profileName,
        household: who.household,
      });
};

export { nameOfAsker };
