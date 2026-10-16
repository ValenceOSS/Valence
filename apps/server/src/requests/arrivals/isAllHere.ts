import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether everything a request asked for that can be in the library is: for a series, every
 * episode it follows that has aired, leaving out any it gave up on, since those are not on their
 * way; for anything else, whatever arrived is the whole of it.
 *
 * @param request - The request, as it stands after something arrived.
 * @returns Whether it is all here, and so worth saying so.
 */
const isAllHere = (request: Pick<MediaRequest, 'kind' | 'items'>): boolean =>
  request.kind !== 'series' ||
  request.items
    .filter((item) => item.isFollowed && item.state !== 'waiting' && item.state !== 'failed')
    .every((item) => item.state === 'available');

export { isAllHere };
