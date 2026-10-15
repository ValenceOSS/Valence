import { getRealtimeClient } from './getRealtimeClient';

/**
 * Opens the connection to the server afresh, so it is held for whoever is watching now: the server
 * reads the profile a connection speaks for once, when it opens.
 */
const reconnectRealtimeClient = (): void => {
  getRealtimeClient().restart();
};

export { reconnectRealtimeClient };
