import { z } from 'zod';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleLookup } from './SubtitleLookup';
import { OPEN_SUBTITLES_AGENT } from './OPEN_SUBTITLES_AGENT';
import { OPEN_SUBTITLES_API } from './OPEN_SUBTITLES_API';

const SearchSchema = z.object({
  data: z
    .array(
      z.object({
        attributes: z.object({
          language: z.string().catch(''),
          download_count: z.number().int().nonnegative().nullable().catch(null),
          hearing_impaired: z.boolean().catch(false),
          moviehash_match: z.boolean().catch(false),
          machine_translated: z.boolean().catch(false),
          ai_translated: z.boolean().catch(false),
          fps: z.number().nonnegative().nullable().catch(null),
          release: z.string().catch(''),
          files: z.array(z.object({ file_id: z.number().int(), file_name: z.string().catch('') })),
        }),
      }),
    )
    .catch([]),
});

/**
 * Looks for subtitles in one language on OpenSubtitles: by the video's own hash, which finds those
 * timed to this release, and by its film or episode's catalogue ids, which finds the rest. Each says
 * the frame rate it was timed to and whether a machine translated it, where OpenSubtitles knows.
 *
 * @param key - The API key.
 * @param lookup - What the video is.
 * @param fetchImpl - The way out to the web.
 * @returns What was found, or nothing where OpenSubtitles could not be asked.
 */
const searchOpenSubtitles = async (
  key: string,
  lookup: SubtitleLookup,
  fetchImpl: typeof fetch = fetch,
): Promise<FoundSubtitle[]> => {
  const asked: Record<string, string> = { languages: lookup.language };

  if (lookup.hash !== null) {
    asked.moviehash = lookup.hash;
  }

  if (lookup.kind === 'episode') {
    if (lookup.tmdbId !== null) {
      asked.parent_tmdb_id = lookup.tmdbId.toString();
    }

    if (lookup.season !== null) {
      asked.season_number = lookup.season.toString();
    }

    if (lookup.episode !== null) {
      asked.episode_number = lookup.episode.toString();
    }
  } else if (lookup.tmdbId !== null) {
    asked.tmdb_id = lookup.tmdbId.toString();
  } else if (lookup.imdbId !== null) {
    asked.imdb_id = lookup.imdbId.replace(/^tt/i, '');
  }

  const query = new URLSearchParams(
    Object.entries(asked).toSorted(([left], [right]) => left.localeCompare(right)),
  );
  const answer = await fetchImpl(`${OPEN_SUBTITLES_API}/subtitles?${query.toString()}`, {
    headers: { 'Api-Key': key, 'User-Agent': OPEN_SUBTITLES_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (answer === null || !answer.ok) {
    return [];
  }

  const read = SearchSchema.safeParse(await answer.json().catch(() => null));

  return (read.success ? read.data.data : []).flatMap(({ attributes }) =>
    attributes.files.map((file) => ({
      source: 'opensubtitles' as const,
      id: file.file_id.toString(),
      name: attributes.release === '' ? file.file_name : attributes.release,
      language: attributes.language,
      isExactMatch: attributes.moviehash_match,
      isHearingImpaired: attributes.hearing_impaired,
      isMachineTranslated: attributes.machine_translated || attributes.ai_translated,
      frameRate: attributes.fps === null || attributes.fps === 0 ? null : attributes.fps,
      downloads: attributes.download_count,
      score: 0,
      reasons: [],
    })),
  );
};

export { searchOpenSubtitles };
