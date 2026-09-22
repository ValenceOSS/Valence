import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import type { Reachability } from '@ValenceClient/platform/Platform.types';

/**
 * Whether this phone is on a network it could reach its Valence over.
 *
 * What a phone can answer is whether it has a connection, not whether the server at the other end
 * is up — a self-hosted Valence on somebody's home network is unreachable from a train regardless
 * of how good the signal is. So this is the weaker claim, honestly made: it goes false when the
 * phone drops off the network, which is the case worth reacting to, and stays true otherwise and
 * lets a failed request speak for itself.
 *
 * Held rather than asked, because the question is asynchronous and the application asks it while
 * drawing. It starts optimistic: a phone that has not answered yet is treated as connected, since
 * refusing to try is worse than trying and failing.
 *
 * @returns What this phone can say about the network.
 */
const thePhonesReach = (): Reachability => {
  let isReachable = true;

  void getNetworkStateAsync()
    .then((state) => {
      isReachable = state.isInternetReachable ?? state.isConnected ?? true;
    })
    .catch(() => undefined);

  return {
    isReachable: () => isReachable,
    whenChanged: (listener) => {
      const watching = addNetworkStateListener((state) => {
        isReachable = state.isInternetReachable ?? state.isConnected ?? true;
        listener(isReachable);
      });

      return () => {
        watching.remove();
      };
    },
  };
};

export { thePhonesReach };
