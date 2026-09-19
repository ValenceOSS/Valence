import { z } from 'zod';
import { creditedArtistOf } from '@ValenceServer/requests/musicBrainz/creditedArtistOf';
import { calendarDateOf } from '@ValenceServer/requests/musicBrainz/calendarDateOf';
import { MusicBrainzReleaseGroupSchema } from '@ValenceServer/requests/musicBrainz/MusicBrainzReleaseGroupSchema';
import { releaseGroupCoverUrl } from '@ValenceServer/requests/musicBrainz/releaseGroupCoverUrl';
import { releaseTypeOf } from '@ValenceServer/requests/musicBrainz/releaseTypeOf';
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
 * Words a person typed, made safe to hand MusicBrainz's search, whose query language reads
 * brackets, colons, quotation marks and the like as its own.
 *
 * @param words - What was typed.
 * @returns It escaped.
 */
const escaped = (words: string): string => words.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&');

/**
 * The year a MusicBrainz date falls in.
 *
 * @param date - The date, however much of it MusicBrainz gives.
 * @returns The year, or null where it gives none.
 */
const yearOf = (date: string | null): number | null => {
  const day = date === null ? null : calendarDateOf(date);

  return day === null ? null : Number(day.slice(0, 4));
};

/**
 * Searches MusicBrainz for artists or albums to ask for, best matches first: an artist with what
 * tells them apart from others of the name and the year they began, or an album with its artist,
 * its kind, the year it came out and its cover.
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
    `https://musicbrainz.org/ws/2/${kind === 'artist' ? 'artist' : 'release-group'}/?query=${encodeURIComponent(escaped(words))}&fmt=json&limit=${MOST_HITS.toString()}`,
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
                  year: yearOf(artist['life-span'].begin),
                  coverUrl: null,
                },
              ],
        )
      : [];
  }

  const read = ReleaseGroupsSchema.safeParse(found);

  return read.success
    ? read.data['release-groups'].flatMap((group) =>
        group === null
          ? []
          : [
              {
                kind: 'album' as const,
                musicBrainzId: group.id,
                title: group.title,
                artist: creditedArtistOf(group),
                disambiguation: group.disambiguation === '' ? null : group.disambiguation,
                type: releaseTypeOf(group['primary-type'], group['secondary-types']),
                year: yearOf(group['first-release-date']),
                coverUrl: releaseGroupCoverUrl(group.id),
              },
            ],
      )
    : [];
};

export { searchMusicCatalogue };
