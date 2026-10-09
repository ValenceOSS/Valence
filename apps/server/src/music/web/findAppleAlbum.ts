import { z } from 'zod';
import { nameKey } from '@ValenceServer/music/nameKey';
import { findAppleArtist } from './findAppleArtist';
import { tidyAlbumTitle } from './tidyAlbumTitle';
import type { MusicWeb } from './createMusicWeb';

const AlbumsSchema = z.object({
  results: z
    .array(
      z.object({
        wrapperType: z.string().catch(''),
        collectionId: z.number().int().catch(0),
        collectionName: z.string().catch(''),
        collectionViewUrl: z.string().nullable().catch(null),
        artworkUrl100: z.string().nullable().catch(null),
        primaryGenreName: z.string().nullable().catch(null),
        copyright: z.string().nullable().catch(null),
      }),
    )
    .catch([]),
});

type AppleAlbum = {
  id: number;
  link: string | null;
  artworkUrl: string | null;
  genre: string | null;
  copyright: string | null;
};

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
 * Finds an album in the iTunes catalogue, which needs no key.
 *
 * The artist is found first and only their own albums are looked through, since a search by title
 * alone turns up covers, tributes and karaoke versions by other people; the album is then taken
 * only where its title is the same once years and editions are set aside, and one with a cover
 * before one without.
 *
 * @param web - The way out to the web.
 * @param album - What the album is called and who it is by.
 * @returns Its catalogue id, its Apple Music page, its cover, genre and copyright line, or nothing
 *   where it was not found.
 */
const findAppleAlbum = async (
  web: MusicWeb,
  album: { title: string; artistName: string },
): Promise<AppleAlbum | null> => {
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
  const matches = listed.success
    ? listed.data.results.filter(
        (one) => one.wrapperType === 'collection' && matchable(one.collectionName) === wanted,
      )
    : [];
  const found = matches.find((one) => one.artworkUrl100 !== null) ?? matches.at(0);

  return found === undefined
    ? null
    : {
        id: found.collectionId,
        link: found.collectionViewUrl,
        artworkUrl: found.artworkUrl100,
        genre: found.primaryGenreName,
        copyright: found.copyright,
      };
};

export type { AppleAlbum };

export { findAppleAlbum };
