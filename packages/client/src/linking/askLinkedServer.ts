import { z } from 'zod';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { MediaRequestAsk } from '@ValenceContracts/schemas/MediaRequest';

const AskedSchema = z.object({ title: z.string(), isNew: z.boolean() });

/**
 * Asks a linked server to get something, rather than this one — where that server's admin takes
 * requests from this one. It goes into that server's own queue, for its admin to approve.
 *
 * @param serverId - The linked server.
 * @param ask - What to ask for.
 * @returns What was asked for, or why it was refused.
 */
const askLinkedServer = (
  serverId: string,
  ask: MediaRequestAsk,
): Promise<Sent<z.infer<typeof AskedSchema>>> =>
  sendToRequests(
    `/api/linked-servers/${encodeURIComponent(serverId)}/requests`,
    'POST',
    ask,
    async (response) => AskedSchema.parse(await response.json()),
  );

export { askLinkedServer };
