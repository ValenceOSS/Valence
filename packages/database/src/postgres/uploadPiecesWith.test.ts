import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { beforeAll, describe, expect, it } from 'vitest';
import { uploadPiecesWith } from './uploadPiecesWith';
import type { AnyDatabase } from './AnyDatabase';

const PIECES = pgTable('pieces', {
  id: text('id').primaryKey(),
  received: integer('received').array().notNull(),
});

let db: AnyDatabase;

beforeAll(async () => {
  const client = new PGlite();

  await client.exec(
    `CREATE TABLE "pieces" ("id" text PRIMARY KEY, "received" integer[] NOT NULL DEFAULT '{}');`,
  );
  db = drizzle(client);
}, 30_000);

/**
 * Reads back the pieces a row holds.
 *
 * @param id - The row.
 * @returns Its pieces.
 */
const receivedOf = async (id: string): Promise<number[]> => {
  const [row] = await db.select().from(PIECES).where(eq(PIECES.id, id));

  return row?.received ?? [];
};

describe('uploadPiecesWith', () => {
  it('adds a piece once, kept in order, however often it arrives', async () => {
    await db.insert(PIECES).values({ id: 'with', received: [] });

    for (const piece of [3, 1, 3, 2]) {
      await db
        .update(PIECES)
        .set({ received: uploadPiecesWith(PIECES.received, piece) })
        .where(eq(PIECES.id, 'with'));
    }

    await expect(receivedOf('with')).resolves.toStrictEqual([1, 2, 3]);
  });
});
