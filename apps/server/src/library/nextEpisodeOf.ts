import type { SeriesShape } from '@ValenceServer/library/MetadataProvider';

type NextEpisode = {
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate: string;
};

/**
 * The next episode of a programme to air: the one whose date is soonest from today onward, counting
 * today itself, since an episode out today is one somebody will want to be told about.
 *
 * Specials, which sit in season nought, are left out, as is any episode with no date. Dates are
 * whole calendar days with no time or zone, so they compare as text.
 *
 * @param seasons - What the programme is made of, as the catalogue has it.
 * @param today - Today, as a calendar date.
 * @returns The next episode to air, or nothing where none is dated from today on.
 */
const nextEpisodeOf = (seasons: SeriesShape['seasons'], today: string): NextEpisode | null => {
  const coming = seasons
    .filter((season) => season.seasonNumber > 0)
    .flatMap((season) =>
      season.episodes.flatMap((episode) => {
        const airDate = episode.airDate ?? null;

        return airDate !== null && airDate >= today
          ? [
              {
                seasonNumber: season.seasonNumber,
                episodeNumber: episode.episodeNumber,
                title: episode.title,
                airDate,
              },
            ]
          : [];
      }),
    )
    .sort(
      (left, right) =>
        left.airDate.localeCompare(right.airDate) ||
        left.seasonNumber - right.seasonNumber ||
        left.episodeNumber - right.episodeNumber,
    );

  return coming[0] ?? null;
};

export type { NextEpisode };

export { nextEpisodeOf };
