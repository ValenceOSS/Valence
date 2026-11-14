import { showKeyOf } from '@ValenceServer/jellyfin/showKeyOf';
import { syntheticJellyfinId } from '@ValenceServer/jellyfin/syntheticJellyfinId';

/**
 * The Jellyfin identifier of a programme, which is the same every time it is worked out.
 *
 * @param libraryId - The library it is in.
 * @param showId - The programme, as Valence identifies it.
 * @returns Thirty-two hexadecimal digits.
 */
const showJellyfinId = (libraryId: string, showId: string): string =>
  syntheticJellyfinId('show', showKeyOf(libraryId, showId));

export { showJellyfinId };
