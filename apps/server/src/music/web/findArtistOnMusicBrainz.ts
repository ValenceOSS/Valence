import { z } from 'zod';
import { nameKey } from '@ValenceServer/music/nameKey';
import { quotedForMusicBrainz } from './quotedForMusicBrainz';
import type { MusicWeb } from './createMusicWeb';

const SURE_ENOUGH = 90;

const ArtistsSchema = z.object({
  artists: z
    .array(z.object({ id: z.string().uuid(), name: z.string(), score: z.number().catch(0) }))
    .catch([]),
});

/**
 * Finds an artist on MusicBrainz by their name, taking only the best match whose name is the one
 * asked for and whose match MusicBrainz is sure of, so a band is not taken for another of its name.
 *
 * @param web - The way out to the web.
 * @param name - The artist.
 * @returns Their MusicBrainz id, or nothing where no match was sure enough.
 */
const findArtistOnMusicBrainz = async (web: MusicWeb, name: string): Promise<string | null> => {
  const found = ArtistsSchema.safeParse(
    await web.json(
      `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(`artist:${quotedForMusicBrainz(name)}`)}&fmt=json&limit=5`,
    ),
  );

  return found.success
    ? (found.data.artists.find(
        (artist) => artist.score >= SURE_ENOUGH && nameKey(artist.name) === nameKey(name),
      )?.id ?? null)
    : null;
};

export { findArtistOnMusicBrainz };
