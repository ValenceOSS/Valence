import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { beforeAll, describe, expect, it } from 'vitest';
import { uploadPiecesWithout } from './uploadPiecesWithout';
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

describe('uploadPiecesWithout', () => {
  it('takes a piece out, and leaves the rest', async () => {
    await db.insert(PIECES).values({ id: 'without', received: [0, 1, 2] });
    await db
      .update(PIECES)
      .set({ received: uploadPiecesWithout(PIECES.received, 1) })
      .where(eq(PIECES.id, 'without'));

    await expect(receivedOf('without')).resolves.toStrictEqual([0, 2]);
  });

  it('leaves the pieces alone when that one never arrived', async () => {
    await db.insert(PIECES).values({ id: 'absent', received: [4] });
    await db
      .update(PIECES)
      .set({ received: uploadPiecesWithout(PIECES.received, 9) })
      .where(eq(PIECES.id, 'absent'));

    await expect(receivedOf('absent')).resolves.toStrictEqual([4]);
  });
});
