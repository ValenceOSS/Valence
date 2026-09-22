import { onThisServer } from '@ValencePhone/platform/onThisServer';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Where to read a title's poster from, or nothing where it has none.
 *
 * Asked of what the item says it has rather than tried and allowed to fail, because a phone drawing
 * a broken image for every title without artwork looks like the library is broken rather than the
 * artwork being missing.
 *
 * @param media - The title being drawn.
 * @returns The address, or nothing.
 */
const theArtworkFor = (media: MediaSummary): string | null =>
  media.hasPoster ? onThisServer(`/api/media/${media.id}/image/poster`) : null;

export { theArtworkFor };
