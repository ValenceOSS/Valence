import { queryOptions } from '@tanstack/react-query';
import { fetchProfiles } from '@ValenceClient/profiles/fetchProfiles';
import { fetchEveryone } from '@ValenceClient/profiles/fetchEveryone';
import { fetchProfileList } from '@ValenceClient/profiles/fetchProfileList';
import { fetchProfileLibraries } from '@ValenceClient/profiles/fetchProfileLibraries';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

const PROFILES = ['profiles'] as const;

/**
 * The faces on this account, which is what the picker draws and what the settings edit.
 *
 * @returns The query.
 */
const all = () =>
  queryOptions({
    queryKey: [...PROFILES, 'all'],
    queryFn: () => fetchProfiles(),
  });

/**
 * The profiles on an account and which one this device chose, the signed-in account's own unless an
 * administrator names another.
 *
 * @param accountId - Whose account, where an administrator is looking at somebody else's.
 * @returns The query.
 */
const list = (accountId?: string) =>
  queryOptions({
    queryKey: [...PROFILES, 'list', accountId ?? 'mine'],
    queryFn: () => fetchProfileList(accountId),
  });

/**
 * The profile currently watching on this device, as the server holds it: whichever this device
 * chose, or nobody until it has.
 *
 * @returns The query.
 */
const watching = () =>
  queryOptions({
    queryKey: [...PROFILES, 'watching'],
    queryFn: async (): Promise<ViewerProfile | null> => {
      const { profiles, chosenProfileId } = await fetchProfileList();

      return profiles.find((profile) => profile.id === chosenProfileId) ?? null;
    },
  });

/**
 * Each library a profile's account reaches, and what the profile is held to in it.
 *
 * @param profileId - The profile.
 * @param accountId - Whose account, where an administrator is looking at somebody else's.
 * @returns The query.
 */
const libraries = (profileId: string, accountId?: string) =>
  queryOptions({
    queryKey: [...PROFILES, 'libraries', profileId, accountId ?? 'mine'],
    queryFn: () => fetchProfileLibraries(profileId, accountId),
  });

/**
 * Every face on this server rather than only the ones on this account, which is what an operator
 * choosing whose viewing to be told about is picking from.
 *
 * @returns The query.
 */
const everyone = () =>
  queryOptions({
    queryKey: [...PROFILES, 'everyone'],
    queryFn: () => fetchEveryone(),
  });

const profileQueries = { all, list, watching, libraries, everyone, key: PROFILES };

export { profileQueries };
