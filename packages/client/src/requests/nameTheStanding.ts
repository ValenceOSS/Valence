import { REQUEST_STATE_NAMES } from '@ValenceContracts/constants/REQUEST_STATE_NAMES';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';

/**
 * What to call where a title stands, and which kind of state that is, for any client to draw in its
 * own way: in the library, on a linked server, somewhere along being fetched, or nothing at all
 * where it is simply there to be asked for. Something on a linked server that is also asked for here
 * says how the request is getting on, since that is what the asking is about. A request's state is
 * named in the same words as everywhere else.
 *
 * @param standing - Where the title stands.
 * @returns Its label and the kind of state it is, or nothing where it can just be asked for.
 */
const nameTheStanding = (
  standing: CatalogueStanding,
): { label: string; look: 'queued' | 'working' | 'attention' | 'done' | 'failed' } | null => {
  if (standing.status === 'library') {
    return { look: 'done', label: say('common.inYourLibrary') };
  }

  if (standing.status === 'linked' && standing.requestId === null) {
    return {
      look: 'done',
      label: say('common.onName', { name: standing.fromServer ?? say('common.linkedServers') }),
    };
  }

  if (standing.status === 'askable') {
    return null;
  }

  if (standing.requestState === null) {
    return { look: 'queued', label: say('common.requested') };
  }

  const label = REQUEST_STATE_NAMES[standing.requestState];

  switch (standing.requestState) {
    case 'awaitingApproval':
    case 'wanted':
      return { look: 'attention', label };
    case 'refused':
    case 'failed':
      return { look: 'failed', label };
    case 'searching':
    case 'chosen':
    case 'downloading':
    case 'filing':
    case 'filed':
      return { look: 'working', label };
    case 'available':
      return { look: 'done', label };
    case 'waiting':
      return { look: 'queued', label };
  }
};

export { nameTheStanding };
