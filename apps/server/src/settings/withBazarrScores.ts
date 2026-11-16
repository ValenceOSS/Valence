import { z } from 'zod';
import { bazarrMinimumOf } from '@ValenceServer/subtitles/finding/bazarrMinimumOf';

const OldMinimumsSchema = z
  .object({
    filmMinimumScore: z.number().optional(),
    episodeMinimumScore: z.number().optional(),
  })
  .passthrough();

/**
 * Carries subtitle settings kept before subtitles were scored as Bazarr scores them over to that
 * scale, once: settings already on it, or holding nothing recognisable, pass through for the
 * schema to judge.
 *
 * @param stored - The subtitle settings as they were read back.
 * @returns The same settings, their minimums on Bazarr's scale and marked as being on it.
 */
const withBazarrScores = <Stored>(stored: Stored) => {
  const old = OldMinimumsSchema.safeParse(stored);

  if (!old.success || old.data.scale === 'bazarr') {
    return stored;
  }

  const { filmMinimumScore, episodeMinimumScore, ...rest } = old.data;

  return {
    ...rest,
    ...(filmMinimumScore === undefined
      ? {}
      : { filmMinimumScore: bazarrMinimumOf(filmMinimumScore, 'film') }),
    ...(episodeMinimumScore === undefined
      ? {}
      : { episodeMinimumScore: bazarrMinimumOf(episodeMinimumScore, 'episode') }),
    scale: 'bazarr',
  };
};

export { withBazarrScores };
