import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { beforeAll, describe, expect, it } from 'vitest';
import { insertForNewId } from './insertForNewId';
import type { AnyDatabase } from './AnyDatabase';

const NUMBERED = pgTable('numbered', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
});

let db: AnyDatabase;

beforeAll(async () => {
  const client = new PGlite();

  await client.exec(
    'CREATE TABLE "numbered" ("id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY, "name" text NOT NULL);',
  );
  db = drizzle(client);
}, 30_000);

describe('insertForNewId', () => {
  it('hands back the id the database gave each new row', async () => {
    const first = await insertForNewId(db, NUMBERED, { name: 'first' }, NUMBERED.id);
    const second = await insertForNewId(db, NUMBERED, { name: 'second' }, NUMBERED.id);

    expect(second).toBe(first + 1);
  });
});
