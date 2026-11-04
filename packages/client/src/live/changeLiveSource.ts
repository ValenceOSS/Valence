import { sendToLiveTv } from './sendToLiveTv';
import { LiveSourceSchema } from '@ValenceContracts/schemas/LiveTv';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LiveSource, LiveSourceChange } from '@ValenceContracts/schemas/LiveTv';

/**
 * Renames a live TV source, or changes where it reads its channels from and has it read again.
 *
 * @param id - The source.
 * @param change - What to change.
 * @returns The source as read now, or why it was refused.
 */
const changeLiveSource = (id: string, change: LiveSourceChange): Promise<Sent<LiveSource | null>> =>
  sendToLiveTv(`/sources/${encodeURIComponent(id)}`, 'PATCH', LiveSourceSchema, change);

export { changeLiveSource };
