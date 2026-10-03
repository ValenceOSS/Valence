import { sendToLinking } from './sendToLinking';
import { LinkSharingSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LinkSharing, LinkSharingChange } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Changes what this server shares with a linked server.
 *
 * @param id - The linked server.
 * @param change - What to change.
 * @returns What it is shared now, or why it was refused.
 */
const changeLinkSharing = (
  id: string,
  change: LinkSharingChange,
): Promise<Sent<LinkSharing | null>> =>
  sendToLinking(`/${encodeURIComponent(id)}/sharing`, 'PATCH', LinkSharingSchema, change);

export { changeLinkSharing };
