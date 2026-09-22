import { profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Where to read somebody's picture from.
 *
 * The address the contract builds is a path, which a page would resolve against the server that
 * served it. An image on a phone is fetched by the system rather than by us, so it never passes
 * through the fetch this client taught to resolve paths, and has to be given the whole address.
 *
 * @param profile - Whose picture to read.
 * @returns The address to load it from.
 */
const thePictureFor = (profile: ViewerProfile): string =>
  `${platformInUse().serverAddress() ?? ''}${profileAvatarUrl(profile)}`;

export { thePictureFor };
