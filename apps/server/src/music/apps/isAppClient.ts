import { APP_CLIENT_PREFIX } from './APP_CLIENT_PREFIX';

/**
 * Whether a device is an app outside Valence, shown while it plays, which can't be controlled and
 * never says how far into a song it is.
 *
 * @param clientId - The device's client id.
 * @returns Whether it is such an app.
 */
const isAppClient = (clientId: string): boolean => clientId.startsWith(APP_CLIENT_PREFIX);

export { isAppClient };
