import type { QueryClient } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { ASKING_FOR } from './ASKING_FOR';
import { forgetChosenProfile } from './forgetChosenProfile';
import { forgetChosenThisLaunch } from './forgetChosenThisLaunch';
import { launchStore } from './launchStore';

/**
 * Lets go of who is watching on this device, so the app asks again — with a PIN, for a profile that
 * has one — as it does when it starts.
 *
 * @param cache - The queries to tell.
 * @param askingFor - The profile somebody already picked, so the app asks straight away for its
 *   PIN rather than for who is watching.
 */
const switchProfile = async (cache: QueryClient, askingFor?: string): Promise<void> => {
  forgetChosenThisLaunch();

  if (askingFor === undefined) {
    launchStore().forget(ASKING_FOR);
  } else {
    launchStore().write(ASKING_FOR, askingFor);
  }

  await forgetChosenProfile();
  await cache.invalidateQueries({ queryKey: profileQueries.key });
};

export { switchProfile };
