import NetInfo from '@react-native-community/netinfo';
import type { Reachability } from '@ValenceClient/platform/Platform.types';

/**
 * Whether this television thinks it can reach anything at all.
 *
 * The system reports whether there is a network, not whether Valence answers on it. A home server
 * that is off while the television is on the network reads as reachable here, and should: the request
 * that follows fails and says so properly.
 *
 * It starts as reachable. A television is on a wired or home network far more often than not, and
 * guessing the other way would hide the library from somebody whose connection is fine.
 *
 * @returns What this television can say about the network.
 */
const theTvsReach = (): Reachability => {
  let isReachable = true;

  NetInfo.addEventListener((state) => {
    isReachable = state.isConnected ?? true;
  });

  return {
    isReachable: () => isReachable,
    whenChanged: (listener) =>
      NetInfo.addEventListener((state) => {
        listener(state.isConnected ?? true);
      }),
  };
};

export { theTvsReach };
