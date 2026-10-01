import { folderOf } from '@ValenceServer/arrEmulation/folderOf';
import { imagesOf } from '@ValenceServer/arrEmulation/imagesOf';
import { NEVER_ADDED } from '@ValenceServer/arrEmulation/NEVER_ADDED';
import type { ArrImage } from '@ValenceServer/arrEmulation/imagesOf';
import type { ArrTitle } from '@ValenceServer/arrEmulation/folderOf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type SonarrSeriesFacts = {
  tmdbId: number;
  tvdbId: number;
  title: ArrTitle;
  isEnded: boolean;
  seasons: ReadonlyMap<number, number>;
  held: ReadonlyMap<number, number>;
  request: MediaRequest | null;
  isHeld: boolean;
  qualityProfileId: number;
  rootFolderPath: string;
};

type SonarrStatistics = {
  episodeFileCount: number;
  episodeCount: number;
  totalEpisodeCount: number;
  sizeOnDisk: number;
  percentOfEpisodes: number;
};

type SonarrSeason = {
  seasonNumber: number;
  monitored: boolean;
  statistics: SonarrStatistics;
};

type SonarrSeries = {
  id?: number;
  title: string;
  sortTitle: string;
  tvdbId: number;
  tmdbId: number;
  year: number;
  overview: string;
  titleSlug: string;
  images: ArrImage[];
  status: 'continuing' | 'ended';
  monitored: boolean;
  seasonFolder: boolean;
  seriesType: 'standard';
  qualityProfileId: number;
  languageProfileId: number;
  rootFolderPath: string;
  folderName: string;
  path: string;
  tags: number[];
  added: string;
  seasons: SonarrSeason[];
  statistics: SonarrStatistics & { seasonCount: number };
};

/**
 * How much of a season, or of a whole series, is on disk, in the words Sonarr counts it in.
 *
 * @param onDisk - The episodes with a file.
 * @param due - The episodes wanted, which is what Sonarr measures against.
 * @param total - Every episode, aired or not.
 * @returns The counts.
 */
const countsOf = (onDisk: number, due: number, total: number): SonarrStatistics => ({
  episodeFileCount: onDisk,
  episodeCount: due,
  totalEpisodeCount: total,
  sizeOnDisk: 0,
  percentOfEpisodes: due === 0 ? 0 : Math.round((onDisk / due) * 100),
});

/**
 * A series as Sonarr describes one, for Overseerr or Jellyseerr to read: every season the catalogue
 * knows, each watched where it was asked for and approved, with how many of its episodes are in the
 * library against how many it has — which is how they tell a season that is complete from one under
 * way.
 *
 * @param facts - The series, its seasons, what of it is held, and its request where there is one.
 * @returns The series, in Sonarr's words.
 */
const sonarrSeriesOf = (facts: SonarrSeriesFacts): SonarrSeries => {
  const { tmdbId, tvdbId, title, isEnded, seasons, held, request, isHeld } = facts;
  const isApproved = request?.approval === 'approved';
  const folderName = folderOf(title);
  const numbers = [...new Set([...seasons.keys(), ...held.keys()])].sort((a, b) => a - b);
  const described = numbers.map((seasonNumber) => {
    const total = seasons.get(seasonNumber) ?? 0;
    const onDisk = Math.min(held.get(seasonNumber) ?? 0, total === 0 ? Infinity : total);
    const monitored =
      isApproved && (request.seasons === null || request.seasons.includes(seasonNumber));

    return {
      seasonNumber,
      monitored,
      statistics: countsOf(onDisk, monitored ? total : onDisk, total),
    };
  });
  const sum = (count: (season: SonarrSeason) => number) =>
    described.reduce((total, season) => total + count(season), 0);

  return {
    ...(request === null && !isHeld ? {} : { id: tmdbId }),
    title: title.title,
    sortTitle: title.title.toLowerCase(),
    tvdbId,
    tmdbId,
    year: title.year ?? 0,
    overview: title.overview ?? '',
    titleSlug: tmdbId.toString(),
    images: imagesOf(title.posterUrl),
    status: isEnded ? 'ended' : 'continuing',
    monitored: isApproved,
    seasonFolder: true,
    seriesType: 'standard',
    qualityProfileId: facts.qualityProfileId,
    languageProfileId: 1,
    rootFolderPath: facts.rootFolderPath,
    folderName,
    path: `${facts.rootFolderPath.replace(/\/+$/, '')}/${folderName}`,
    tags: [],
    added: request?.createdAt ?? NEVER_ADDED,
    seasons: described,
    statistics: {
      seasonCount: described.filter((season) => season.seasonNumber > 0).length,
      ...countsOf(
        sum((season) => season.statistics.episodeFileCount),
        sum((season) => season.statistics.episodeCount),
        sum((season) => season.statistics.totalEpisodeCount),
      ),
    },
  };
};

export { sonarrSeriesOf };

export type { SonarrSeason, SonarrSeries };
