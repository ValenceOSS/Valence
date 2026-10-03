import { z } from 'zod';
import { sendToLinking } from './sendToLinking';
import type { Sent } from '@ValenceClient/requests/sendToRequests';

const LinkSyncSchema = z.object({
  libraries: z.number().int().nonnegative(),
  kept: z.number().int().nonnegative(),
  forgotten: z.number().int().nonnegative(),
});

/**
 * Reads what a linked server shares with this one again, now, rather than at the next time it is
 * read on its own.
 *
 * @param id - The linked server.
 * @returns How many libraries and titles were read, and how many had gone, or why it was refused.
 */
const syncLinkedServer = (id: string): Promise<Sent<z.infer<typeof LinkSyncSchema> | null>> =>
  sendToLinking(`/${encodeURIComponent(id)}/sync`, 'POST', LinkSyncSchema);

export { syncLinkedServer };
