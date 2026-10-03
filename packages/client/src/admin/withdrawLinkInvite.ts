import { z } from 'zod';
import { sendToLinking } from './sendToLinking';
import type { Refusal } from './readRefusal';

/**
 * Withdraws an open invite.
 *
 * @param id - The invite.
 * @returns Why it was refused, or nothing where it was withdrawn.
 */
const withdrawLinkInvite = async (id: string): Promise<Refusal> =>
  (await sendToLinking(`/invites/${encodeURIComponent(id)}`, 'DELETE', z.null())).refusal;

export { withdrawLinkInvite };
