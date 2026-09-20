import type { MediaRequestState } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

const UNDER_WAY = ['downloading', 'filing', 'filed', 'chosen', 'searching'] as const;

/**
 * Where a request has got to as a whole, from where each of its films or episodes has: waiting on
 * approval or refused before anything else; then whatever is under way, the furthest along first;
 * then anything that failed, anything still wanted, and available once all that could be is.
 * Episodes that have not aired yet do not hold back a series that is otherwise all there.
 *
 * @param request - The request.
 * @param items - Its films or episodes.
 * @returns Its state, and what went wrong where something did.
 */
const describeRequestState = (
  request: Pick<MediaRequestRecord, 'approval' | 'problem'>,
  items: readonly Pick<RequestItemRecord, 'state' | 'problem'>[],
): { state: MediaRequestState; problem: string | null } => {
  if (request.approval !== 'approved') {
    return {
      state: request.approval === 'awaiting' ? 'awaitingApproval' : 'refused',
      problem: null,
    };
  }

  const underWay = UNDER_WAY.find((state) => items.some((item) => item.state === state));
  const failed = items.find((item) => item.state === 'failed');
  const state: MediaRequestState =
    underWay ??
    (failed === undefined
      ? items.some((item) => item.state === 'wanted')
        ? 'wanted'
        : items.some((item) => item.state === 'available')
          ? 'available'
          : 'waiting'
      : 'failed');

  return {
    state,
    problem:
      request.problem ??
      items.find((item) => item.state === state && item.problem !== null)?.problem ??
      null,
  };
};

export { describeRequestState };
