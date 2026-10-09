import { isYetToComeOut } from '@ValenceClient/requests/isYetToComeOut';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const REQUEST_SHELVES = ['approve', 'progress', 'coming', 'wanted', 'here', 'refused'] as const;

type RequestShelf = (typeof REQUEST_SHELVES)[number];

/**
 * Which part of the requests list a request belongs in, by what it needs next: somebody to approve
 * it, time to finish what it is doing, its release, a release to be found, or nothing at all.
 *
 * @param request - The request.
 * @param today - What to treat as today, as `YYYY-MM-DD`, so the sorting can be tested.
 * @returns Its part of the list.
 */
const shelfOfRequest = (
  request: MediaRequest,
  today = new Date().toISOString().slice(0, 10),
): RequestShelf => {
  switch (request.state) {
    case 'awaitingApproval':
      return 'approve';
    case 'refused':
      return 'refused';
    case 'available':
      return 'here';
    case 'wanted':
    case 'failed':
      return 'wanted';
    case 'waiting':
      return isYetToComeOut(request, today) ? 'coming' : 'progress';
    case 'searching':
    case 'chosen':
    case 'downloading':
    case 'filing':
    case 'filed':
      return 'progress';
  }
};

export type { RequestShelf };

export { REQUEST_SHELVES, shelfOfRequest };
