import type { SeriesReach } from '@ValenceServer/library/MetadataProvider';
import type { Placement } from '@ValenceServer/library/placement/Placement.types';

/**
 * How far each programme on disk reaches, by its folder: its furthest regular season, and the
 * furthest episode in that season, a double episode counting as its last.
 *
 * @param placed - Where every file was placed.
 * @returns The reach of each programme's folder.
 */
const reachOfEachSeries = (
  placed: ReadonlyMap<string, Pick<Placement, 'episode' | 'extra'>>,
): Map<string, SeriesReach> => {
  const reaches = new Map<string, SeriesReach>();

  for (const { episode, extra } of placed.values()) {
    const { seriesFolder, seasonNumber: season, episodeNumber, episodeNumberEnd } = episode;

    if (
      extra !== null ||
      seriesFolder === null ||
      season === null ||
      season < 1 ||
      episodeNumber === null
    ) {
      continue;
    }

    const last = Math.max(episodeNumber, episodeNumberEnd ?? episodeNumber);
    const kept = reaches.get(seriesFolder);

    if (
      kept === undefined ||
      season > kept.season ||
      (season === kept.season && last > kept.episode)
    ) {
      reaches.set(seriesFolder, { season, episode: last });
    }
  }

  return reaches;
};

export { reachOfEachSeries };
