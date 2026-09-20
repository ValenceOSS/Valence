import { isSameTitle } from '@ValenceRequests/mediaRequests/isSameTitle';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Matchable = Pick<RequestItemRecord, 'id' | 'season' | 'episode' | 'airDate'>;

/**
 * Whether a release's year could be the one asked for: a year either side, since a film's year
 * differs by where it was first shown, and anything goes where either does not say.
 *
 * @param released - The year a release name gives.
 * @param wanted - The year asked for.
 * @returns Whether they could be the same.
 */
const isNearYear = (released: number | null, wanted: number | null): boolean =>
  released === null || wanted === null || Math.abs(released - wanted) <= 1;

/**
 * The episodes a release numbered from the very first episode holds, counting through every regular
 * season in order — which only works where the request holds every season up to the ones asked
 * about, so it is only tried where it holds the first episode of all.
 *
 * @param absolutes - The episode numbers, counted from the first.
 * @param items - The request's episodes.
 * @returns The episodes it holds.
 */
const byAbsoluteNumber = <Item extends Matchable>(
  absolutes: readonly number[],
  items: readonly Item[],
): Item[] => {
  const regular = items
    .filter((item) => item.season !== null && item.season > 0 && item.episode !== null)
    .toSorted(
      (left, right) =>
        (left.season ?? 0) - (right.season ?? 0) || (left.episode ?? 0) - (right.episode ?? 0),
    );

  if (regular[0]?.season !== 1 || regular[0].episode !== 1) {
    return [];
  }

  return absolutes.flatMap((absolute) => {
    const item = regular[absolute - 1];

    return item === undefined ? [] : [item];
  });
};

/**
 * Which of a request's films or episodes a release holds, if it is for that request at all: the
 * title (or another it goes by) and a year near enough, and for a series the complete run, whole
 * seasons, the episodes it numbers, or the day it aired.
 *
 * @param request - What was asked for.
 * @param items - What it is waiting for.
 * @param parsed - What the release's name says it is.
 * @returns The ones it holds, or none where it is not for this request.
 */
const matchRelease = <Item extends Matchable>(
  request: Pick<MediaRequestRecord, 'kind' | 'title' | 'aliases' | 'year'>,
  items: readonly Item[],
  parsed: ParsedRelease,
): Item[] => {
  const isNamed = [request.title, ...request.aliases].some((title) =>
    isSameTitle(parsed.title, title),
  );

  if (!isNamed || !isNearYear(parsed.year, request.year)) {
    return [];
  }

  const isEpisodic =
    parsed.seasons.length > 0 ||
    parsed.absoluteEpisodes.length > 0 ||
    parsed.airDate !== null ||
    parsed.isCompleteSeries;

  if (request.kind === 'film') {
    return isEpisodic ? [] : items.filter((item) => item.season === null);
  }

  if (parsed.isCompleteSeries) {
    return [...items];
  }

  if (parsed.airDate !== null) {
    return items.filter((item) => item.airDate === parsed.airDate);
  }

  if (parsed.seasons.length > 0) {
    return parsed.episodes.length === 0
      ? items.filter((item) => item.season !== null && parsed.seasons.includes(item.season))
      : items.filter(
          (item) =>
            item.season === parsed.seasons[0] &&
            item.episode !== null &&
            parsed.episodes.includes(item.episode),
        );
  }

  return byAbsoluteNumber(parsed.absoluteEpisodes, items);
};

export { matchRelease };
