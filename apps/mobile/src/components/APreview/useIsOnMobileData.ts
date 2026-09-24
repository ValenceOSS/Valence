import { useEffect, useState } from 'react';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import type { NetworkState } from 'expo-network';

const METERED: ReadonlySet<string> = new Set(['CELLULAR']);

/**
 * Whether this phone is on mobile data rather than Wi-Fi or a cable, followed as it changes.
 *
 * @returns Whether it is, which is taken as no until the phone has said.
 */
const useIsOnMobileData = (): boolean => {
  const [isOnMobileData, setIsOnMobileData] = useState(false);

  useEffect(() => {
    let isListening = true;
    const hear = (state: NetworkState) => {
      if (isListening) {
        setIsOnMobileData(METERED.has(state.type ?? ''));
      }
    };

    void getNetworkStateAsync()
      .then(hear)
      .catch(() => undefined);

    const watching = addNetworkStateListener(hear);

    return () => {
      isListening = false;
      watching.remove();
    };
  }, []);

  return isOnMobileData;
};

export { useIsOnMobileData };
