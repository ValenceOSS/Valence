import { sendToLinking } from './sendToLinking';
import { LinkIdentitySchema } from '@ValenceContracts/schemas/LinkedServer';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LinkIdentity, LinkIdentityChange } from '@ValenceContracts/schemas/LinkedServer';

/**
 * Changes what this server is called, its colour, or where other servers reach it.
 *
 * @param change - What to change.
 * @returns The identity as it now is, or why it was refused.
 */
const changeLinkIdentity = (change: LinkIdentityChange): Promise<Sent<LinkIdentity | null>> =>
  sendToLinking('/identity', 'PATCH', LinkIdentitySchema, change);

export { changeLinkIdentity };
