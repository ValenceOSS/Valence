import { platformInUse } from '@ValenceClient/platform/installPlatform';

const WHOLE = /^[a-z][a-z0-9+.-]*:/iu;

/**
 * Turns a path on this Valence into an address the system can fetch.
 *
 * The fetch this client installed resolves paths already, but an image is fetched by the system
 * rather than by us and never passes through it. So anything handed to an `Image` has to be whole,
 * and this is where that happens rather than at each place that draws one.
 *
 * An address that is already whole is left as it is, which is what a file this phone keeps is: the
 * thumbnails of a download are on the phone, not on the server.
 *
 * @param path - The path, as the contract or a route gives it, or an address already whole.
 * @returns The whole address.
 */
const onThisServer = (path: string): string =>
  WHOLE.test(path) ? path : `${platformInUse().serverAddress() ?? ''}${path}`;

export { onThisServer };
