import { randomUUID } from 'node:crypto';
import type { EmailSend } from '@ValenceContracts/schemas/EmailSend';
import type { EmailSendStore } from './EmailSendStore';

/**
 * Every email tried, held in memory by its idempotency key, for a server built without a database.
 *
 * @param now - The clock each send is stamped with.
 * @returns The store.
 */
const createMemoryEmailSendStore = (now: () => Date = () => new Date()): EmailSendStore => {
  const sends = new Map<string, EmailSend>();

  return {
    wasSent: (idempotencyKey) => Promise.resolve(sends.get(idempotencyKey)?.state === 'sent'),

    record: ({ kind, recipient, idempotencyKey, failure }) => {
      sends.delete(idempotencyKey);
      sends.set(idempotencyKey, {
        id: randomUUID(),
        kind,
        recipient,
        state: failure === null ? 'sent' : 'failed',
        failure,
        createdAt: now().toISOString(),
      });

      return Promise.resolve();
    },

    recent: (limit) => Promise.resolve([...sends.values()].reverse().slice(0, limit)),
  };
};

export { createMemoryEmailSendStore };
