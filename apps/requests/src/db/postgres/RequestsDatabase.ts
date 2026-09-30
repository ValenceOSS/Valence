import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { REQUESTS_SCHEMA } from '@ValenceRequests/db/postgres/REQUESTS_SCHEMA';

type RequestsDatabase = PgDatabase<PgQueryResultHKT, typeof REQUESTS_SCHEMA>;

export type { RequestsDatabase };
