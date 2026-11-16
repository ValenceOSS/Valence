import { z } from 'zod';

const OldMinimumsSchema = z
  .object({
    filmMinimumScore: z.number().optional(),
    episodeMinimumScore: z.number().optional(),
  })
  .passthrough();

/**
 * Moves a minimum score kept before subtitles were scored as Bazarr scores them onto that scale,
 * keeping what it meant: the exact file only stays at 100, the same release becomes 98, a close
 * match becomes 90, which asks for the same source, and anything stays at nothing. A minimum below
 * a close match becomes Bazarr's own default for its kind.
 *
 * @param old - The minimum as it was kept.
 * @param kind - Whether it is for films or episodes.
 * @returns The minimum on Bazarr's scale.
 */
const bazarrMinimumOf = (old: number, kind: 'film' | 'episode'): number =>
  old >= 100 ? 100 : old >= 80 ? 98 : old >= 60 ? 90 : old > 0 ? (kind === 'film' ? 70 : 90) : 0;

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
