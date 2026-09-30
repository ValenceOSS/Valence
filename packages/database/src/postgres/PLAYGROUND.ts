import { integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

const PLAYGROUND = pgTable(
  'playground',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    note: text('note'),
    count: integer('count').notNull().default(0),
    tags: jsonb('tags').$type<string[]>(),
    people: jsonb('people').$type<{ name: string; age: number }[]>(),
    startedAt: timestamp('startedAt'),
    endedAt: timestamp('endedAt'),
  },
  (table) => [uniqueIndex('playground_name_idx').on(table.name)],
);

export { PLAYGROUND };
