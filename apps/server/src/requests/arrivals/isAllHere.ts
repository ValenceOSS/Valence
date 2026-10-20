import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether an episode is part of what a request is waiting on: one it follows that was not given up
 * on, in a season that has begun to air. A season none of which has aired yet is one a request
 * follows for later, not one it is waiting on now.
 *
 * @param item - The episode.
 * @param begun - The seasons with at least one followed episode out.
 * @returns Whether the request is not whole until it is here.
 */
const isAwaited = (item: RequestItem, begun: ReadonlySet<number | null>): boolean =>
  item.isFollowed && item.state !== 'failed' && begun.has(item.season);

/**
 * Whether everything a request asked for is in the library: for a series, every followed episode
 * of every season that has begun to air, including those still to air, so a season half out is
 * not ready until its last episode is, and leaving out any it gave up on; for anything else,
 * whatever arrived is the whole of it.
 *
 * @param request - The request, as it stands after something arrived.
 * @returns Whether it is all here, and so worth saying so.
 */
const isAllHere = (request: Pick<MediaRequest, 'kind' | 'items'>): boolean => {
  if (request.kind !== 'series') {
    return true;
  }

  const begun = new Set(
    request.items
      .filter((item) => item.isFollowed && item.state !== 'waiting')
      .map((item) => item.season),
  );

  return request.items
    .filter((item) => isAwaited(item, begun))
    .every((item) => item.state === 'available');
};

export { isAllHere };
