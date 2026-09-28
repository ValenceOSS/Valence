import { z } from 'zod';
import { nameKey } from '@ValenceServer/music/nameKey';
import type { MusicWeb } from './createMusicWeb';

const ArtistsSchema = z.object({
  results: z
    .array(
      z.object({
        artistId: z.number(),
        artistName: z.string().catch(''),
        artistLinkUrl: z.string().nullable().catch(null),
      }),
    )
    .catch([]),
});

type AppleArtist = {
  id: number;
  link: string | null;
};

/**
 * Finds an artist in the iTunes catalogue, which needs no key.
 *
 * The artist is only taken where the name found is the name asked for, so a cover band or a
 * karaoke label named after them is never mistaken for them.
 *
 * @param web - The way out to the web.
 * @param name - The artist.
 * @returns Their catalogue id and their Apple Music page, or nothing where they were not found.
 */
const findAppleArtist = async (web: MusicWeb, name: string): Promise<AppleArtist | null> => {
  const found = ArtistsSchema.safeParse(
    await web.json(
      `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=musicArtist&limit=5`,
    ),
  );
  const artist = found.success
    ? found.data.results.find((one) => nameKey(one.artistName) === nameKey(name))
    : undefined;

  return artist === undefined ? null : { id: artist.artistId, link: artist.artistLinkUrl };
};

export type { AppleArtist };

export { findAppleArtist };
