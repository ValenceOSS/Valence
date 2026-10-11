import { z } from 'zod';
import { sendToLiveTv } from './sendToLiveTv';
import type { Sent } from '@ValenceClient/requests/sendToRequests';

/**
 * Removes a live TV source, with its channels and guide.
 *
 * @param id - The source.
 * @returns Nothing, or why it was refused.
 */
const removeLiveSource = (id: string): Promise<Sent<null>> =>
  sendToLiveTv(`/sources/${encodeURIComponent(id)}`, 'DELETE', z.null());

export { removeLiveSource };
