import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { ValenceSchema } from '@ValenceServer/db/postgres/ValenceSchema';

type AnyValenceDatabase = PgDatabase<PgQueryResultHKT, ValenceSchema>;

export type { AnyValenceDatabase };
