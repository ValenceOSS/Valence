import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { DOWNLOAD_CLIENT_KINDS } from '@ValenceContracts/schemas/DownloadClient';
import { QUEUED_DOWNLOAD_STATES } from '@ValenceContracts/schemas/DownloadQueue';
import type { IndexerCapabilities, IndexerSettings } from '@ValenceContracts/schemas/Indexer';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';

const requestsSchema = pgSchema('valence_requests');

const setting = requestsSchema.table('setting', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const indexer = requestsSchema.table('indexer', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['torznab', 'newznab', 'cardigann'] }).notNull(),
  definitionId: text('definition_id'),
  settings: jsonb('settings').$type<IndexerSettings>().notNull().default({}),
  session: jsonb('session').$type<SiteSession>(),
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

const indexerDefinition = requestsSchema.table('indexer_definition', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  language: text('language').notNull().default(''),
  privacy: text('privacy', { enum: ['public', 'semi-private', 'private'] }).notNull(),
  categories: jsonb('categories').$type<string[]>().notNull().default([]),
  yaml: text('yaml').notNull(),
  sha: text('sha').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
});

const downloadClient = requestsSchema.table('download_client', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: DOWNLOAD_CLIENT_KINDS }).notNull(),
  url: text('url').notNull(),
  username: text('username').notNull().default(''),
  password: text('password').notNull().default(''),
  apiKey: text('api_key').notNull().default(''),
  category: text('category').notNull().default('valence'),
  priority: integer('priority').notNull().default(25),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const sentDownload = requestsSchema.table(
  'download',
  {
    id: uuid('id').primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => downloadClient.id, { onDelete: 'cascade' }),
    remoteId: text('remote_id').notNull(),
    protocol: text('protocol', { enum: ['torrent', 'usenet'] }).notNull(),
    title: text('title').notNull(),
    indexerName: text('indexer_name'),
    state: text('state', { enum: QUEUED_DOWNLOAD_STATES }).notNull().default('queued'),
    problem: text('problem'),
    progress: doublePrecision('progress').notNull().default(0),
    sizeBytes: doublePrecision('size_bytes'),
    doneBytes: doublePrecision('done_bytes'),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('download_client_remote').on(table.clientId, table.remoteId)],
);

const downloadEvent = requestsSchema.table('download_event', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  kind: text('kind', { enum: ['started', 'failed'] }).notNull(),
  title: text('title').notNull(),
  clientName: text('client_name').notNull(),
  problem: text('problem'),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

export {
  downloadClient,
  downloadEvent,
  indexer,
  indexerDefinition,
  requestsSchema,
  sentDownload,
  setting,
};
