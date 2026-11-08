/* oxlint-disable valence/no-hard-coded-strings -- AniList's GraphQL query, read by AniList rather than by people */
import { z } from 'zod';
import type { MangaNames } from '@ValenceServer/requests/anilist/MangaNames';
import type { QueryWeb } from '@ValenceServer/music/web/createMusicWeb';

const ANILIST = 'https://graphql.anilist.co';

const QUERY =
  'query ($search: String) { Media(search: $search, type: MANGA, sort: SEARCH_MATCH) { title { romaji english native } } }';

const AnswerSchema = z.object({
  data: z.object({
    Media: z.object({
      title: z.object({
        romaji: z.string().nullish(),
        english: z.string().nullish(),
        native: z.string().nullish(),
      }),
    }),
  }),
});

/**
 * The names a manga series goes by on AniList — in English, in romaji and as it was published —
 * found by any one of them, or nothing where AniList knows no such series or does not answer.
 *
 * @param web - The way out to the web, which spaces the questions as AniList asks.
 * @param search - A name of the series.
 * @returns Its names, or nothing.
 */
const findAniListManga = async (web: QueryWeb, search: string): Promise<MangaNames | null> => {
  const answer = AnswerSchema.safeParse(
    await web.post(ANILIST, { query: QUERY, variables: { search } }),
  );

  if (!answer.success) {
    return null;
  }

  const { title } = answer.data.data.Media;

  return {
    english: title.english ?? null,
    romaji: title.romaji ?? null,
    native: title.native ?? null,
  };
};

export { findAniListManga };
