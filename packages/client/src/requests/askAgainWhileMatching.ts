import type { MissingAlbums } from '@ValenceContracts/schemas/MissingAlbums';

const WHILE_MATCHING_MS = 1500;

/**
 * How soon to ask again how the search for a playlist's missing albums is going: every moment and
 * a half until the server says it is done, and then not at all.
 *
 * @param albums - What the server last said, or nothing before it has said anything.
 * @returns How long to wait, or false to stop asking.
 */
const askAgainWhileMatching = (albums: MissingAlbums | undefined): number | false =>
  albums?.isMatching === false ? false : WHILE_MATCHING_MS;

export { askAgainWhileMatching };
