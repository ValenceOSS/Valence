import { appleArtworkAt } from './appleArtworkAt';
import { findAppleAlbum } from './findAppleAlbum';
import type { MusicWeb } from './createMusicWeb';

const COVER_EDGE = 1200;

/**
 * Finds an album's cover in the iTunes catalogue, which needs no key, for an album MusicBrainz did
 * not know.
 *
 * The album is only taken where it is the artist's own, under the same title; see
 * `findAppleAlbum`.
 *
 * @param web - The way out to the web.
 * @param album - What the album is called and who it is by.
 * @returns Where the cover is, or nothing where none was found.
 */
const findAppleAlbumCoverUrl = async (
  web: MusicWeb,
  album: { title: string; artistName: string },
): Promise<string | null> => {
  const found = await findAppleAlbum(web, album);

  return found?.artworkUrl === undefined || found.artworkUrl === null
    ? null
    : appleArtworkAt(found.artworkUrl, COVER_EDGE);
};

export { findAppleAlbumCoverUrl };
