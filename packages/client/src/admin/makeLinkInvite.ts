import { sendToLinking } from './sendToLinking';
import { MadeLinkInviteSchema } from '@ValenceContracts/schemas/LinkedServer';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { MadeLinkInvite } from '@ValenceContracts/schemas/LinkedServer';

/**
 * Makes an invite for another server's admin, which is shown this once.
 *
 * @returns The invite, or why it was refused.
 */
const makeLinkInvite = (): Promise<Sent<MadeLinkInvite | null>> =>
  sendToLinking('/invites', 'POST', MadeLinkInviteSchema);

export { makeLinkInvite };
