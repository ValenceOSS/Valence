import { chosenOffline } from '@ValenceClient/offline/chosenOffline';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * Whether this client is offline at this moment, asked of the platform and the stored choice
 * rather than of anything rendered, for a moment when what is rendered may not have caught up.
 *
 * @returns Whether it is offline.
 */
const isOfflineNow = (): boolean => {
  const platform = platformInUse();

  return platform.canKeepFiles() && (chosenOffline() || !platform.reachability.isReachable());
};

export { isOfflineNow };
