import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { findSiblings } from '@ValenceCore/functions/findSiblings';

/**
 * Finds the episode that follows one, for playing on at the end: the next in its season, or, after
 * the last of a season, the first of the next season the library has. Specials, which sit in season
 * nought, are never run on into or out of, since they belong to no point in the story.
 *
 * @param items - The episodes to choose from, which need the whole programme for a season's end to
 *   lead anywhere.
 * @param after - The episode that just finished.
 * @returns The next episode, or null where there is none.
 */
const nextEpisode = (items: MediaSummary[], after: MediaSummary): MediaSummary | null => {
  const at = after.episodeNumber ?? null;

  if (at === null) {
    return null;
  }

  const inSeason = findSiblings(items, after).find((item) => (item.episodeNumber ?? 0) > at);

  if (inSeason !== undefined) {
    return inSeason;
  }

  const season = after.seasonNumber ?? null;
  const series = after.seriesTitle ?? null;

  if (season === null || season === 0 || series === null) {
    return null;
  }

  const later = items
    .filter(
      (item) =>
        item.id !== after.id &&
        item.seriesTitle === series &&
        (item.seasonNumber ?? 0) > season &&
        item.episodeNumber !== null &&
        item.episodeNumber !== undefined,
    )
    .sort(
      (left, right) =>
        (left.seasonNumber ?? 0) - (right.seasonNumber ?? 0) ||
        (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0),
    );

  return later[0] ?? null;
};

export { nextEpisode };
