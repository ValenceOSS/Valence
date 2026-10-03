import { z } from 'zod';
import { sendToLinking } from './sendToLinking';
import type { Refusal } from './readRefusal';

/**
 * Unlinks from a server, or forgets one that refused or unlinked.
 *
 * @param id - The server.
 * @returns Why it was refused, or nothing where it is gone.
 */
const unlinkServer = async (id: string): Promise<Refusal> =>
  (await sendToLinking(`/${encodeURIComponent(id)}`, 'DELETE', z.null())).refusal;

export { unlinkServer };
