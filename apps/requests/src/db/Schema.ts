import { boolean, integer, jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { IndexerCapabilities } from '@ValenceContracts/schemas/Indexer';

const requestsSchema = pgSchema('valence_requests');

const setting = requestsSchema.table('setting', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const indexer = requestsSchema.table('indexer', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['torznab', 'newznab'] }).notNull(),
  url: text('url').notNull(),
  apiKey: text('api_key').notNull().default(''),
  priority: integer('priority').notNull().default(25),
  isEnabled: boolean('is_enabled').notNull().default(true),
  categories: jsonb('categories').$type<number[]>().notNull().default([]),
  requestsPerMinute: integer('requests_per_minute'),
  timeoutSeconds: integer('timeout_seconds').notNull().default(30),
  capabilities: jsonb('capabilities').$type<IndexerCapabilities>(),
  failures: integer('failures').notNull().default(0),
  lastProblem: text('last_problem'),
  lastFailedAt: timestamp('last_failed_at', { withTimezone: true }),
  turnedOffBecause: text('turned_off_because'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export { indexer, requestsSchema, setting };
