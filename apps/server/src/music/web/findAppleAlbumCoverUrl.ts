import { z } from 'zod';
import { nameKey } from '@ValenceServer/music/nameKey';
import { appleArtworkAt } from './appleArtworkAt';
import { findAppleArtist } from './findAppleArtist';
import { tidyAlbumTitle } from './tidyAlbumTitle';
import type { MusicWeb } from './createMusicWeb';

const COVER_EDGE = 1200;

const AlbumsSchema = z.object({
  results: z
    .array(
      z.object({
        wrapperType: z.string().catch(''),
        collectionName: z.string().catch(''),
        artworkUrl100: z.string().nullable().catch(null),
      }),
    )
    .catch([]),
});

/**
 * An album title reduced to what two catalogues agree on: no year, edition or EP after it, and no
 * " - Single" or " - EP" the way Apple lists them.
 *
 * @param title - The title.
 * @returns What it is matched on.
 */
const matchable = (title: string): string =>
  nameKey(tidyAlbumTitle(title.replace(/\s+-\s+(?:EP|Single)\s*$/i, '')));

/**
 * Finds an album's cover in the iTunes catalogue, which needs no key, for an album MusicBrainz did
 * not know.
 *
 * The artist is found first and only their own albums are looked through, since a search by title
 * alone turns up covers, tributes and karaoke versions by other people; the album is then taken
 * only where its title is the same once years and editions are set aside.
 *
 * @param web - The way out to the web.
 * @param album - What the album is called and who it is by.
 * @returns Where the cover is, or nothing where none was found.
 */
const findAppleAlbumCoverUrl = async (
  web: MusicWeb,
  album: { title: string; artistName: string },
): Promise<string | null> => {
  const artist = await findAppleArtist(web, album.artistName);

  if (artist === null) {
    return null;
  }

  const listed = AlbumsSchema.safeParse(
    await web.json(
      `https://itunes.apple.com/lookup?id=${artist.id.toString()}&entity=album&limit=200`,
    ),
  );
  const wanted = matchable(album.title);
  const found = listed.success
    ? listed.data.results.find(
        (one) =>
          one.wrapperType === 'collection' &&
          one.artworkUrl100 !== null &&
          matchable(one.collectionName) === wanted,
      )
    : undefined;

  return found?.artworkUrl100 === undefined || found.artworkUrl100 === null
    ? null
    : appleArtworkAt(found.artworkUrl100, COVER_EDGE);
};

export { findAppleAlbumCoverUrl };
