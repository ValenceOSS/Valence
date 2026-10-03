import { eq, sql } from 'drizzle-orm';
import { binary, int, mysqlTable, unique, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { incoming } from './incoming';
import { upsert } from './upsert';
import type { AnyDatabase } from './AnyDatabase';

const KEYED = mysqlTable(
  'keyed',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    email: varchar('email', { length: 64 }),
    code: varchar('code', { length: 64 }).unique(),
    shelf: varchar('shelf', { length: 64 }),
    slot: int('slot'),
    count: int('count').notNull().default(0),
  },
  (table) => [
    uniqueIndex('keyed_email_idx').on(table.email),
    unique('keyed_place').on(table.shelf, table.slot),
  ],
);

const HASHED = mysqlTable(
  'hashed',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    shelf: varchar('shelf', { length: 64 }).notNull(),
    path: varchar('path', { length: 4096 }).notNull(),
    pathHash: binary('pathHash', { length: 32 }).generatedAlwaysAs(sql`unhex(sha2(path, 256))`, {
      mode: 'stored',
    }),
    count: int('count').notNull().default(0),
  },
  (table) => [uniqueIndex('hashed_path_idx').on(table.shelf, table.pathHash)],
);

const PLAIN = mysqlTable('plain', {
  id: varchar('id', { length: 64 }).primaryKey(),
  count: int('count').notNull().default(0),
});

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.execute(
    sql`create table ${KEYED} (id varchar(64) primary key, email varchar(64), code varchar(64) unique, shelf varchar(64), slot int, count int not null default 0, unique index keyed_email_idx (email), unique keyed_place (shelf, slot))`,
  );
  await db.execute(
    sql`create table ${PLAIN} (id varchar(64) primary key, count int not null default 0)`,
  );
  await db.execute(
    sql`create table ${HASHED} (id varchar(64) primary key, shelf varchar(64) not null, path varchar(4096) not null, pathHash binary(32) generated always as (unhex(sha2(path, 256))) stored, count int not null default 0, unique index hashed_path_idx (shelf, pathHash))`,
  );
}, 30_000);

describe('upsert', () => {
  it('writes a row that is not there yet', async () => {
    await upsert(db, PLAYGROUND, {
      values: [{ id: 'one', name: 'Upsert new', count: 1 }],
      target: PLAYGROUND.name,
      set: { count: 2 },
    });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Upsert new')),
    ).resolves.toMatchObject([{ id: 'one', count: 1 }]);
  });

  it('changes the row already holding the key, rather than adding another', async () => {
    await upsert(db, PLAYGROUND, {
      values: [{ id: 'two', name: 'Upsert twice', count: 1 }],
      target: PLAYGROUND.name,
      set: { count: 1 },
    });
    await upsert(db, PLAYGROUND, {
      values: [{ id: 'three', name: 'Upsert twice', count: 5 }],
      target: PLAYGROUND.name,
      set: { count: sql`${PLAYGROUND.count} + ${incoming(PLAYGROUND.count)}` },
    });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Upsert twice')),
    ).resolves.toMatchObject([{ id: 'two', count: 6 }]);
  });

  it('honours a partial key given with its condition', async () => {
    await upsert(db, PLAYGROUND, {
      values: [{ id: 'four', name: 'Upsert partial' }],
      target: PLAYGROUND.name,
      set: { note: 'kept' },
      targetWhere: sql`true`,
    });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Upsert partial')),
    ).resolves.toHaveLength(1);
  });

  it('writes by a key when every other key is left empty on the rows', async () => {
    await upsert(db, KEYED, {
      values: [{ id: 'k1', email: 'one@example.com', count: 1 }],
      target: KEYED.email,
      set: { count: sql`${KEYED.count} + ${incoming(KEYED.count)}` },
    });
    await upsert(db, KEYED, {
      values: [{ id: 'k2', email: 'one@example.com', count: 4 }],
      target: KEYED.email,
      set: { count: sql`${KEYED.count} + ${incoming(KEYED.count)}` },
    });

    await expect(db.select().from(KEYED)).resolves.toMatchObject([{ id: 'k1', count: 5 }]);
  });

  it('writes by a key made of several columns, in any order', async () => {
    await upsert(db, KEYED, {
      values: [{ id: 'k3', shelf: 'top', slot: 1 }],
      target: [KEYED.slot, KEYED.shelf],
      set: { count: 9 },
    });

    await expect(db.select().from(KEYED).where(eq(KEYED.id, 'k3'))).resolves.toMatchObject([
      { shelf: 'top', slot: 1 },
    ]);
  });

  it('writes by the primary key where it is the only key', async () => {
    await upsert(db, PLAIN, {
      values: [{ id: 'p', count: 1 }],
      target: PLAIN.id,
      set: { count: 2 },
    });
    await upsert(db, PLAIN, {
      values: [{ id: 'p', count: 1 }],
      target: PLAIN.id,
      set: { count: 2 },
    });

    await expect(db.select().from(PLAIN)).resolves.toEqual([{ id: 'p', count: 2 }]);
  });

  it('refuses rows that could clash on another key, which MySQL would change instead', async () => {
    await expect(
      upsert(db, KEYED, {
        values: [{ id: 'k4', email: 'two@example.com', code: 'x' }],
        target: KEYED.email,
        set: { count: 1 },
      }),
    ).rejects.toThrow('could also clash on (code)');
    await expect(
      upsert(db, PLAYGROUND, {
        values: [{ id: 'one', name: 'By id' }],
        target: PLAYGROUND.id,
        set: { count: 1 },
      }),
    ).rejects.toThrow('could also clash on (name)');
  });

  it('writes by a key where the caller vouches every other key it fills names the same row', async () => {
    await upsert(db, KEYED, {
      values: [{ id: 'k9', code: 'k9-code' }],
      target: KEYED.id,
      set: { count: 1 },
      sameRowOn: [[KEYED.code]],
    });
    await upsert(db, KEYED, {
      values: [{ id: 'k9', code: 'k9-code' }],
      target: KEYED.id,
      set: { count: 2 },
      sameRowOn: [[KEYED.code]],
    });

    await expect(db.select().from(KEYED).where(eq(KEYED.id, 'k9'))).resolves.toMatchObject([
      { code: 'k9-code', count: 2 },
    ]);
    await expect(
      upsert(db, KEYED, {
        values: [{ id: 'k10', code: 'k10-code', email: 'ten@example.com' }],
        target: KEYED.id,
        set: { count: 1 },
        sameRowOn: [[KEYED.code]],
      }),
    ).rejects.toThrow('could also clash on (email)');
  });

  it('refuses a target that is not a key of the table', async () => {
    await expect(
      upsert(db, KEYED, {
        values: [{ id: 'k5', email: 'three@example.com' }],
        target: KEYED.count,
        set: { count: 1 },
      }),
    ).rejects.toThrow('not one of its unique keys');
    await expect(
      upsert(db, KEYED, {
        values: [{ id: 'k6', email: 'four@example.com' }],
        target: sql`lower(${KEYED.email})`,
        set: { count: 1 },
      }),
    ).rejects.toThrow('can only be keyed by columns');
  });

  it('reads a key on a hash of a long column as the key on that column', async () => {
    const path = `/${'deep/'.repeat(300)}film.mkv`;

    await upsert(db, HASHED, {
      values: [{ id: 'h1', shelf: 'films', path }],
      target: [HASHED.shelf, HASHED.path],
      set: { count: sql`${HASHED.count} + 1` },
    });
    await upsert(db, HASHED, {
      values: [{ id: 'h2', shelf: 'films', path }],
      target: [HASHED.shelf, HASHED.path],
      set: { count: sql`${HASHED.count} + 1` },
    });

    await expect(db.select({ id: HASHED.id, count: HASHED.count }).from(HASHED)).resolves.toEqual([
      { id: 'h1', count: 1 },
    ]);
  });
});
