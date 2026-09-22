import type { StatusTone } from '@ValenceClient/status/StatusTone';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';

/**
 * Says where a title stands, as a badge: in the library already, somewhere along being fetched, or
 * nothing at all where it is there to be asked for.
 *
 * @param standing - Where it stands.
 * @returns The badge's words and tone, or null where there is nothing to say.
 */
const describeStanding = (
  standing: CatalogueStanding,
): { label: string; tone: StatusTone } | null => {
  if (standing.status === 'library') {
    return { ...STATUS_LOOK.done, label: 'In your library' };
  }

  if (standing.status === 'askable') {
    return null;
  }

  switch (standing.requestState) {
    case 'awaitingApproval':
      return { ...STATUS_LOOK.attention, label: 'Waiting for approval' };
    case 'refused':
      return { ...STATUS_LOOK.failed, label: 'Refused' };
    case 'downloading':
    case 'chosen':
      return { ...STATUS_LOOK.working, label: 'Downloading' };
    case 'filing':
    case 'filed':
    case 'available':
      return { ...STATUS_LOOK.working, label: 'Arriving' };
    case 'failed':
      return { ...STATUS_LOOK.failed, label: 'Stuck' };
    case 'waiting':
    case 'wanted':
    case 'searching':
    case null:
      return { ...STATUS_LOOK.queued, label: 'Requested' };
  }
};

export { describeStanding };
