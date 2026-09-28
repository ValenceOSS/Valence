import { z } from 'zod';
import { nameKey } from '@ValenceServer/music/nameKey';
import type { MusicWeb } from './createMusicWeb';

const ArtistsSchema = z.object({
  data: z
    .array(
      z.object({
        name: z.string().catch(''),
        picture_xl: z.string().nullable().catch(null),
      }),
    )
    .catch([]),
});

/**
 * Finds an artist's photograph on Deezer, which needs no key and answers far faster than Apple's
 * catalogue lets itself be asked.
 *
 * The artist is only taken where the name found is the name asked for, and only where Deezer has a
 * photograph of them rather than its own blank stand-in.
 *
 * @param web - The way out to the web.
 * @param name - The artist.
 * @returns Where their photograph is, or nothing where none was found.
 */
const findDeezerArtistPictureUrl = async (web: MusicWeb, name: string): Promise<string | null> => {
  const found = ArtistsSchema.safeParse(
    await web.json(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=5`),
  );
  const artist = found.success
    ? found.data.data.find((one) => nameKey(one.name) === nameKey(name))
    : undefined;
  const picture = artist?.picture_xl ?? null;

  return picture === null || picture.includes('/artist//') ? null : picture;
};

export { findDeezerArtistPictureUrl };
