import { eq, sql } from 'drizzle-orm';
import { json, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { beforeAll, describe, expect, it } from 'vitest';
import { aPlayground } from './aPlayground';
import { uploadPiecesWith } from './uploadPiecesWith';
import type { AnyDatabase } from './AnyDatabase';

const PIECES = mysqlTable('pieces', {
  id: varchar('id', { length: 64 }).primaryKey(),
  received: json('received').$type<number[]>().notNull(),
});

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.execute(
    sql`create table ${PIECES} (${sql.identifier('id')} varchar(64) primary key, ${sql.identifier('received')} json not null)`,
  );
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

    for (const piece of [3, 1, 3, 2, 0, 10]) {
      await db
        .update(PIECES)
        .set({ received: uploadPiecesWith(PIECES.received, piece) })
        .where(eq(PIECES.id, 'with'));
    }

    await expect(receivedOf('with')).resolves.toStrictEqual([0, 1, 2, 3, 10]);
  });
});
