import type { MusicService } from '@ValenceServer/music/MusicService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

/**
 * Where an artist's picture is, or, for an artist with none of their own, the cover of the album
 * Valence pictures them by, as its own music pages do.
 *
 * @param library - The music service.
 * @param viewer - Who is looking.
 * @param artistId - The artist.
 * @returns The picture's path, or nothing where there is neither.
 */
const artistPictureOf = async (
  library: Pick<MusicService, 'readArtistImage' | 'readArtist' | 'readAlbumArtwork'>,
  viewer: Viewer,
  artistId: string,
): Promise<string | null> => {
  const own = await library.readArtistImage(viewer, artistId);

  if (own !== null) {
    return own;
  }

  const albumId = (await library.readArtist(viewer, artistId))?.artist.imageAlbumId ?? null;

  return albumId === null ? null : library.readAlbumArtwork(viewer, albumId);
};

export { artistPictureOf };
