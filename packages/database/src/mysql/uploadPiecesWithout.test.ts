import { eq, sql } from 'drizzle-orm';
import { json, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { beforeAll, describe, expect, it } from 'vitest';
import { aPlayground } from './aPlayground';
import { uploadPiecesWithout } from './uploadPiecesWithout';
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

  it('empties the pieces when the last one goes', async () => {
    await db.insert(PIECES).values({ id: 'last', received: [7] });
    await db
      .update(PIECES)
      .set({ received: uploadPiecesWithout(PIECES.received, 7) })
      .where(eq(PIECES.id, 'last'));

    await expect(receivedOf('last')).resolves.toStrictEqual([]);
  });
});
