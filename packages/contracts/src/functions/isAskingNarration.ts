import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether a request for a book waits to be told which narration of its audiobook to fetch: it
 * wants the audiobook, the book is out in more than one narration, and none is chosen yet.
 *
 * @param request - The request, with the narrations wanted where any are.
 * @returns Whether it does.
 */
const isAskingNarration = (
  request: Pick<MediaRequest, 'kind' | 'bookFormats' | 'narrations'> & {
    narrationsWanted?: readonly string[] | null;
  },
): boolean =>
  request.kind === 'book' &&
  (request.bookFormats ?? []).includes('audiobook') &&
  (request.narrations?.length ?? 0) > 1 &&
  (request.narrationsWanted ?? null) === null;

export { isAskingNarration };
