import type { QueryClient } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { chooseProfile } from './chooseProfile';
import { switchProfile } from './switchProfile';

/**
 * Moves this device to another profile on the account: at once where it has no PIN, and otherwise
 * by asking for that profile's PIN, as the app does when it starts.
 *
 * @param cache - The queries to tell.
 * @param profile - Who is watching now.
 */
const switchToProfile = async (cache: QueryClient, profile: ViewerProfile): Promise<void> => {
  if (profile.hasPin) {
    await switchProfile(cache, profile.id);

    return;
  }

  const choice = await chooseProfile(profile.id);

  if (choice.kind === 'chosen') {
    await cache.invalidateQueries({ queryKey: profileQueries.key });

    return;
  }

  await switchProfile(cache, profile.id);
};

export { switchToProfile };
