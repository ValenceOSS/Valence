import { z } from 'zod';
import { quotedForMusicBrainz } from '@ValenceServer/music/web/quotedForMusicBrainz';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const SURE_ENOUGH = 90;

const DeezerAlbumSchema = z.object({ title: z.string(), artist: z.object({ name: z.string() }) });

const DeezerArtistSchema = z.object({ name: z.string() });

const FoundSchema = z.object({
  artists: z.array(z.object({ id: z.string().uuid(), score: z.number().catch(0) })).optional(),
  'release-groups': z
    .array(z.object({ id: z.string().uuid(), score: z.number().catch(0) }))
    .optional(),
});

/**
 * What to ask MusicBrainz for something Deezer described: an artist by name, or an album by its
 * title and artist.
 *
 * @param kind - Whether it is an artist or an album.
 * @param described - What Deezer said of it.
 * @returns The query, or null where Deezer said nothing that could be read.
 */
const queryFor = (kind: MusicRequestKind, described: JsonValue | null): string | null => {
  if (kind === 'artist') {
    const artist = DeezerArtistSchema.safeParse(described);

    return artist.success ? `artist:${quotedForMusicBrainz(artist.data.name)}` : null;
  }

  const album = DeezerAlbumSchema.safeParse(described);

  return album.success
    ? `releasegroup:${quotedForMusicBrainz(album.data.title)} AND artist:${quotedForMusicBrainz(album.data.artist.name)}`
    : null;
};

/**
 * Finds a Deezer album or artist in MusicBrainz, which is what a request is made by: Deezer is asked
 * what it is called, then MusicBrainz is searched for it by name — an album by its title and
 * artist — and only a match MusicBrainz is sure of is taken, since the wrong artist watched is
 * worse than none.
 *
 * @param web - The way out to the web.
 * @param kind - Whether it is an artist or an album.
 * @param deezerId - Its Deezer id.
 * @returns Its MusicBrainz id — an album's release group — or null where it was not found surely.
 */
const findOnMusicBrainz = async (
  web: MusicWeb,
  kind: MusicRequestKind,
  deezerId: number,
): Promise<string | null> => {
  const described = await web.json(
    `https://api.deezer.com/${kind === 'artist' ? 'artist' : 'album'}/${deezerId.toString()}`,
  );
  const query = queryFor(kind, described);

  if (query === null) {
    return null;
  }

  const found = FoundSchema.safeParse(
    await web.json(
      `https://musicbrainz.org/ws/2/${kind === 'artist' ? 'artist' : 'release-group'}/?query=${encodeURIComponent(query)}&fmt=json&limit=3`,
    ),
  );
  const hits = found.success
    ? ((kind === 'artist' ? found.data.artists : found.data['release-groups']) ?? [])
    : [];

  return hits.find((hit) => hit.score >= SURE_ENOUGH)?.id ?? null;
};

export { findOnMusicBrainz };
