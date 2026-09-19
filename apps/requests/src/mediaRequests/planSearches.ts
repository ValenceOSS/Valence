import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type PlannedSearch = { search: ReleaseSearch; itemIds: string[] };

type Plannable = Pick<RequestItemRecord, 'id' | 'season' | 'episode' | 'airDate'>;

/**
 * What to ask the indexers for a request's films or episodes that are wanted: a film by its title
 * and catalogue id; a season that has finished airing, with more than one episode of it wanted, as
 * a whole, since a season is usually released as one; and any other episode on its own.
 *
 * @param request - What was asked for.
 * @param items - All its films or episodes, so a season is only searched whole once all of it aired.
 * @param wanted - The ones to search for.
 * @param today - Today, as a calendar date.
 * @returns The searches, each with what it is for.
 */
const planSearches = (
  request: Pick<MediaRequestRecord, 'kind' | 'title' | 'tmdbId'>,
  items: readonly Plannable[],
  wanted: readonly Plannable[],
  today: string,
): PlannedSearch[] => {
  if (wanted.length === 0) {
    return [];
  }

  if (request.kind === 'film') {
    return [
      {
        search: { query: request.title, mode: 'movie', tmdbId: request.tmdbId },
        itemIds: wanted.map((item) => item.id),
      },
    ];
  }

  const seasons = [
    ...new Set(wanted.flatMap((item) => (item.season === null ? [] : [item.season]))),
  ];

  return seasons
    .toSorted((left, right) => left - right)
    .flatMap((season): PlannedSearch[] => {
      const inSeason = wanted.filter((item) => item.season === season);
      const hasAired = items
        .filter((item) => item.season === season)
        .every((item) => item.airDate !== null && item.airDate <= today);

      if (hasAired && inSeason.length > 1) {
        return [
          {
            search: { query: request.title, mode: 'tv', season },
            itemIds: inSeason.map((item) => item.id),
          },
        ];
      }

      return inSeason.flatMap((item) =>
        item.episode === null
          ? []
          : [
              {
                search: { query: request.title, mode: 'tv', season, episode: item.episode },
                itemIds: [item.id],
              },
            ],
      );
    });
};

export type { PlannedSearch };

export { planSearches };
