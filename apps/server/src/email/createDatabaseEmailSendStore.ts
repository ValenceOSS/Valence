import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { upsert } from '@ValenceDatabase/upsert';
import { emailSend } from '#dialect/Schema';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { EmailKindSchema, EmailSendStateSchema } from '@ValenceContracts/schemas/EmailSend';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { EmailSend } from '@ValenceContracts/schemas/EmailSend';
import type { EmailSendStore } from './EmailSendStore';

/**
 * Every email Valence has tried to send, held in the database by its idempotency key, so a retried
 * send is recognised and an administrator can see what went out and what failed.
 *
 * @param db - The database to read and write.
 * @returns The store.
 */
const createDatabaseEmailSendStore = (db: AnyValenceDatabase): EmailSendStore => {
  const readRow = (row: typeof emailSend.$inferSelect): EmailSend[] => {
    const kind = EmailKindSchema.safeParse(row.kind);
    const state = EmailSendStateSchema.safeParse(row.state);
    const failure = SaidSchema.nullable().safeParse(row.failure ?? null);

    if (!kind.success || !state.success) {
      return [];
    }

    return [
      {
        id: row.id,
        kind: kind.data,
        recipient: row.recipient,
        state: state.data,
        failure: failure.success ? failure.data : null,
        createdAt: row.createdAt.toISOString(),
      },
    ];
  };

  return {
    wasSent: async (idempotencyKey) => {
      const rows = await db
        .select({ state: emailSend.state })
        .from(emailSend)
        .where(eq(emailSend.idempotencyKey, idempotencyKey))
        .limit(1);

      return rows[0]?.state === 'sent';
    },

    record: async ({ kind, recipient, idempotencyKey, failure }) => {
      const state = failure === null ? 'sent' : 'failed';
      const createdAt = new Date();

      await upsert(db, emailSend, {
        values: [{ id: randomUUID(), kind, recipient, idempotencyKey, state, failure, createdAt }],
        target: emailSend.idempotencyKey,
        set: { kind, recipient, state, failure, createdAt },
      });
    },

    recent: async (limit) => {
      const rows = await db
        .select()
        .from(emailSend)
        .orderBy(desc(emailSend.createdAt))
        .limit(limit);

      return rows.flatMap((row) => readRow(row));
    },
  };
};

export { createDatabaseEmailSendStore };
