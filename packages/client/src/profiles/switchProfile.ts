import type { QueryClient } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { forgetChosenProfile } from './forgetChosenProfile';
import { forgetChosenThisLaunch } from './forgetChosenThisLaunch';

/**
 * Lets go of who is watching on this device, so the app asks again — with a PIN, for a profile that
 * has one — as it does when it starts.
 *
 * @param cache - The queries to tell.
 */
const switchProfile = async (cache: QueryClient): Promise<void> => {
  forgetChosenThisLaunch();
  await forgetChosenProfile();
  await cache.invalidateQueries({ queryKey: profileQueries.key });
};

export { switchProfile };
