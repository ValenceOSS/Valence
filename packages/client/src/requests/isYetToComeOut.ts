import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether a film, episode or album has come out, by the same rule the worker uses to promote it:
 * one with a day is out on that day, and one with none is out if it is not part of a season.
 *
 * @param item - The film, episode or album.
 * @param today - Today, as a calendar day.
 * @returns Whether it is out.
 */
const isOut = (item: MediaRequest['items'][number], today: string): boolean =>
  item.airDate === null ? item.season === null : item.airDate <= today;

/**
 * Whether a request waits only for its title to come out: a film before its release day, or a
 * series or artist whose next episode or album is still to air. Not a book, which is never released,
 * nor something still being looked up, nor something out and waiting for its search.
 *
 * @param request - The request.
 * @param today - Today, as a calendar day.
 * @returns Whether it is yet to come out.
 */
const isYetToComeOut = (
  request: Pick<MediaRequest, 'kind' | 'state' | 'items' | 'releaseDate'>,
  today: string,
): boolean => {
  if (request.state !== 'waiting' || request.kind === 'book') {
    return false;
  }

  if (request.kind === 'film') {
    return request.releaseDate !== null && request.releaseDate > today;
  }

  return (
    request.items.length > 0 &&
    !request.items.some((item) => item.state === 'waiting' && isOut(item, today))
  );
};

export { isYetToComeOut };
