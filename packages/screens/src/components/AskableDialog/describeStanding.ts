import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Says where a title stands, as a badge: in the library already, somewhere along being fetched, or
 * nothing at all where it is there to be asked for.
 *
 * @param standing - Where it stands.
 * @returns The badge's words and tone, or null where there is nothing to say.
 */
const describeStanding = (
  standing: CatalogueStanding,
): { label: string; tone: BadgeTone } | null => {
  if (standing.status === 'library') {
    return { label: 'In your library', tone: 'success' };
  }

  if (standing.status === 'askable') {
    return null;
  }

  switch (standing.requestState) {
    case 'awaitingApproval':
      return { label: 'Waiting for approval', tone: 'highlight' };
    case 'refused':
      return { label: 'Refused', tone: 'danger' };
    case 'downloading':
    case 'chosen':
      return { label: 'Downloading', tone: 'busy' };
    case 'filing':
    case 'filed':
    case 'available':
      return { label: 'Arriving', tone: 'success' };
    case 'failed':
      return { label: 'Stuck', tone: 'danger' };
    case 'waiting':
    case 'wanted':
    case 'searching':
    case null:
      return { label: 'Requested', tone: 'accent' };
  }
};

export { describeStanding };
