import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';

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
    return { look: 'done', label: 'In your library' };
  }

  if (standing.status === 'askable') {
    return null;
  }

  switch (standing.requestState) {
    case 'awaitingApproval':
      return { look: 'attention', label: 'Waiting for approval' };
    case 'refused':
      return { look: 'failed', label: 'Refused' };
    case 'downloading':
    case 'chosen':
      return { look: 'working', label: 'Downloading' };
    case 'filing':
    case 'filed':
    case 'available':
      return { look: 'working', label: 'Arriving' };
    case 'failed':
      return { look: 'failed', label: 'Stuck' };
    case 'waiting':
    case 'wanted':
    case 'searching':
    case null:
      return { look: 'queued', label: 'Requested' };
  }
};

export { nameTheStanding };
