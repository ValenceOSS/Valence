import type { RealtimeClient } from './createRealtimeClient';

const dormant: RealtimeClient = {
  start: () => {},
  stop: () => {},
  subscribe: () => () => {},
  identify: () => {},
  onResumed: () => () => {},
  isLive: () => false,
  connectionId: () => null,
  sendParty: () => {},
  askClock: () => {},
  onClockTell: () => () => {},
  onRefused: () => () => {},
  onNeedsPassword: () => () => {},
};

/**
 * A socket that never opens, for a hook that needs a client to point at before there is anybody to
 * open one for.
 *
 * `getRealtimeClient` starts the shared socket the moment it is asked for one — which is right once
 * somebody is signed in, and wrong before, since a connection opened with no session behind it is
 * refused. A hook that always wants a client to construct with cannot simply skip calling it, so
 * this stands in for the real one until there is a session to open it for: every subscription
 * succeeds and calls nothing, because nothing ever happens on a socket that was never opened.
 *
 * The one instance is shared rather than built fresh on every call, because a hook that reads it as
 * a dependency would otherwise see a new object each render and tear down and rebuild around it
 * forever — the same reason the real socket is shared rather than opened again for every caller.
 *
 * @returns The one dormant client, shared by everything that asks for it.
 */
const aDormantRealtimeClient = (): RealtimeClient => dormant;

export { aDormantRealtimeClient };
