import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';

/**
 * What to call where a title stands, and which kind of state that is, for any client to draw in its
 * own way: in the library, somewhere along being fetched, or nothing at all where it is simply there
 * to be asked for.
 *
 * @param standing - Where the title stands.
 * @returns Its label and the kind of state it is, or nothing where it can just be asked for.
 */
const nameTheStanding = (
  standing: CatalogueStanding,
): { label: string; look: 'queued' | 'working' | 'attention' | 'done' | 'failed' } | null => {
  if (standing.status === 'library') {
    return { look: 'done', label: say('client.nameTheStanding.inLibrary') };
  }

  if (standing.status === 'askable') {
    return null;
  }

  switch (standing.requestState) {
    case 'awaitingApproval':
      return { look: 'attention', label: say('client.nameTheStanding.awaitingApproval') };
    case 'refused':
      return { look: 'failed', label: say('client.nameTheStanding.refused') };
    case 'downloading':
    case 'chosen':
      return { look: 'working', label: say('client.nameTheStanding.downloading') };
    case 'filing':
    case 'filed':
    case 'available':
      return { look: 'working', label: say('client.nameTheStanding.arriving') };
    case 'failed':
      return { look: 'failed', label: say('client.nameTheStanding.stuck') };
    case 'waiting':
    case 'wanted':
    case 'searching':
    case null:
      return { look: 'queued', label: say('client.nameTheStanding.requested') };
  }
};

export { nameTheStanding };
