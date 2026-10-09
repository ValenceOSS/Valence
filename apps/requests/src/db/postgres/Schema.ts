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
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import { ARR_APP_KINDS } from '@ValenceContracts/schemas/ArrApp';
import type { Fulfilment } from '@ValenceContracts/schemas/ArrApp';
import type { Said } from '@ValenceI18n/SaidSchema';
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
import {
  PROFILE_KINDS,
  RELEASE_WAITS,
  VIDEO_QUALITY_IDS,
} from '@ValenceContracts/schemas/QualityProfile';
import type {
  CustomFormat,
  QualitySize,
  VideoQualityId,
} from '@ValenceContracts/schemas/QualityProfile';
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
  BOOK_FORMATS,
  MEDIA_REQUEST_KINDS,
  REQUEST_APPROVALS,
  REQUEST_ITEM_STATES,
} from '@ValenceContracts/schemas/MediaRequest';
import type {
  BookFormat,
  Narration,
  ReleaseType,
  RequestCatalogue,
  ProfileAsk,
  Requester,
  SeasonFolder,
} from '@ValenceContracts/schemas/MediaRequest';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';

const requestsSchema = pgSchema('valence_requests');

const setting = requestsSchema.table('setting', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const giveUpRules = requestsSchema.table('give_up_rules', {
  id: integer('id').primaryKey().default(1),
  metadataMinutes: integer('metadata_minutes'),
  stalledHours: integer('stalled_hours'),
  slowDays: integer('slow_days'),
  refusesUnknownFiles: boolean('refuses_unknown_files').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const indexer = requestsSchema.table(
  'indexer',
  {
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
    removesWhenDone: boolean('removes_when_done'),
    seedSeconds: integer('seed_seconds'),
    seedRatio: doublePrecision('seed_ratio'),
    capabilities: jsonb('capabilities').$type<IndexerCapabilities>(),
    failures: integer('failures').notNull().default(0),
    lastProblem: jsonb('last_problem').$type<Said>(),
    lastProblemCode: text('last_problem_code').$type<ProblemCode>(),
    lastFailedAt: timestamp('last_failed_at', { withTimezone: true }),
    turnedOffBecause: jsonb('turned_off_because').$type<Said>(),
    sourceAppId: uuid('source_app_id'),
    sourceIndexerId: integer('source_indexer_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('indexer_source').on(table.sourceAppId, table.sourceIndexerId)],
);

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

const arrApp = requestsSchema.table('arr_app', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ARR_APP_KINDS }).notNull(),
  url: text('url').notNull(),
  apiKey: text('api_key').notNull().default(''),
  remotePath: text('remote_path').notNull().default(''),
  localPath: text('local_path').notNull().default(''),
  isEnabled: boolean('is_enabled').notNull().default(true),
  isWorking: boolean('is_working'),
  version: text('version'),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  lastProblem: jsonb('last_problem').$type<Said>(),
  lastProblemCode: text('last_problem_code').$type<ProblemCode>(),
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
    problem: jsonb('problem').$type<Said>(),
    problemCode: text('problem_code').$type<ProblemCode>(),
    progress: doublePrecision('progress').notNull().default(0),
    sizeBytes: doublePrecision('size_bytes'),
    doneBytes: doublePrecision('done_bytes'),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    libraryId: text('library_id'),
    libraryPath: text('library_path'),
    filedInto: text('filed_into'),
    filingProblem: jsonb('filing_problem').$type<Said>(),
    filingProblemCode: text('filing_problem_code').$type<ProblemCode>(),
    filingAttempts: integer('filing_attempts').notNull().default(0),
    filesChecked: boolean('files_checked').notNull().default(false),
    removesWhenDone: boolean('removes_when_done').notNull().default(false),
    wasPaused: boolean('was_paused').notNull().default(false),
    seedSeconds: integer('seed_seconds'),
    seedRatio: doublePrecision('seed_ratio'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('download_client_remote').on(table.clientId, table.remoteId)],
);

const serviceEvent = requestsSchema.table('download_event', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  clientName: text('client_name'),
  problem: jsonb('problem').$type<Said>(),
  details: jsonb('details').$type<Record<string, JsonValue>>().notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

const qualityProfile = requestsSchema.table('quality_profile', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: PROFILE_KINDS }).notNull(),
  resolutions: jsonb('resolutions').$type<Resolution[]>().notNull().default([]),
  sources: jsonb('sources').$type<ReleaseSource[]>().notNull().default([]),
  qualities: jsonb('qualities').$type<VideoQualityId[]>(),
  musicQualities: jsonb('music_qualities').$type<MusicQuality[]>().notNull().default([]),
  smallestMb: doublePrecision('smallest_mb'),
  largestMb: doublePrecision('largest_mb'),
  sizes: jsonb('sizes').$type<QualitySize[]>().notNull().default([]),
  preferredWords: jsonb('preferred_words').$type<string[]>().notNull().default([]),
  requiredWords: jsonb('required_words').$type<string[]>().notNull().default([]),
  bannedWords: jsonb('banned_words').$type<string[]>().notNull().default([]),
  formats: jsonb('formats').$type<CustomFormat[]>().notNull().default([]),
  minFormatScore: integer('min_format_score').notNull().default(0),
  upgradeUntilFormatScore: integer('upgrade_until_format_score'),
  isUpgrading: boolean('is_upgrading').notNull().default(false),
  releaseWait: text('release_wait', { enum: RELEASE_WAITS }).notNull().default('digital'),
  upgradeUntilResolution: text('upgrade_until_resolution', { enum: RESOLUTIONS }),
  upgradeUntilSource: text('upgrade_until_source', { enum: RELEASE_SOURCES }),
  cutoff: text('cutoff', { enum: VIDEO_QUALITY_IDS }),
  upgradeUntilMusicQuality: text('upgrade_until_music_quality', { enum: MUSIC_QUALITIES }),
  libraryIds: jsonb('library_ids').$type<string[]>().notNull().default([]),
  preferredLanguage: text('preferred_language'),
  isDefault: boolean('is_default').notNull().default(false),
  position: integer('position').notNull().default(0),
  roleIds: jsonb('role_ids').$type<string[]>().notNull().default([]),
  accountIds: jsonb('account_ids').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const mediaRequest = requestsSchema.table(
  'media_request',
  {
    id: uuid('id').primaryKey(),
    kind: text('kind', { enum: MEDIA_REQUEST_KINDS }).notNull(),
    tmdbId: integer('tmdb_id'),
    tvdbId: integer('tvdb_id'),
    imdbId: text('imdb_id'),
    musicBrainzId: text('music_brainz_id'),
    openLibraryId: integer('open_library_id'),
    title: text('title').notNull(),
    artistName: text('artist_name'),
    year: integer('year'),
    aliases: jsonb('aliases').$type<string[]>().notNull().default([]),
    overview: text('overview'),
    posterUrl: text('poster_url'),
    libraryId: text('library_id').notNull(),
    libraryPath: text('library_path').notNull(),
    libraryFolder: text('library_folder'),
    seasonFolders: jsonb('season_folders').$type<SeasonFolder[]>().notNull().default([]),
    profileId: uuid('profile_id'),
    libraryLanguage: text('library_language'),
    isPickedByHand: boolean('is_picked_by_hand').notNull().default(false),
    approval: text('approval', { enum: REQUEST_APPROVALS }).notNull().default('awaiting'),
    refusedBecause: jsonb('refused_because').$type<Said>(),
    requestedById: text('requested_by_id').notNull(),
    requestedByName: text('requested_by_name').notNull(),
    alsoAskedBy: jsonb('also_asked_by').$type<Requester[]>().notNull().default([]),
    profileAsk: jsonb('profile_ask').$type<ProfileAsk>(),
    seasons: jsonb('seasons').$type<number[]>(),
    followsNewSeasons: boolean('follows_new_seasons').notNull().default(false),
    followsAfter: integer('follows_after'),
    releaseTypes: jsonb('release_types').$type<ReleaseType[]>(),
    upgradesToLossless: boolean('upgrades_to_lossless').notNull().default(false),
    bookFormats: jsonb('book_formats').$type<BookFormat[]>(),
    narrations: jsonb('narrations').$type<Narration[]>(),
    narrationsWanted: jsonb('narrations_wanted').$type<string[]>(),
    versions: jsonb('versions').$type<string[]>(),
    runtimeMinutes: integer('runtime_minutes'),
    releaseDates: jsonb('release_dates')
      .$type<RequestCatalogue['releaseDates']>()
      .notNull()
      .default({ theatrical: null, digital: null, physical: null }),
    isEnded: boolean('is_ended').notNull().default(false),
    mediaId: text('media_id'),
    handOff: jsonb('hand_off').$type<Fulfilment>(),
    handOffId: integer('hand_off_id'),
    problem: jsonb('problem').$type<Said>(),
    problemCode: text('problem_code').$type<ProblemCode>(),
    catalogueCheckedAt: timestamp('catalogue_checked_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('media_request_title').on(table.kind, table.tmdbId),
    unique('media_request_music').on(table.kind, table.musicBrainzId),
    unique('media_request_book').on(table.kind, table.openLibraryId),
  ],
);

const requestItem = requestsSchema.table(
  'request_item',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => mediaRequest.id, { onDelete: 'cascade' }),
    musicBrainzId: text('music_brainz_id'),
    season: integer('season'),
    episode: integer('episode'),
    format: text('format', { enum: BOOK_FORMATS }),
    versionProfileId: uuid('version_profile_id'),
    title: text('title').notNull(),
    airDate: text('air_date'),
    state: text('state', { enum: REQUEST_ITEM_STATES }).notNull().default('waiting'),
    problem: jsonb('problem').$type<Said>(),
    problemCode: text('problem_code').$type<ProblemCode>(),
    releaseTitle: text('release_title'),
    indexerId: uuid('indexer_id'),
    downloadId: uuid('download_id').references(() => sentDownload.id, { onDelete: 'set null' }),
    filePath: text('file_path'),
    score: doublePrecision('score'),
    filedTitle: text('filed_title'),
    filedScore: doublePrecision('filed_score'),
    downloadedBytes: doublePrecision('downloaded_bytes'),
    downloadSeconds: doublePrecision('download_seconds'),
    attempts: integer('attempts').notNull().default(0),
    isPickedByHand: boolean('is_picked_by_hand').notNull().default(false),
    isFollowed: boolean('is_followed').notNull().default(true),
    trackCount: integer('track_count'),
    filedTrackCount: integer('filed_track_count'),
    heldQuality: text('held_quality').$type<MusicQuality>(),
    narration: text('narration'),
    filedMinutes: doublePrecision('filed_minutes'),
    lastSearchedAt: timestamp('last_searched_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('request_item_episode').on(table.requestId, table.season, table.episode),
    unique('request_item_album').on(table.requestId, table.musicBrainzId),
  ],
);

const blocklistedRelease = requestsSchema.table(
  'blocklisted_release',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => mediaRequest.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    infoHash: text('info_hash'),
    indexerId: uuid('indexer_id'),
    reason: jsonb('reason').$type<Said>().notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('blocklisted_release_title').on(table.requestId, table.title)],
);

const requestLog = requestsSchema.table('request_log', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  requestId: uuid('request_id')
    .notNull()
    .references(() => mediaRequest.id, { onDelete: 'cascade' }),
  message: jsonb('message').$type<Said>().notNull(),
  problemCode: text('problem_code').$type<ProblemCode>(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

export {
  arrApp,
  requestLog,
  blocklistedRelease,
  mediaRequest,
  qualityProfile,
  requestItem,
  downloadClient,
  giveUpRules,
  serviceEvent,
  indexer,
  indexerDefinition,
  requestsSchema,
  sentDownload,
  setting,
};
