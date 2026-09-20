import { queryTitleOf } from '@ValenceRequests/mediaRequests/queryTitleOf';
import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type PlannedSearch = { search: ReleaseSearch; itemIds: string[] };

type Plannable = Pick<RequestItemRecord, 'id' | 'season' | 'episode' | 'airDate' | 'title'>;

/**
 * What to ask the indexers for a request's films or episodes that are wanted, by a title safe to
 * search with: a film by its title and catalogue id; a season that has finished airing, with more
 * than one episode of it wanted, as a whole, since a season is usually released as one; and any
 * other episode on its own. An album is searched among the indexers' music, by its artist and title.
 *
 * @param request - What was asked for.
 * @param items - All its films or episodes, so a season is only searched whole once all of it aired.
 * @param wanted - The ones to search for.
 * @param today - Today, as a calendar date.
 * @returns The searches, each with what it is for.
 */
const planSearches = (
  request: Pick<MediaRequestRecord, 'kind' | 'title' | 'tmdbId' | 'artistName'>,
  items: readonly Plannable[],
  wanted: readonly Plannable[],
  today: string,
): PlannedSearch[] => {
  if (wanted.length === 0) {
    return [];
  }

  const query = queryTitleOf(request.title);

  if (request.kind === 'film') {
    return [
      {
        search: {
          query,
          mode: 'movie',
          ...(request.tmdbId === null ? {} : { tmdbId: request.tmdbId }),
        },
        itemIds: wanted.map((item) => item.id),
      },
    ];
  }

  if (request.kind === 'artist' || request.kind === 'album') {
    const artist = queryTitleOf(request.artistName ?? request.title);

    return wanted.map((item) => {
      const album = queryTitleOf(item.title);

      return {
        search: { query: `${artist} ${album}`, mode: 'music', artist, album },
        itemIds: [item.id],
      };
    });
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
            search: { query, mode: 'tv', season },
            itemIds: inSeason.map((item) => item.id),
          },
        ];
      }

      return inSeason.flatMap((item) =>
        item.episode === null
          ? []
          : [
              {
                search: { query, mode: 'tv', season, episode: item.episode },
                itemIds: [item.id],
              },
            ],
      );
    });
};

export type { PlannedSearch };

export { planSearches };
