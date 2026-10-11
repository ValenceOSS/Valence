import { sendToLiveTv } from './sendToLiveTv';
import { LiveSourceSchema } from '@ValenceContracts/schemas/LiveTv';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LiveSource, NewLiveSource } from '@ValenceContracts/schemas/LiveTv';

/**
 * Adds a live TV source and has its channels read.
 *
 * @param source - The stream, playlist or tuner.
 * @returns The source as first read, or why it was refused.
 */
const addLiveSource = (source: NewLiveSource): Promise<Sent<LiveSource | null>> =>
  sendToLiveTv('/sources', 'POST', LiveSourceSchema, source);

export { addLiveSource };
