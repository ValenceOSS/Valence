import { sql } from 'drizzle-orm';
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { beforeAll, describe, expect, it } from 'vitest';
import { aPlayground } from './aPlayground';
import { insertForNewId } from './insertForNewId';
import type { AnyDatabase } from './AnyDatabase';

const NUMBERED = mysqlTable('numbered', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 64 }).notNull(),
});

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.execute(
    sql`create table ${NUMBERED} (${sql.identifier('id')} int primary key auto_increment, ${sql.identifier('name')} varchar(64) not null)`,
  );
}, 30_000);

describe('insertForNewId', () => {
  it('hands back the id the database gave each new row', async () => {
    const first = await insertForNewId(db, NUMBERED, { name: 'first' }, NUMBERED.id);
    const second = await insertForNewId(db, NUMBERED, { name: 'second' }, NUMBERED.id);

    expect(second).toBe(first + 1);
  });

  it('refuses a column the database does not number', async () => {
    await expect(insertForNewId(db, NUMBERED, { name: 'third' }, NUMBERED.name)).rejects.toThrow(
      'name is not one',
    );
  });
});
