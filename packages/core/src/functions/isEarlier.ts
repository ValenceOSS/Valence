import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Decides which of two episodes should stand for a whole programme, preferring the earliest — a
 * shelf shows a series by its first episode rather than by whichever was scanned first.
 *
 * @param candidate - One episode.
 * @param against - The episode to compare it against.
 * @returns Whether the first should stand for the programme.
 */
const isEarlier = (candidate: MediaSummary, against: MediaSummary): boolean => {
  const season = (candidate.seasonNumber ?? 0) - (against.seasonNumber ?? 0);

  return season === 0 ? (candidate.episodeNumber ?? 0) < (against.episodeNumber ?? 0) : season < 0;
};

export { isEarlier };
