import type { MySqlDatabase } from 'drizzle-orm/mysql-core';
import type { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from 'drizzle-orm/mysql2';

type AnyDatabase = MySqlDatabase<
  MySql2QueryResultHKT,
  MySql2PreparedQueryHKT,
  Record<string, object>
>;

export type { AnyDatabase };
