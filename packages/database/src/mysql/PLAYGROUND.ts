import {
  datetime,
  int,
  json,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

const PLAYGROUND = mysqlTable(
  'playground',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    note: text('note'),
    count: int('count').notNull().default(0),
    tags: json('tags').$type<string[]>(),
    people: json('people').$type<{ name: string; age: number }[]>(),
    startedAt: datetime('startedAt', { mode: 'date', fsp: 3 }),
    endedAt: datetime('endedAt', { mode: 'date', fsp: 3 }),
  },
  (table) => [uniqueIndex('playground_name_idx').on(table.name)],
);

export { PLAYGROUND };
