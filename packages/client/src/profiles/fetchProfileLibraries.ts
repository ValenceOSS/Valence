import { readFromServer } from '@ValenceClient/query/readFromServer';
import { ProfileLibrariesSchema } from '@ValenceContracts/schemas/ProfileLibraries';
import type { ProfileLibrary } from '@ValenceContracts/schemas/ProfileLibraries';
import { profilesAddress } from './profilesAddress';

/**
 * Each library a profile's account reaches, and what the profile is held to in it.
 *
 * @param profileId - The profile.
 * @param accountId - Whose account, where an administrator is looking at somebody else's.
 * @returns The libraries.
 */
const fetchProfileLibraries = async (
  profileId: string,
  accountId?: string,
): Promise<ProfileLibrary[]> =>
  (
    await readFromServer(
      `${profilesAddress(accountId)}/${encodeURIComponent(profileId)}/libraries`,
      ProfileLibrariesSchema,
    )
  ).libraries;

export { fetchProfileLibraries };
