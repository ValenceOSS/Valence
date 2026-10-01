import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

type AnyDatabase = PgDatabase<PgQueryResultHKT, Record<string, object>>;

export type { AnyDatabase };
