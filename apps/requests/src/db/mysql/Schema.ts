import {
  boolean,
  char,
  double,
  foreignKey,
  int,
  mediumtext,
  mysqlTableCreator,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import { ARR_APP_KINDS } from '@ValenceContracts/schemas/ArrApp';
import type { Fulfilment } from '@ValenceContracts/schemas/ArrApp';
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
  ReleaseType,
  RequestCatalogue,
  ProfileAsk,
  Requester,
  SeasonFolder,
} from '@ValenceContracts/schemas/MediaRequest';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';
import type { Said } from '@ValenceI18n/SaidSchema';
import { EMPTY_TEXT } from '@ValenceDatabase/mysql/columns/EMPTY_TEXT';
import { jsonColumn } from '@ValenceDatabase/mysql/columns/jsonColumn';
import { jsonDefault } from '@ValenceDatabase/mysql/columns/jsonDefault';
import { moment } from '@ValenceDatabase/mysql/columns/moment';
import { momentNow } from '@ValenceDatabase/mysql/columns/momentNow';

const requestsSchema = mysqlTableCreator((name) => `requests_${name}`);

const setting = requestsSchema('setting', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: jsonColumn('value').notNull(),
  updatedAt: momentNow('updated_at').notNull(),
});

const giveUpRules = requestsSchema('give_up_rules', {
  id: int('id').primaryKey().default(1),
  metadataMinutes: int('metadata_minutes'),
  stalledHours: int('stalled_hours'),
  slowDays: int('slow_days'),
  refusesUnknownFiles: boolean('refuses_unknown_files').notNull().default(true),
  updatedAt: momentNow('updated_at').notNull(),
});

const indexer = requestsSchema(
  'indexer',
  {
    id: char('id', { length: 36 }).primaryKey(),
    name: mediumtext('name').notNull(),
    kind: varchar('kind', { length: 32, enum: ['torznab', 'newznab', 'cardigann'] }).notNull(),
    definitionId: varchar('definition_id', { length: 255 }),
    settings: jsonColumn('settings').$type<IndexerSettings>().notNull().default(jsonDefault({})),
    session: jsonColumn('session').$type<SiteSession>(),
    url: mediumtext('url').notNull(),
    apiKey: mediumtext('api_key').notNull().default(EMPTY_TEXT),
    priority: int('priority').notNull().default(25),
    isEnabled: boolean('is_enabled').notNull().default(true),
    categories: jsonColumn('categories').$type<number[]>().notNull().default(jsonDefault([])),
    requestsPerMinute: int('requests_per_minute'),
    timeoutSeconds: int('timeout_seconds').notNull().default(30),
    removesWhenDone: boolean('removes_when_done'),
    seedSeconds: int('seed_seconds'),
    seedRatio: double('seed_ratio'),
    capabilities: jsonColumn('capabilities').$type<IndexerCapabilities>(),
    failures: int('failures').notNull().default(0),
    lastProblem: jsonColumn('last_problem').$type<Said>(),
    lastProblemCode: varchar('last_problem_code', { length: 64 }).$type<ProblemCode>(),
    lastFailedAt: moment('last_failed_at'),
    turnedOffBecause: jsonColumn('turned_off_because').$type<Said>(),
    sourceAppId: char('source_app_id', { length: 36 }),
    sourceIndexerId: int('source_indexer_id'),
    createdAt: momentNow('created_at').notNull(),
    updatedAt: momentNow('updated_at').notNull(),
  },
  (table) => [unique('indexer_source').on(table.sourceAppId, table.sourceIndexerId)],
);

const indexerDefinition = requestsSchema('indexer_definition', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: mediumtext('name').notNull(),
  description: mediumtext('description').notNull().default(EMPTY_TEXT),
  language: varchar('language', { length: 64 }).notNull().default(''),
  privacy: varchar('privacy', {
    length: 32,
    enum: ['public', 'semi-private', 'private'],
  }).notNull(),
  categories: jsonColumn('categories').$type<string[]>().notNull().default(jsonDefault([])),
  yaml: mediumtext('yaml').notNull(),
  sha: varchar('sha', { length: 64 }).notNull(),
  fetchedAt: momentNow('fetched_at').notNull(),
});

const downloadClient = requestsSchema('download_client', {
  id: char('id', { length: 36 }).primaryKey(),
  name: mediumtext('name').notNull(),
  kind: varchar('kind', { length: 32, enum: DOWNLOAD_CLIENT_KINDS }).notNull(),
  url: mediumtext('url').notNull(),
  username: mediumtext('username').notNull().default(EMPTY_TEXT),
  password: mediumtext('password').notNull().default(EMPTY_TEXT),
  apiKey: mediumtext('api_key').notNull().default(EMPTY_TEXT),
  categories: jsonColumn('categories')
    .$type<DownloadCategories>()
    .notNull()
    .default(jsonDefault(DEFAULT_DOWNLOAD_CATEGORIES)),
  remotePath: mediumtext('remote_path').notNull().default(EMPTY_TEXT),
  localPath: mediumtext('local_path').notNull().default(EMPTY_TEXT),
  priority: int('priority').notNull().default(25),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: momentNow('created_at').notNull(),
  updatedAt: momentNow('updated_at').notNull(),
});

const arrApp = requestsSchema('arr_app', {
  id: char('id', { length: 36 }).primaryKey(),
  name: mediumtext('name').notNull(),
  kind: varchar('kind', { length: 32, enum: ARR_APP_KINDS }).notNull(),
  url: mediumtext('url').notNull(),
  apiKey: mediumtext('api_key').notNull().default(EMPTY_TEXT),
  remotePath: mediumtext('remote_path').notNull().default(EMPTY_TEXT),
  localPath: mediumtext('local_path').notNull().default(EMPTY_TEXT),
  isEnabled: boolean('is_enabled').notNull().default(true),
  isWorking: boolean('is_working'),
  version: mediumtext('version'),
  lastCheckedAt: moment('last_checked_at'),
  lastProblem: jsonColumn('last_problem').$type<Said>(),
  lastProblemCode: varchar('last_problem_code', { length: 64 }).$type<ProblemCode>(),
  createdAt: momentNow('created_at').notNull(),
  updatedAt: momentNow('updated_at').notNull(),
});

const sentDownload = requestsSchema(
  'download',
  {
    id: char('id', { length: 36 }).primaryKey(),
    clientId: char('client_id', { length: 36 }).notNull(),
    remoteId: varchar('remote_id', { length: 255 }).notNull(),
    contentPath: mediumtext('content_path'),
    protocol: varchar('protocol', { length: 32, enum: ['torrent', 'usenet'] }).notNull(),
    libraryKind: varchar('library_kind', { length: 32, enum: LIBRARY_KINDS })
      .notNull()
      .default('movies'),
    title: mediumtext('title').notNull(),
    indexerName: mediumtext('indexer_name'),
    state: varchar('state', { length: 32, enum: QUEUED_DOWNLOAD_STATES })
      .notNull()
      .default('queued'),
    problem: jsonColumn('problem').$type<Said>(),
    problemCode: varchar('problem_code', { length: 64 }).$type<ProblemCode>(),
    progress: double('progress').notNull().default(0),
    sizeBytes: double('size_bytes'),
    doneBytes: double('done_bytes'),
    sentAt: momentNow('sent_at').notNull(),
    finishedAt: moment('finished_at'),
    libraryId: varchar('library_id', { length: 64 }),
    libraryPath: mediumtext('library_path'),
    filedInto: mediumtext('filed_into'),
    filingProblem: jsonColumn('filing_problem').$type<Said>(),
    filingProblemCode: varchar('filing_problem_code', { length: 64 }).$type<ProblemCode>(),
    filingAttempts: int('filing_attempts').notNull().default(0),
    filesChecked: boolean('files_checked').notNull().default(false),
    removesWhenDone: boolean('removes_when_done').notNull().default(false),
    seedSeconds: int('seed_seconds'),
    seedRatio: double('seed_ratio'),
    updatedAt: momentNow('updated_at').notNull(),
  },
  (table) => [
    unique('download_client_remote').on(table.clientId, table.remoteId),
    foreignKey({
      name: 'requests_download_client_id_fk',
      columns: [table.clientId],
      foreignColumns: [downloadClient.id],
    }).onDelete('cascade'),
  ],
);

const serviceEvent = requestsSchema('download_event', {
  id: int('id').primaryKey().autoincrement(),
  kind: varchar('kind', { length: 64 }).notNull(),
  title: mediumtext('title').notNull(),
  clientName: mediumtext('client_name'),
  problem: jsonColumn('problem').$type<Said>(),
  details: jsonColumn('details')
    .$type<Record<string, JsonValue>>()
    .notNull()
    .default(jsonDefault({})),
  at: momentNow('at').notNull(),
});

const qualityProfile = requestsSchema('quality_profile', {
  id: char('id', { length: 36 }).primaryKey(),
  name: mediumtext('name').notNull(),
  kind: varchar('kind', { length: 32, enum: PROFILE_KINDS }).notNull(),
  resolutions: jsonColumn('resolutions').$type<Resolution[]>().notNull().default(jsonDefault([])),
  sources: jsonColumn('sources').$type<ReleaseSource[]>().notNull().default(jsonDefault([])),
  qualities: jsonColumn('qualities').$type<VideoQualityId[]>(),
  musicQualities: jsonColumn('music_qualities')
    .$type<MusicQuality[]>()
    .notNull()
    .default(jsonDefault([])),
  smallestMb: double('smallest_mb'),
  largestMb: double('largest_mb'),
  sizes: jsonColumn('sizes').$type<QualitySize[]>().notNull().default(jsonDefault([])),
  preferredWords: jsonColumn('preferred_words')
    .$type<string[]>()
    .notNull()
    .default(jsonDefault([])),
  requiredWords: jsonColumn('required_words').$type<string[]>().notNull().default(jsonDefault([])),
  bannedWords: jsonColumn('banned_words').$type<string[]>().notNull().default(jsonDefault([])),
  formats: jsonColumn('formats').$type<CustomFormat[]>().notNull().default(jsonDefault([])),
  minFormatScore: int('min_format_score').notNull().default(0),
  upgradeUntilFormatScore: int('upgrade_until_format_score'),
  isUpgrading: boolean('is_upgrading').notNull().default(false),
  releaseWait: varchar('release_wait', { length: 32, enum: RELEASE_WAITS })
    .notNull()
    .default('digital'),
  upgradeUntilResolution: varchar('upgrade_until_resolution', { length: 32, enum: RESOLUTIONS }),
  upgradeUntilSource: varchar('upgrade_until_source', { length: 32, enum: RELEASE_SOURCES }),
  cutoff: varchar('cutoff', { length: 32, enum: VIDEO_QUALITY_IDS }),
  upgradeUntilMusicQuality: varchar('upgrade_until_music_quality', {
    length: 32,
    enum: MUSIC_QUALITIES,
  }),
  libraryIds: jsonColumn('library_ids').$type<string[]>().notNull().default(jsonDefault([])),
  preferredLanguage: varchar('preferred_language', { length: 64 }),
  isDefault: boolean('is_default').notNull().default(false),
  position: int('position').notNull().default(0),
  roleIds: jsonColumn('role_ids').$type<string[]>().notNull().default(jsonDefault([])),
  accountIds: jsonColumn('account_ids').$type<string[]>().notNull().default(jsonDefault([])),
  createdAt: momentNow('created_at').notNull(),
  updatedAt: momentNow('updated_at').notNull(),
});

const mediaRequest = requestsSchema(
  'media_request',
  {
    id: char('id', { length: 36 }).primaryKey(),
    kind: varchar('kind', { length: 32, enum: MEDIA_REQUEST_KINDS }).notNull(),
    tmdbId: int('tmdb_id'),
    tvdbId: int('tvdb_id'),
    imdbId: varchar('imdb_id', { length: 16 }),
    musicBrainzId: varchar('music_brainz_id', { length: 64 }),
    openLibraryId: int('open_library_id'),
    title: mediumtext('title').notNull(),
    artistName: mediumtext('artist_name'),
    year: int('year'),
    aliases: jsonColumn('aliases').$type<string[]>().notNull().default(jsonDefault([])),
    overview: mediumtext('overview'),
    posterUrl: mediumtext('poster_url'),
    libraryId: varchar('library_id', { length: 64 }).notNull(),
    libraryPath: mediumtext('library_path').notNull(),
    libraryFolder: mediumtext('library_folder'),
    seasonFolders: jsonColumn('season_folders')
      .$type<SeasonFolder[]>()
      .notNull()
      .default(jsonDefault([])),
    profileId: char('profile_id', { length: 36 }),
    libraryLanguage: varchar('library_language', { length: 64 }),
    isPickedByHand: boolean('is_picked_by_hand').notNull().default(false),
    approval: varchar('approval', { length: 32, enum: REQUEST_APPROVALS })
      .notNull()
      .default('awaiting'),
    refusedBecause: jsonColumn('refused_because').$type<Said>(),
    requestedById: varchar('requested_by_id', { length: 64 }).notNull(),
    requestedByName: mediumtext('requested_by_name').notNull(),
    alsoAskedBy: jsonColumn('also_asked_by')
      .$type<Requester[]>()
      .notNull()
      .default(jsonDefault([])),
    profileAsk: jsonColumn('profile_ask').$type<ProfileAsk>(),
    seasons: jsonColumn('seasons').$type<number[]>(),
    followsNewSeasons: boolean('follows_new_seasons').notNull().default(false),
    followsAfter: int('follows_after'),
    releaseTypes: jsonColumn('release_types').$type<ReleaseType[]>(),
    upgradesToLossless: boolean('upgrades_to_lossless').notNull().default(false),
    bookFormats: jsonColumn('book_formats').$type<BookFormat[]>(),
    versions: jsonColumn('versions').$type<string[]>(),
    runtimeMinutes: int('runtime_minutes'),
    releaseDates: jsonColumn('release_dates')
      .$type<RequestCatalogue['releaseDates']>()
      .notNull()
      .default(jsonDefault({ theatrical: null, digital: null, physical: null })),
    isEnded: boolean('is_ended').notNull().default(false),
    mediaId: varchar('media_id', { length: 64 }),
    handOff: jsonColumn('hand_off').$type<Fulfilment>(),
    handOffId: int('hand_off_id'),
    problem: jsonColumn('problem').$type<Said>(),
    problemCode: varchar('problem_code', { length: 64 }).$type<ProblemCode>(),
    catalogueCheckedAt: momentNow('catalogue_checked_at').notNull(),
    createdAt: momentNow('created_at').notNull(),
    updatedAt: momentNow('updated_at').notNull(),
  },
  (table) => [
    unique('media_request_title').on(table.kind, table.tmdbId),
    unique('media_request_music').on(table.kind, table.musicBrainzId),
    unique('media_request_book').on(table.kind, table.openLibraryId),
  ],
);

const requestItem = requestsSchema(
  'request_item',
  {
    id: char('id', { length: 36 }).primaryKey(),
    requestId: char('request_id', { length: 36 }).notNull(),
    musicBrainzId: varchar('music_brainz_id', { length: 64 }),
    season: int('season'),
    episode: int('episode'),
    format: varchar('format', { length: 16, enum: BOOK_FORMATS }),
    versionProfileId: char('version_profile_id', { length: 36 }),
    title: mediumtext('title').notNull(),
    airDate: varchar('air_date', { length: 32 }),
    state: varchar('state', { length: 32, enum: REQUEST_ITEM_STATES }).notNull().default('waiting'),
    problem: jsonColumn('problem').$type<Said>(),
    problemCode: varchar('problem_code', { length: 64 }).$type<ProblemCode>(),
    releaseTitle: mediumtext('release_title'),
    indexerId: char('indexer_id', { length: 36 }),
    downloadId: char('download_id', { length: 36 }),
    filePath: mediumtext('file_path'),
    score: double('score'),
    filedTitle: mediumtext('filed_title'),
    filedScore: double('filed_score'),
    downloadedBytes: double('downloaded_bytes'),
    downloadSeconds: double('download_seconds'),
    attempts: int('attempts').notNull().default(0),
    isPickedByHand: boolean('is_picked_by_hand').notNull().default(false),
    isFollowed: boolean('is_followed').notNull().default(true),
    trackCount: int('track_count'),
    filedTrackCount: int('filed_track_count'),
    heldQuality: varchar('held_quality', { length: 16 }).$type<MusicQuality>(),
    lastSearchedAt: moment('last_searched_at'),
    updatedAt: momentNow('updated_at').notNull(),
  },
  (table) => [
    unique('request_item_episode').on(table.requestId, table.season, table.episode),
    unique('request_item_album').on(table.requestId, table.musicBrainzId),
    foreignKey({
      name: 'requests_request_item_request_id_fk',
      columns: [table.requestId],
      foreignColumns: [mediaRequest.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'requests_request_item_download_id_fk',
      columns: [table.downloadId],
      foreignColumns: [sentDownload.id],
    }).onDelete('set null'),
  ],
);

const blocklistedRelease = requestsSchema(
  'blocklisted_release',
  {
    id: char('id', { length: 36 }).primaryKey(),
    requestId: char('request_id', { length: 36 }).notNull(),
    title: varchar('title', { length: 700 }).notNull(),
    infoHash: varchar('info_hash', { length: 64 }),
    indexerId: char('indexer_id', { length: 36 }),
    reason: jsonColumn('reason').$type<Said>().notNull(),
    at: momentNow('at').notNull(),
  },
  (table) => [
    unique('blocklisted_release_title').on(table.requestId, table.title),
    foreignKey({
      name: 'requests_blocklisted_release_request_id_fk',
      columns: [table.requestId],
      foreignColumns: [mediaRequest.id],
    }).onDelete('cascade'),
  ],
);

const requestLog = requestsSchema(
  'request_log',
  {
    id: int('id').primaryKey().autoincrement(),
    requestId: char('request_id', { length: 36 }).notNull(),
    message: jsonColumn('message').$type<Said>().notNull(),
    problemCode: varchar('problem_code', { length: 64 }).$type<ProblemCode>(),
    at: momentNow('at').notNull(),
  },
  (table) => [
    foreignKey({
      name: 'requests_request_log_request_id_fk',
      columns: [table.requestId],
      foreignColumns: [mediaRequest.id],
    }).onDelete('cascade'),
  ],
);

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
