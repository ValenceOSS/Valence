import { readFromServer } from '@ValenceClient/query/readFromServer';
import { ViewerProfileListSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { profilesAddress } from './profilesAddress';

/**
 * The profiles on an account, and which of them this device has chosen.
 *
 * @param accountId - Whose account, where an administrator is looking at somebody else's.
 * @returns The profiles, the one chosen where one is, and whether the server is from before
 *   devices chose profiles.
 */
const fetchProfileList = async (accountId?: string) => {
  const list = await readFromServer(profilesAddress(accountId), ViewerProfileListSchema);

  return {
    profiles: list.profiles,
    chosenProfileId: list.chosenProfileId ?? null,
    ...(list.chosenProfileId === undefined ? { predatesChoosing: true } : {}),
  };
};

export { fetchProfileList };
