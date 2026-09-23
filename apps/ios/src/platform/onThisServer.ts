import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * Turns a path on this Valence into an address the system can fetch.
 *
 * The fetch this client installed resolves paths already, but an image is fetched by the system
 * rather than by us and never passes through it. So anything handed to an `Image` has to be whole,
 * and this is where that happens rather than at each place that draws one.
 *
 * @param path - The path, as the contract or a route gives it.
 * @returns The whole address.
 */
const onThisServer = (path: string): string => `${platformInUse().serverAddress() ?? ''}${path}`;

export { onThisServer };
