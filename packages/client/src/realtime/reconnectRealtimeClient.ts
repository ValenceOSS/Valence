import { getRealtimeClient } from './getRealtimeClient';

/**
 * Opens the connection to the server afresh, so it is held for whoever is watching now: the server
 * reads the profile a connection speaks for once, when it opens. Party messages still waiting for
 * the old connection are dropped rather than sent as the next profile.
 */
const reconnectRealtimeClient = (): void => {
  getRealtimeClient().restart();
};

export { reconnectRealtimeClient };
