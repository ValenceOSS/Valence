import { pageOrigin } from '@ValenceTv/platform/pageOrigin';

/**
 * Whether this television can be pointed at a different Valence: a television app can, while a
 * television's browser shown the TV layout belongs to the Valence that served it.
 *
 * @returns Whether to offer a different server.
 */
const canChangeServer = (): boolean => pageOrigin() === null;

export { canChangeServer };
