import type { Reachability } from '@ValenceClient/platform/Platform.types';

/**
 * Whether Valence is answering, according to the host every request to it passes through.
 *
 * @returns What this client can say about the server.
 */
const theDesktopsReach = (): Reachability => {
  const { reach } = window.valence;

  return {
    isReachable: () => reach.now(),
    whenChanged: (listener) => reach.whenChanged(listener),
  };
};

export { theDesktopsReach };
