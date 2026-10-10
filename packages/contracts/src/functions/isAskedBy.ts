import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether somebody is one of those who asked for something, first or later. Nobody asked for a
 * title only followed, not even whoever followed it.
 *
 * @param request - The request.
 * @param accountId - Who, by their account.
 * @returns Whether they asked.
 */
const isAskedBy = (
  request: Pick<MediaRequest, 'requestedBy' | 'alsoAskedBy' | 'origin'>,
  accountId: string | null | undefined,
): boolean =>
  accountId !== null &&
  accountId !== undefined &&
  request.origin !== 'monitored' &&
  (request.requestedBy.id === accountId ||
    request.alsoAskedBy.some((asker) => asker.id === accountId));

export { isAskedBy };
