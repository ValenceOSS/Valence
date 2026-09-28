import { appleArtworkAt } from './appleArtworkAt';
import { findAppleArtist } from './findAppleArtist';
import type { MusicWeb } from './createMusicWeb';

const PICTURE_EDGE = 1200;

/**
 * Finds an artist's photograph on their public Apple Music page, which needs no key: the picture the
 * page offers to anything that shares it.
 *
 * Only an artist picture is taken. A page without one offers Apple Music's own artwork instead, and
 * that is nobody's face.
 *
 * @param web - The way out to the web.
 * @param name - The artist.
 * @returns Where their photograph is, or nothing where none was found.
 */
const findAppleArtistPictureUrl = async (web: MusicWeb, name: string): Promise<string | null> => {
  const artist = await findAppleArtist(web, name);

  if (artist?.link === null || artist?.link === undefined) {
    return null;
  }

  const page = await web.text(artist.link);
  const shared =
    page === null
      ? null
      : (/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/.exec(page)?.[1] ??
        /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/.exec(page)?.[1] ??
        null);

  return shared === null || !shared.includes('/image/thumb/AMCArtistImages')
    ? null
    : appleArtworkAt(shared, PICTURE_EDGE);
};

export { findAppleArtistPictureUrl };
