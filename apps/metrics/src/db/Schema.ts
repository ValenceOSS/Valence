import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  TELEMETRY_ARCHITECTURES,
  TELEMETRY_DATABASES,
  TELEMETRY_INSTALL_METHODS,
  TELEMETRY_MEMORY_BUCKETS,
  TELEMETRY_PLATFORMS,
} from '@ValenceContracts/schemas/TelemetryReport';
import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';

const installs = pgTable(
  'installs',
  {
    installId: uuid('install_id').primaryKey(),
    firstSeen: timestamp('first_seen', { withTimezone: true }).notNull(),
    lastSeen: timestamp('last_seen', { withTimezone: true }).notNull(),
    report: jsonb('report').$type<TelemetryReport>().notNull(),
    version: text('version').notNull(),
    installMethod: text('install_method', { enum: TELEMETRY_INSTALL_METHODS }).notNull(),
    platform: text('platform', { enum: TELEMETRY_PLATFORMS }).notNull(),
    arch: text('arch', { enum: TELEMETRY_ARCHITECTURES }).notNull(),
    cpuModel: text('cpu_model').notNull(),
    cores: integer('cores').notNull(),
    memoryGb: text('memory_gb', { enum: TELEMETRY_MEMORY_BUCKETS }).notNull(),
    database: text('database', { enum: TELEMETRY_DATABASES }).notNull(),
    gpus: jsonb('gpus').$type<TelemetryReport['gpus']>().notNull(),
    accels: jsonb('accels').$type<TelemetryReport['accels']>().notNull(),
    library: jsonb('library').$type<TelemetryReport['library']>().notNull(),
    clients: jsonb('clients').$type<TelemetryReport['clients']>().notNull(),
  },
  (table) => [index('installs_last_seen').on(table.lastSeen)],
);

const dailyInstalls = pgTable(
  'daily_installs',
  {
    day: date('day', { mode: 'string' }).notNull(),
    installId: uuid('install_id')
      .notNull()
      .references(() => installs.installId, { onDelete: 'cascade' }),
    version: text('version').notNull(),
  },
  (table) => [primaryKey({ columns: [table.day, table.installId] })],
);

export { dailyInstalls, installs };
