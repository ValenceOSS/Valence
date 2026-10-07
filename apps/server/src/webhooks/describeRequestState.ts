import type { MediaRequestState } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

/**
 * Where a request has got to, in the words the requests page uses for it.
 *
 * @param state - The request's state.
 * @returns Its status.
 */
const describeRequestState = (state: MediaRequestState): string => {
  switch (state) {
    case 'awaitingApproval':
      return say('client.requests.nameTheStanding.waitingForApproval');
    case 'refused':
      return say('common.refused');
    case 'waiting':
    case 'wanted':
      return say('common.requested');
    case 'searching':
      return say('common.searching');
    case 'chosen':
    case 'downloading':
      return say('common.downloading');
    case 'filing':
    case 'filed':
      return say('common.filing');
    case 'available':
      return say('common.available');
    case 'failed':
      return say('common.stalled');
  }
};

export { describeRequestState };
