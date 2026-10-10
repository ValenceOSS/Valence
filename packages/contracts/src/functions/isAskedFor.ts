import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether somebody asked for a title, rather than it only being followed: only what somebody asked
 * for belongs among the requests.
 *
 * @param request - The request.
 * @returns Whether it was asked for.
 */
const isAskedFor = (request: Pick<MediaRequest, 'origin'>): boolean =>
  request.origin !== 'monitored';

export { isAskedFor };
