import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const MOST = 4;

/**
 * The albums whose covers make up the cover of a list of songs: the first four different albums
 * with a cover, in the order their songs come up.
 *
 * @param tracks - The songs, in order.
 * @returns Up to four album ids.
 */
const coverAlbumsOf = (tracks: readonly MusicTrack[]): string[] =>
  [...new Set(tracks.flatMap((track) => (track.album.hasArtwork ? [track.album.id] : [])))].slice(
    0,
    MOST,
  );

export { coverAlbumsOf };
