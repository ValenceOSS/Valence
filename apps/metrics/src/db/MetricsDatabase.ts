import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { dailyInstalls, installs } from './Schema';

type MetricsSchema = {
  installs: typeof installs;
  dailyInstalls: typeof dailyInstalls;
};

type MetricsDatabase = PgDatabase<PgQueryResultHKT, MetricsSchema>;

export type { MetricsDatabase, MetricsSchema };
