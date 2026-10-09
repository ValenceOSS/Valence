import type { MediaRequest, Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Everybody who has asked for something, the first asker first and the rest in the order they
 * joined.
 *
 * @param request - The request.
 * @returns Who asked.
 */
const askersOf = (request: Pick<MediaRequest, 'requestedBy' | 'alsoAskedBy'>): Requester[] => [
  request.requestedBy,
  ...request.alsoAskedBy,
];

export { askersOf };
