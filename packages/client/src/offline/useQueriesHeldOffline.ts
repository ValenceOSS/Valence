import { useEffect } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { useOfflineMode } from '@ValenceClient/offline/useOfflineMode';

/**
 * Holds every query and change meant for the server while this client is offline, whether it was
 * asked to be or the server stopped answering, and lets them go when it is back.
 *
 * Whatever else says the network is up — the browser, or the phone's own connection — is overruled
 * while offline, since a working network is not a server somebody has chosen to leave alone.
 */
const useQueriesHeldOffline = (): void => {
  const { isOffline } = useOfflineMode();

  useEffect(() => {
    if (!isOffline) {
      return undefined;
    }

    onlineManager.setOnline(false);

    const stop = onlineManager.subscribe((isOnline) => {
      if (isOnline) {
        onlineManager.setOnline(false);
      }
    });

    return () => {
      stop();
      onlineManager.setOnline(true);
    };
  }, [isOffline]);
};

export { useQueriesHeldOffline };
