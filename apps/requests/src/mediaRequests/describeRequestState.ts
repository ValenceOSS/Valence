import type { MediaRequestState } from '@ValenceContracts/schemas/MediaRequest';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
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
 * @returns Its state, and what went wrong where something did, with the kind of problem it is.
 */
const describeRequestState = (
  request: Pick<MediaRequestRecord, 'approval' | 'problem' | 'problemCode'>,
  items: readonly Pick<RequestItemRecord, 'state' | 'problem' | 'problemCode'>[],
): { state: MediaRequestState; problem: string | null; problemCode: ProblemCode | null } => {
  if (request.approval !== 'approved') {
    return {
      state: request.approval === 'awaiting' ? 'awaitingApproval' : 'refused',
      problem: null,
      problemCode: null,
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

  if (request.problem !== null) {
    return { state, problem: request.problem, problemCode: request.problemCode };
  }

  const telling = items.find((item) => item.state === state && item.problem !== null);

  return { state, problem: telling?.problem ?? null, problemCode: telling?.problemCode ?? null };
};

export { describeRequestState };
