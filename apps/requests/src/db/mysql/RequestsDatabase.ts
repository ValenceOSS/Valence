import type { MySqlDatabase } from 'drizzle-orm/mysql-core';
import type { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from 'drizzle-orm/mysql2';
import type { REQUESTS_SCHEMA } from '@ValenceRequests/db/mysql/REQUESTS_SCHEMA';

type RequestsDatabase = MySqlDatabase<
  MySql2QueryResultHKT,
  MySql2PreparedQueryHKT,
  typeof REQUESTS_SCHEMA
>;

export type { RequestsDatabase };
