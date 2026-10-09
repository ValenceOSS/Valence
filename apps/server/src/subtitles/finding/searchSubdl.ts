import { z } from 'zod';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleLookup } from './SubtitleLookup';

const SearchSchema = z.object({
  subtitles: z
    .array(
      z.object({
        release_name: z.string().catch(''),
        name: z.string().catch(''),
        lang: z.string().catch(''),
        url: z.string(),
        hi: z.boolean().catch(false),
      }),
    )
    .catch([]),
});

/**
 * Looks for subtitles in one language on SubDL, by the film or programme's catalogue ids and, for an
 * episode, its season and number.
 *
 * @param key - The API key.
 * @param lookup - What the video is.
 * @param fetchImpl - The way out to the web.
 * @returns What was found, or nothing where SubDL could not be asked or knew no id to look by.
 */
const searchSubdl = async (
  key: string,
  lookup: SubtitleLookup,
  fetchImpl: typeof fetch = fetch,
): Promise<FoundSubtitle[]> => {
  if (lookup.tmdbId === null && lookup.imdbId === null) {
    return [];
  }

  const query = new URLSearchParams({
    api_key: key,
    languages: lookup.language.toUpperCase(),
    type: lookup.kind === 'episode' ? 'tv' : 'movie',
    subs_per_page: '30',
    ...(lookup.tmdbId === null
      ? { imdb_id: lookup.imdbId ?? '' }
      : { tmdb_id: lookup.tmdbId.toString() }),
    ...(lookup.season === null ? {} : { season_number: lookup.season.toString() }),
    ...(lookup.episode === null ? {} : { episode_number: lookup.episode.toString() }),
  });
  const answer = await fetchImpl(`https://api.subdl.com/api/v1/subtitles?${query.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (answer === null || !answer.ok) {
    return [];
  }

  const read = SearchSchema.safeParse(await answer.json().catch(() => null));

  return (read.success ? read.data.subtitles : []).map((found) => ({
    source: 'subdl' as const,
    id: found.url,
    name: found.release_name === '' ? found.name : found.release_name,
    language: lookup.language,
    isExactMatch: false,
    isHearingImpaired: found.hi,
    isMachineTranslated: false,
    frameRate: null,
    downloads: null,
    score: 0,
    reasons: [],
  }));
};

export { searchSubdl };
