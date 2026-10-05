import { z } from 'zod';
import { albumHitOf } from '@ValenceServer/requests/musicBrainz/albumHitOf';
import { escapedForMusicBrainz } from '@ValenceServer/requests/musicBrainz/escapedForMusicBrainz';
import { MusicBrainzReleaseGroupSchema } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';
import { artistPictureUrl } from '@ValenceServer/requests/musicBrainz/artistPictureUrl';
import { yearOfDate } from '@ValenceServer/requests/musicBrainz/yearOfDate';
import type { MusicCatalogueHit, MusicRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const MOST_HITS = 15;

const ArtistsSchema = z.object({
  artists: z
    .array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          disambiguation: z.string().catch(''),
          'life-span': z
            .object({ begin: z.string().nullable().catch(null) })
            .catch({ begin: null }),
        })
        .nullable()
        .catch(null),
    )
    .catch([]),
});

const ReleaseGroupsSchema = z.object({
  'release-groups': z.array(MusicBrainzReleaseGroupSchema.nullable().catch(null)).catch([]),
});

/**
 * Searches MusicBrainz for artists or albums to ask for, best matches first: an artist with what
 * tells them apart from others of the name, the year they began and their picture, or an album
 * with its artist, its kind, the year it came out and its cover.
 *
 * @param web - The way out to the web, paced as MusicBrainz asks.
 * @param query - What was typed.
 * @param kind - Whether artists or albums are looked for.
 * @returns What was found, or nothing where MusicBrainz could not be asked.
 */
const searchMusicCatalogue = async (
  web: MusicWeb,
  query: string,
  kind: MusicRequestKind,
): Promise<MusicCatalogueHit[]> => {
  const words = query.trim();

  if (words === '') {
    return [];
  }

  const found = await web.json(
    `https://musicbrainz.org/ws/2/${kind === 'artist' ? 'artist' : 'release-group'}/?query=${encodeURIComponent(escapedForMusicBrainz(words))}&fmt=json&limit=${MOST_HITS.toString()}`,
  );

  if (kind === 'artist') {
    const read = ArtistsSchema.safeParse(found);

    return read.success
      ? read.data.artists.flatMap((artist) =>
          artist === null
            ? []
            : [
                {
                  kind: 'artist' as const,
                  musicBrainzId: artist.id,
                  title: artist.name,
                  artist: null,
                  disambiguation: artist.disambiguation === '' ? null : artist.disambiguation,
                  type: null,
                  year: yearOfDate(artist['life-span'].begin),
                  coverUrl: artistPictureUrl(artist.name),
                },
              ],
        )
      : [];
  }

  const read = ReleaseGroupsSchema.safeParse(found);

  return read.success
    ? read.data['release-groups'].flatMap((group) => (group === null ? [] : [albumHitOf(group)]))
    : [];
};

export { searchMusicCatalogue };
