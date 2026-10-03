import { sendToLinking } from './sendToLinking';
import { LinkedServerSchema } from '@ValenceContracts/schemas/LinkedServer';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

/**
 * Links with the server another admin invited this one to.
 *
 * @param invite - The invite, as it was pasted.
 * @returns The server, waiting or linked, or why it was refused.
 */
const linkWithInvite = (invite: string): Promise<Sent<LinkedServer | null>> =>
  sendToLinking('', 'POST', LinkedServerSchema, { invite });

export { linkWithInvite };
