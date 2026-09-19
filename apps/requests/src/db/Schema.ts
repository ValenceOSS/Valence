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
import {
  DEFAULT_DOWNLOAD_CATEGORIES,
  DOWNLOAD_CLIENT_KINDS,
} from '@ValenceContracts/schemas/DownloadClient';
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import {
  MUSIC_QUALITIES,
  RELEASE_SOURCES,
  RESOLUTIONS,
} from '@ValenceContracts/schemas/ParsedRelease';
import { PROFILE_KINDS } from '@ValenceContracts/schemas/QualityProfile';
import type {
  MusicQuality,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';
import type { DownloadCategories } from '@ValenceContracts/schemas/DownloadClient';
import { QUEUED_DOWNLOAD_STATES } from '@ValenceContracts/schemas/DownloadQueue';
import type { IndexerCapabilities, IndexerSettings } from '@ValenceContracts/schemas/Indexer';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import {
  MEDIA_REQUEST_KINDS,
  RELEASE_WAITS,
  REQUEST_APPROVALS,
  REQUEST_ITEM_STATES,
} from '@ValenceContracts/schemas/MediaRequest';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
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
  categories: jsonb('categories')
    .$type<DownloadCategories>()
    .notNull()
    .default(DEFAULT_DOWNLOAD_CATEGORIES),
  remotePath: text('remote_path').notNull().default(''),
  localPath: text('local_path').notNull().default(''),
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
    contentPath: text('content_path'),
    protocol: text('protocol', { enum: ['torrent', 'usenet'] }).notNull(),
    libraryKind: text('library_kind', { enum: LIBRARY_KINDS }).notNull().default('movies'),
    title: text('title').notNull(),
    indexerName: text('indexer_name'),
    state: text('state', { enum: QUEUED_DOWNLOAD_STATES }).notNull().default('queued'),
    problem: text('problem'),
    progress: doublePrecision('progress').notNull().default(0),
    sizeBytes: doublePrecision('size_bytes'),
    doneBytes: doublePrecision('done_bytes'),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    libraryId: text('library_id'),
    libraryPath: text('library_path'),
    filedInto: text('filed_into'),
    filingProblem: text('filing_problem'),
    filingAttempts: integer('filing_attempts').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('download_client_remote').on(table.clientId, table.remoteId)],
);

const serviceEvent = requestsSchema.table('download_event', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  clientName: text('client_name'),
  problem: text('problem'),
  details: jsonb('details').$type<Record<string, JsonValue>>().notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

const qualityProfile = requestsSchema.table('quality_profile', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: PROFILE_KINDS }).notNull(),
  resolutions: jsonb('resolutions').$type<Resolution[]>().notNull().default([]),
  sources: jsonb('sources').$type<ReleaseSource[]>().notNull().default([]),
  musicQualities: jsonb('music_qualities').$type<MusicQuality[]>().notNull().default([]),
  smallestMb: doublePrecision('smallest_mb'),
  largestMb: doublePrecision('largest_mb'),
  preferredWords: jsonb('preferred_words').$type<string[]>().notNull().default([]),
  requiredWords: jsonb('required_words').$type<string[]>().notNull().default([]),
  bannedWords: jsonb('banned_words').$type<string[]>().notNull().default([]),
  isUpgrading: boolean('is_upgrading').notNull().default(false),
  upgradeUntilResolution: text('upgrade_until_resolution', { enum: RESOLUTIONS }),
  upgradeUntilSource: text('upgrade_until_source', { enum: RELEASE_SOURCES }),
  upgradeUntilMusicQuality: text('upgrade_until_music_quality', { enum: MUSIC_QUALITIES }),
  libraryIds: jsonb('library_ids').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const mediaRequest = requestsSchema.table(
  'media_request',
  {
    id: uuid('id').primaryKey(),
    kind: text('kind', { enum: MEDIA_REQUEST_KINDS }).notNull(),
    tmdbId: integer('tmdb_id').notNull(),
    title: text('title').notNull(),
    year: integer('year'),
    aliases: jsonb('aliases').$type<string[]>().notNull().default([]),
    overview: text('overview'),
    posterUrl: text('poster_url'),
    libraryId: text('library_id').notNull(),
    libraryPath: text('library_path').notNull(),
    profileId: uuid('profile_id'),
    approval: text('approval', { enum: REQUEST_APPROVALS }).notNull().default('awaiting'),
    refusedBecause: text('refused_because'),
    requestedById: text('requested_by_id').notNull(),
    requestedByName: text('requested_by_name').notNull(),
    seasons: jsonb('seasons').$type<number[]>(),
    waitFor: text('wait_for', { enum: RELEASE_WAITS }).notNull().default('digital'),
    runtimeMinutes: integer('runtime_minutes'),
    releaseDates: jsonb('release_dates')
      .$type<RequestCatalogue['releaseDates']>()
      .notNull()
      .default({ theatrical: null, digital: null, physical: null }),
    isEnded: boolean('is_ended').notNull().default(false),
    mediaId: text('media_id'),
    problem: text('problem'),
    catalogueCheckedAt: timestamp('catalogue_checked_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('media_request_title').on(table.kind, table.tmdbId)],
);

const requestItem = requestsSchema.table(
  'request_item',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => mediaRequest.id, { onDelete: 'cascade' }),
    season: integer('season'),
    episode: integer('episode'),
    title: text('title').notNull(),
    airDate: text('air_date'),
    state: text('state', { enum: REQUEST_ITEM_STATES }).notNull().default('waiting'),
    problem: text('problem'),
    releaseTitle: text('release_title'),
    indexerId: uuid('indexer_id'),
    downloadId: uuid('download_id').references(() => sentDownload.id, { onDelete: 'set null' }),
    filePath: text('file_path'),
    score: doublePrecision('score'),
    filedTitle: text('filed_title'),
    filedScore: doublePrecision('filed_score'),
    attempts: integer('attempts').notNull().default(0),
    lastSearchedAt: timestamp('last_searched_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('request_item_episode').on(table.requestId, table.season, table.episode)],
);

const blocklistedRelease = requestsSchema.table(
  'blocklisted_release',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => mediaRequest.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    indexerId: uuid('indexer_id'),
    reason: text('reason').notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('blocklisted_release_title').on(table.requestId, table.title)],
);

export {
  blocklistedRelease,
  mediaRequest,
  qualityProfile,
  requestItem,
  downloadClient,
  serviceEvent,
  indexer,
  indexerDefinition,
  requestsSchema,
  sentDownload,
  setting,
};
