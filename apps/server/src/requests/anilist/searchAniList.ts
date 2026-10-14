/* oxlint-disable valence/no-hard-coded-strings -- AniList's GraphQL query and its own format names, read by AniList rather than by people */
import { z } from 'zod';
import type { AniListEntry } from '@ValenceServer/requests/anilist/AniListEntry';
import type { QueryWeb } from '@ValenceServer/music/web/createMusicWeb';

const ANILIST = 'https://graphql.anilist.co';

const FIELDS = `id idMal format episodes status type title { romaji english native } synonyms startDate { year month day }`;

const QUERY = `query ($search: String) { Page(perPage: 15) { media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${FIELDS} relations { edges { relationType node { ${FIELDS} } } } } } }`;

const MediaSchema = z.object({
  id: z.number().int().positive(),
  idMal: z.number().int().positive().nullish(),
  format: z.string().nullish(),
  episodes: z.number().int().positive().nullish(),
  status: z.string().nullish(),
  type: z.string().nullish(),
  title: z
    .object({
      romaji: z.string().nullish(),
      english: z.string().nullish(),
      native: z.string().nullish(),
    })
    .catch({}),
  synonyms: z.array(z.string()).nullish().catch([]),
  startDate: z
    .object({
      year: z.number().int().nullish(),
      month: z.number().int().nullish(),
      day: z.number().int().nullish(),
    })
    .nullish()
    .catch(null),
});

const AnswerSchema = z.object({
  data: z.object({
    Page: z.object({
      media: z.array(
        MediaSchema.extend({
          relations: z
            .object({
              edges: z
                .array(z.object({ relationType: z.string().nullish(), node: MediaSchema }))
                .catch([]),
            })
            .nullish()
            .catch(null),
        }),
      ),
    }),
  }),
});

const RELATED = new Set(['SEQUEL', 'PREQUEL', 'PARENT', 'SIDE_STORY', 'ALTERNATIVE']);

const MOST_SYNONYMS = 10;

/**
 * A calendar date from AniList's parts of one, only where it gives the whole day.
 *
 * @param date - Its year, month and day.
 * @returns The date, or null.
 */
const dateOf = (date: z.infer<typeof MediaSchema>['startDate']): string | null =>
  date?.year === null ||
  date?.year === undefined ||
  date.month === null ||
  date.month === undefined ||
  date.day === null ||
  date.day === undefined
    ? null
    : `${date.year.toString()}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;

/**
 * One of AniList's entries as an anime request reads it.
 *
 * @param media - The entry, as AniList gave it.
 * @returns The entry.
 */
const entryOf = (media: z.infer<typeof MediaSchema>): AniListEntry => ({
  id: media.id,
  malId: media.idMal ?? null,
  format: media.format ?? null,
  english: media.title.english ?? null,
  romaji: media.title.romaji ?? null,
  native: media.title.native ?? null,
  synonyms: (media.synonyms ?? []).slice(0, MOST_SYNONYMS),
  startDate: dateOf(media.startDate),
  episodes: media.episodes ?? null,
  isAiring: media.status === 'RELEASING' || media.status === 'NOT_YET_RELEASED',
});

/**
 * The anime AniList finds by a name, each beside those it names as its sequels, prequels and side
 * stories, since a later cour can go by a name of its own; nothing where AniList does not answer.
 *
 * @param web - The way out to the web, which spaces the questions as AniList asks.
 * @param search - The name to look for.
 * @returns The entries found, each once, the closest first.
 */
const searchAniList = async (web: QueryWeb, search: string): Promise<AniListEntry[]> => {
  const answer = AnswerSchema.safeParse(
    await web.post(ANILIST, { query: QUERY, variables: { search } }),
  );

  if (!answer.success) {
    return [];
  }

  const found = answer.data.data.Page.media.flatMap((media) => [
    media,
    ...(media.relations?.edges ?? [])
      .filter(
        (edge) =>
          edge.node.type === 'ANIME' &&
          edge.relationType !== null &&
          RELATED.has(edge.relationType ?? ''),
      )
      .map((edge) => edge.node),
  ]);

  return found
    .filter((media, at) => found.findIndex((other) => other.id === media.id) === at)
    .map(entryOf);
};

export { searchAniList };
