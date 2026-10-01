import type { MySqlDatabase } from 'drizzle-orm/mysql-core';
import type { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from 'drizzle-orm/mysql2';
import type { ValenceSchema } from '@ValenceServer/db/mysql/ValenceSchema';

type AnyValenceDatabase = MySqlDatabase<
  MySql2QueryResultHKT,
  MySql2PreparedQueryHKT,
  ValenceSchema
>;

export type { AnyValenceDatabase };
