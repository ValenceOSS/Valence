import type { PlaylistMissingEntry } from '@ValenceContracts/schemas/Playlist';
import type { GroupedAlbum } from '@ValenceServer/requests/missingAlbums/GroupedAlbum';

/**
 * The albums a playlist's missing songs are on, each once however many of its songs are missing,
 * in the order the first of them comes: by the release a song was named on where the service said,
 * and otherwise by its artist and its album, or its own title where no album was named.
 *
 * @param songs - The missing songs, in their order.
 * @returns Each album, by its first song, and how many songs it has there.
 */
const albumsOfMissingSongs = (songs: readonly PlaylistMissingEntry[]): GroupedAlbum[] => {
  const albums = new Map<string, GroupedAlbum>();

  for (const song of songs) {
    const key =
      song.releaseId ??
      `${song.artist.toLowerCase()}\u0000${(song.album ?? song.title).toLowerCase()}`;
    const kept = albums.get(key);

    albums.set(
      key,
      kept === undefined ? { key, song, songCount: 1 } : { ...kept, songCount: kept.songCount + 1 },
    );
  }

  return [...albums.values()];
};

export { albumsOfMissingSongs };
