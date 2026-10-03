import { sendToLinking } from './sendToLinking';
import { LinkedServerSchema } from '@ValenceContracts/schemas/LinkedServer';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

/**
 * Approves, refuses or asks after a server's request to link.
 *
 * @param id - The server.
 * @param what - Approve, refuse, or ask whether the other side has answered.
 * @returns The server as it now stands, or why it was refused.
 */
const answerLinkedServer = (
  id: string,
  what: 'approve' | 'refuse' | 'check',
): Promise<Sent<LinkedServer | null>> =>
  sendToLinking(`/${encodeURIComponent(id)}/${what}`, 'POST', LinkedServerSchema);

export { answerLinkedServer };
