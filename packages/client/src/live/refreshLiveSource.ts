import { sendToLiveTv } from './sendToLiveTv';
import { LiveSourceSchema } from '@ValenceContracts/schemas/LiveTv';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LiveSource } from '@ValenceContracts/schemas/LiveTv';

/**
 * Reads a live TV source's channels and guide again now.
 *
 * @param id - The source.
 * @returns The source as read now, or why it was refused.
 */
const refreshLiveSource = (id: string): Promise<Sent<LiveSource | null>> =>
  sendToLiveTv(`/sources/${encodeURIComponent(id)}/refresh`, 'POST', LiveSourceSchema);

export { refreshLiveSource };
