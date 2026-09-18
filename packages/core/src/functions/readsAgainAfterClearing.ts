import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';

const READ_WITH_EACH_FILE: ReadonlySet<LibraryPart> = new Set([
  'descriptions',
  'cast',
  'ageRatings',
  'trailers',
  'artwork',
  'albumCovers',
  'artistPictures',
  'lyrics',
]);

/**
 * Whether clearing these parts means every file has to be read again to get them back. What the
 * catalogue says about a film, and what a song's tags hold, is only asked for when its file is read,
 * and an ordinary scan reads only the files that have changed. Logos, music videos, previews, scrub
 * previews and intros are each asked for by work of their own, which an ordinary scan starts.
 *
 * @param parts - What was cleared.
 * @returns Whether the scan that follows has to read every file.
 */
const readsAgainAfterClearing = (parts: readonly LibraryPart[]): boolean =>
  parts.some((part) => READ_WITH_EACH_FILE.has(part));

export { readsAgainAfterClearing };
