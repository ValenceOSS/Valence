import type { MediaRequest, Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Everybody who has asked for something, the first asker first and the rest in the order they
 * joined; nobody for a title only followed, which nobody asked for.
 *
 * @param request - The request.
 * @returns Who asked.
 */
const askersOf = (
  request: Pick<MediaRequest, 'requestedBy' | 'alsoAskedBy' | 'origin'>,
): Requester[] =>
  request.origin === 'monitored' ? [] : [request.requestedBy, ...request.alsoAskedBy];

export { askersOf };
