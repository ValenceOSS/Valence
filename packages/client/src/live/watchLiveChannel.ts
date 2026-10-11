import { sendToLiveTv } from './sendToLiveTv';
import { LiveStreamSchema } from '@ValenceContracts/schemas/LiveTv';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { LiveStream } from '@ValenceContracts/schemas/LiveTv';

/**
 * Asks where to play a channel from, through the server.
 *
 * @param id - The channel.
 * @returns The stream's address, or why it could not be started.
 */
const watchLiveChannel = (id: string): Promise<Sent<LiveStream | null>> =>
  sendToLiveTv(`/channels/${encodeURIComponent(id)}/watch`, 'POST', LiveStreamSchema);

export { watchLiveChannel };
