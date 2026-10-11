import { sendToLiveTv } from './sendToLiveTv';
import { LiveSourceSchema } from '@ValenceContracts/schemas/LiveTv';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LiveSource } from '@ValenceContracts/schemas/LiveTv';

/**
 * Changes the guides a live TV source reads what is on from, and has it read again.
 *
 * @param id - The source.
 * @param guideUrl - The guides' addresses, separated by spaces, or nothing for none.
 * @returns The source as read now, or why it was refused.
 */
const changeLiveGuide = (id: string, guideUrl: string | null): Promise<Sent<LiveSource | null>> =>
  sendToLiveTv(`/sources/${encodeURIComponent(id)}/guide`, 'PUT', LiveSourceSchema, { guideUrl });

export { changeLiveGuide };
