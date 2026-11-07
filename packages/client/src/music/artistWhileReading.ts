import { musicQueries } from '@ValenceClient/query/musicQueries';
import type { QueryClient } from '@tanstack/react-query';
import type { MusicArtistDetail } from '@ValenceContracts/schemas/Music';

/**
 * What is already known about an artist from the lists read so far, to draw their page with until
 * the whole of it arrives: who they are, and their albums among those already read.
 *
 * @param cache - The cache the lists are in.
 * @param artistId - The artist.
 * @returns The start of their page, or nothing where they have not been seen in a list.
 */
const artistWhileReading = (
  cache: QueryClient,
  artistId: string,
): MusicArtistDetail | undefined => {
  const artist = [
    ...(cache.getQueryData(musicQueries.artists().queryKey) ?? []),
    ...(cache.getQueryData(musicQueries.artists(true).queryKey) ?? []),
  ].find(({ id }) => id === artistId);

  if (artist === undefined) {
    return undefined;
  }

  const albums = (cache.getQueryData(musicQueries.albums('recent').queryKey) ?? []).filter(
    (album) => album.artist.id === artistId,
  );

  return { artist, albums, appearsOn: [], popular: [] };
};

export { artistWhileReading };
