import { queryTitleOf } from '@ValenceRequests/mediaRequests/queryTitleOf';
import type { AnimeFacts } from '@ValenceContracts/schemas/Anime';
import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { PlannedSearch } from '@ValenceRequests/mediaRequests/planSearches';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Plannable = Pick<RequestItemRecord, 'id' | 'season' | 'episode' | 'airDate' | 'title'>;

const MOST_NAMES = 3;

/**
 * A number as anime releases write it, two digits at least.
 *
 * @param number - The number.
 * @returns It, padded.
 */
const padded = (number: number): string => number.toString().padStart(2, '0');

/**
 * Every name worth searching for, once each and safe to search with, the first that are given
 * first. A name with nothing left once it is made safe, such as one made only of brackets, is
 * dropped, since an indexer asked for nothing answers with its newest releases.
 *
 * @param names - The names.
 * @returns The names to search for.
 */
const searchable = (names: readonly (string | null | undefined)[]): string[] => [
  ...new Set(
    names
      .filter((name): name is string => name !== null && name !== undefined)
      .map(queryTitleOf)
      .filter((name) => name !== ''),
  ),
];

/**
 * What to ask the indexers for an anime's episodes that are wanted, by every name it goes by and in
 * both ways anime is numbered.
 *
 * A cour that has finished airing, with more than one of its episodes wanted, is asked for whole
 * first — by its own name, the show's name and its number, and the catalogue's season where the
 * cour is one — since finished anime is mostly released in batches, and its episodes are asked for
 * one at a time only where no batch is found. Any other episode is asked for by the cour's name and
 * its place in the cour, by the show's name and its number counted from the first, each with and
 * without the padding fansub releases use, and by the catalogue's season and episode. Specials are
 * asked for by the catalogue's numbering alone.
 *
 * @param request - What was asked for, with its cours and catalogue ids.
 * @param anime - Its cours and numbers.
 * @param items - All its episodes, so a cour is only searched whole once all of it aired.
 * @param wanted - The ones to search for.
 * @param today - Today, as a calendar date.
 * @returns The searches, each with what it is for and the names to ask by.
 */
const planAnimeSearches = (
  request: Pick<MediaRequestRecord, 'title' | 'aliases' | 'tmdbId' | 'tvdbId' | 'imdbId'>,
  anime: AnimeFacts,
  items: readonly Plannable[],
  wanted: readonly Plannable[],
  today: string,
): PlannedSearch[] => {
  const ids = {
    ...(request.tmdbId === null ? {} : { tmdbId: request.tmdbId }),
    ...(request.imdbId === null ? {} : { imdbId: request.imdbId }),
    ...(request.tvdbId === null ? {} : { tvdbId: request.tvdbId }),
  };
  const shown = searchable([
    anime.names.romaji,
    anime.names.english,
    request.title,
    ...request.aliases,
  ]).slice(0, MOST_NAMES);
  const [main = queryTitleOf(request.title)] = shown;
  const placeOf = (item: Plannable) =>
    anime.episodes.find((one) => one.season === item.season && one.episode === item.episode);
  const regular = anime.episodes
    .filter((one) => one.season > 0)
    .toSorted((left, right) => left.season - right.season || left.episode - right.episode);
  const byCatalogue = (item: Plannable): PlannedSearch[] =>
    item.season === null || item.episode === null
      ? []
      : [
          {
            search: { query: main, mode: 'tv', season: item.season, episode: item.episode, ...ids },
            itemIds: [item.id],
            queries: shown,
          },
        ];
  const cours = [...new Set(wanted.map((item) => placeOf(item)?.cour ?? 0))].toSorted(
    (left, right) => left - right,
  );

  return cours.flatMap((number): PlannedSearch[] => {
    const inCour = wanted.filter((item) => (placeOf(item)?.cour ?? 0) === number);

    if (number === 0) {
      return inCour.flatMap(byCatalogue);
    }

    const cour = anime.cours.find((one) => one.cour === number);
    const named = searchable([
      ...(number === 1 ? shown : []),
      cour?.name,
      ...(cour?.names ?? []),
      ...(number > 1 ? [`${main} S${number.toString()}`] : []),
    ]).slice(0, MOST_NAMES + 1);
    const [courName = main] = named;
    const listed = regular.filter((one) => one.cour === number);
    const episodes = inCour.flatMap((item): PlannedSearch[] => {
      const place = listed.findIndex(
        (one) => one.season === item.season && one.episode === item.episode,
      );
      const absolute = placeOf(item)?.absolute ?? null;
      const numbers = [
        ...(place === -1 ? [] : [`${courName} ${padded(place + 1)}`]),
        ...(absolute === null ? [] : [`${main} ${padded(absolute)}`]),
        ...(place !== -1 && place + 1 < 10 ? [`${courName} ${(place + 1).toString()}`] : []),
        ...(absolute !== null && absolute < 10 ? [`${main} ${absolute.toString()}`] : []),
      ];
      const search: ReleaseSearch = { query: numbers[0] ?? main, mode: 'search' };

      return [
        ...(numbers.length === 0
          ? []
          : [{ search, itemIds: [item.id], queries: [...new Set(numbers)] }]),
        ...byCatalogue(item),
      ];
    });
    const hasAired = items
      .filter((item) => placeOf(item)?.cour === number)
      .every((item) => item.airDate !== null && item.airDate <= today);

    if (!hasAired || inCour.length <= 1) {
      return episodes;
    }

    const whole: PlannedSearch = {
      search: { query: courName, mode: 'search' },
      itemIds: inCour.map((item) => item.id),
      queries: named,
      fallback: episodes,
    };

    return cour?.season === null || cour?.season === undefined
      ? [whole]
      : [
          {
            ...whole,
            fallback: [
              {
                search: { query: main, mode: 'tv', season: cour.season, ...ids },
                itemIds: whole.itemIds,
                queries: shown,
              },
              ...episodes,
            ],
          },
        ];
  });
};

export { planAnimeSearches };
