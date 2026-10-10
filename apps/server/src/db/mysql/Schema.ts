import { HIGHER_PROFILE_ASKS } from '@ValenceContracts/schemas/HigherProfileAsks';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  double,
  float,
  index,
  int,
  longtext,
  mediumtext,
  mysqlTable,
  primaryKey,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import type { AnyMySqlColumn } from 'drizzle-orm/mysql-core';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { Fulfilment } from '@ValenceContracts/schemas/ArrApp';
import type { Avatar } from '@ValenceContracts/schemas/ViewerProfile';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';
import { hashOf } from '@ValenceDatabase/mysql/columns/hashOf';
import { identifier } from '@ValenceDatabase/mysql/columns/identifier';
import { jsonColumn } from '@ValenceDatabase/mysql/columns/jsonColumn';
import { moment } from '@ValenceDatabase/mysql/columns/moment';
import { momentNow } from '@ValenceDatabase/mysql/columns/momentNow';

const user = mysqlTable('user', {
  id: identifier('id').primaryKey(),
  name: mediumtext('name').notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: mediumtext('image'),
  createdAt: momentNow('createdAt').notNull(),
  updatedAt: momentNow('updatedAt').notNull(),
  twoFactorEnabled: boolean('twoFactorEnabled').default(false),
  role: mediumtext('role'),
  banned: boolean('banned').default(false),
  banReason: mediumtext('banReason'),
  banExpires: moment('banExpires'),
  username: varchar('username', { length: 255 }).unique(),
  displayUsername: mediumtext('displayUsername'),
  discordId: varchar('discordId', { length: 32 }),
});

const accountActivity = mysqlTable('account_activity', {
  userId: identifier('userId')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  lastSignInAt: momentNow('lastSignInAt').notNull(),
  signInCount: int('signInCount').notNull().default(0),
});

const session = mysqlTable('session', {
  id: identifier('id').primaryKey(),
  expiresAt: moment('expiresAt').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  createdAt: momentNow('createdAt').notNull(),
  updatedAt: moment('updatedAt').notNull(),
  ipAddress: mediumtext('ipAddress'),
  userAgent: mediumtext('userAgent'),
  userId: identifier('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: mediumtext('impersonatedBy'),
});

const account = mysqlTable('account', {
  id: identifier('id').primaryKey(),
  accountId: mediumtext('accountId').notNull(),
  providerId: mediumtext('providerId').notNull(),
  issuer: mediumtext('issuer'),
  userId: identifier('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: mediumtext('accessToken'),
  refreshToken: mediumtext('refreshToken'),
  idToken: mediumtext('idToken'),
  accessTokenExpiresAt: moment('accessTokenExpiresAt'),
  refreshTokenExpiresAt: moment('refreshTokenExpiresAt'),
  scope: mediumtext('scope'),
  password: mediumtext('password'),
  createdAt: momentNow('createdAt').notNull(),
  updatedAt: moment('updatedAt').notNull(),
});

const verification = mysqlTable('verification', {
  id: identifier('id').primaryKey(),
  identifier: mediumtext('identifier').notNull(),
  value: mediumtext('value').notNull(),
  expiresAt: moment('expiresAt').notNull(),
  createdAt: momentNow('createdAt').notNull(),
  updatedAt: momentNow('updatedAt').notNull(),
});

const twoFactor = mysqlTable('twoFactor', {
  id: identifier('id').primaryKey(),
  secret: mediumtext('secret').notNull(),
  backupCodes: mediumtext('backupCodes').notNull(),
  userId: identifier('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  verified: boolean('verified').default(false),
  failedVerificationCount: int('failedVerificationCount').default(0),
  lockedUntil: moment('lockedUntil'),
});

const passkey = mysqlTable('passkey', {
  id: identifier('id').primaryKey(),
  name: mediumtext('name'),
  publicKey: mediumtext('publicKey').notNull(),
  userId: identifier('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  credentialID: mediumtext('credentialID').notNull(),
  counter: int('counter').notNull(),
  deviceType: mediumtext('deviceType').notNull(),
  backedUp: boolean('backedUp').notNull(),
  transports: mediumtext('transports'),
  createdAt: moment('createdAt'),
  aaguid: mediumtext('aaguid'),
});

const deviceCode = mysqlTable('deviceCode', {
  id: identifier('id').primaryKey(),
  deviceCode: mediumtext('deviceCode').notNull(),
  userCode: mediumtext('userCode').notNull(),
  userId: identifier('userId').references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: moment('expiresAt').notNull(),
  status: mediumtext('status').notNull(),
  lastPolledAt: moment('lastPolledAt'),
  pollingInterval: int('pollingInterval'),
  clientId: mediumtext('clientId'),
  scope: mediumtext('scope'),
});

const jwks = mysqlTable('jwks', {
  id: identifier('id').primaryKey(),
  publicKey: mediumtext('publicKey').notNull(),
  privateKey: mediumtext('privateKey').notNull(),
  createdAt: moment('createdAt').notNull(),
  expiresAt: moment('expiresAt'),
  alg: mediumtext('alg'),
  crv: mediumtext('crv'),
});

const apikey = mysqlTable('apikey', {
  id: identifier('id').primaryKey(),
  configId: mediumtext('configId').notNull(),
  name: mediumtext('name'),
  start: mediumtext('start'),
  referenceId: identifier('referenceId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  prefix: mediumtext('prefix'),
  key: mediumtext('key').notNull(),
  refillInterval: int('refillInterval'),
  refillAmount: int('refillAmount'),
  lastRefillAt: moment('lastRefillAt'),
  enabled: boolean('enabled').default(true),
  rateLimitEnabled: boolean('rateLimitEnabled').default(true),
  rateLimitTimeWindow: int('rateLimitTimeWindow'),
  rateLimitMax: int('rateLimitMax'),
  requestCount: int('requestCount').default(0),
  remaining: int('remaining'),
  lastRequest: moment('lastRequest'),
  expiresAt: moment('expiresAt'),
  createdAt: moment('createdAt').notNull(),
  updatedAt: moment('updatedAt').notNull(),
  permissions: mediumtext('permissions'),
  metadata: mediumtext('metadata'),
});

const library = mysqlTable('library', {
  id: identifier('id').primaryKey(),
  name: mediumtext('name').notNull(),
  kind: mediumtext('kind').notNull(),
  flavour: mediumtext('flavour'),
  path: varchar('path', { length: 4096 }).notNull(),
  pathHash: hashOf('pathHash', 'path').unique('library_path_unique'),
  createdAt: momentNow('createdAt').notNull(),
  lastScannedAt: moment('lastScannedAt'),
  lastScanAdded: int('lastScanAdded'),
  lastScanUpdated: int('lastScanUpdated'),
  lastScanRemoved: int('lastScanRemoved'),
  lastScanFailed: int('lastScanFailed'),
  defaultAudioLanguage: mediumtext('defaultAudioLanguage'),
  filesAtOnce: int('filesAtOnce'),
  generation: int('generation').notNull().default(0),
  takesRequests: boolean('takesRequests').notNull().default(true),
  requestProfileId: identifier('requestProfileId'),
  requestPath: mediumtext('requestPath'),
  keepsShowsTogether: boolean('keepsShowsTogether').notNull().default(true),
  higherProfileAsks: varchar('higherProfileAsks', { length: 16, enum: HIGHER_PROFILE_ASKS })
    .notNull()
    .default('ask'),
  requestFulfilment: jsonColumn('requestFulfilment').$type<Fulfilment>(),
  linkedServerId: identifier('linkedServerId').references((): AnyMySqlColumn => linkedServer.id, {
    onDelete: 'cascade',
  }),
});

const viewerProfile = mysqlTable(
  'viewer_profile',
  {
    id: identifier('id').primaryKey(),
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: mediumtext('name').notNull(),
    colour: mediumtext('colour').notNull(),
    avatarStyle: mediumtext('avatarStyle'),
    avatarSeed: mediumtext('avatarSeed'),
    photoPath: mediumtext('photoPath'),
    avatarLook: jsonColumn('avatarLook').$type<Avatar>(),
    askStillWatchingAfter: int('askStillWatchingAfter').notNull().default(4),
    showsWhatIamWatching: boolean('showsWhatIamWatching').notNull().default(false),
    discordPresence: jsonColumn('discordPresence').$type<DiscordPresence>(),
    prefersBestCopy: boolean('prefersBestCopy').notNull().default(false),
    createdAt: momentNow('createdAt').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [index('viewer_profile_user_idx').on(table.userId)],
);

const watchHistory = mysqlTable(
  'watch_history',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    startedAt: momentNow('startedAt').notNull(),
    lastWatchedAt: momentNow('lastWatchedAt').notNull(),
    secondsWatched: float('secondsWatched').notNull().default(0),
    isFinished: boolean('isFinished').notNull().default(false),
    importedFrom: varchar('importedFrom', { length: 32 }),
    importKey: varchar('importKey', { length: 255 }).unique(),
    deviceLabel: varchar('deviceLabel', { length: 255 }),
  },
  (table) => [
    index('watch_history_recent_idx').on(table.profileId, table.lastWatchedAt),
    index('watch_history_item_idx').on(table.mediaItemId),
  ],
);

const watchProgress = mysqlTable(
  'watch_progress',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    positionSeconds: float('positionSeconds').notNull(),
    durationSeconds: float('durationSeconds').notNull(),
    isFinished: boolean('isFinished').notNull().default(false),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    uniqueIndex('watch_progress_profile_idx').on(table.profileId, table.mediaItemId),
    index('watch_progress_recent_idx').on(table.profileId, table.updatedAt),
  ],
);

const favourite = mysqlTable(
  'favourite',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId').references(() => mediaItem.id, { onDelete: 'cascade' }),
    bookId: identifier('bookId').references(() => book.id, { onDelete: 'cascade' }),
    keptAt: momentNow('keptAt').notNull(),
  },
  (table) => [
    uniqueIndex('favourite_profile_idx').on(table.profileId, table.mediaItemId),
    uniqueIndex('favourite_profile_book_idx').on(table.profileId, table.bookId),
    index('favourite_recent_idx').on(table.profileId, table.keptAt),
  ],
);

const rating = mysqlTable(
  'rating',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId').references(() => mediaItem.id, { onDelete: 'cascade' }),
    seriesId: identifier('seriesId').references(() => series.id, { onDelete: 'cascade' }),
    bookId: identifier('bookId').references(() => book.id, { onDelete: 'cascade' }),
    stars: int('stars').notNull(),
    ratedAt: momentNow('ratedAt').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    uniqueIndex('rating_profile_item_idx').on(table.profileId, table.mediaItemId),
    uniqueIndex('rating_profile_series_idx').on(table.profileId, table.seriesId),
    uniqueIndex('rating_profile_book_idx').on(table.profileId, table.bookId),
    index('rating_item_idx').on(table.mediaItemId),
    index('rating_series_idx').on(table.seriesId),
    index('rating_book_idx').on(table.bookId),
    check('rating_stars_range', sql`${table.stars} between 1 and 5`),
  ],
);

const hidden = mysqlTable(
  'hidden',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId').references(() => mediaItem.id, { onDelete: 'cascade' }),
    seriesId: identifier('seriesId').references(() => series.id, { onDelete: 'cascade' }),
    libraryId: identifier('libraryId').references(() => library.id, { onDelete: 'cascade' }),
    hiddenAt: momentNow('hiddenAt').notNull(),
  },
  (table) => [
    uniqueIndex('hidden_profile_item_idx').on(table.profileId, table.mediaItemId),
    uniqueIndex('hidden_profile_series_idx').on(table.profileId, table.seriesId),
    uniqueIndex('hidden_profile_library_idx').on(table.profileId, table.libraryId),
    index('hidden_item_idx').on(table.mediaItemId),
    index('hidden_series_idx').on(table.seriesId),
    index('hidden_library_idx').on(table.libraryId),
  ],
);

const libraryBlock = mysqlTable(
  'library_block',
  {
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    blockedAt: momentNow('blockedAt').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.libraryId] }),
    index('library_block_library_idx').on(table.libraryId),
  ],
);

const ageCeiling = mysqlTable(
  'age_ceiling',
  {
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    maximumAge: int('maximumAge').notNull(),
    allowsUnrated: boolean('allowsUnrated').notNull().default(false),
    setAt: momentNow('setAt').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.libraryId] }),
    index('age_ceiling_library_idx').on(table.libraryId),
    check('age_ceiling_range', sql`${table.maximumAge} between 0 and 21`),
  ],
);

const ageException = mysqlTable(
  'age_exception',
  {
    id: identifier('id').primaryKey(),
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId').references(() => mediaItem.id, { onDelete: 'cascade' }),
    seriesId: identifier('seriesId').references(() => series.id, { onDelete: 'cascade' }),
    effect: mediumtext('effect').notNull(),
    grantedBy: identifier('grantedBy').references(() => user.id, { onDelete: 'set null' }),
    grantedAt: momentNow('grantedAt').notNull(),
  },
  (table) => [
    uniqueIndex('age_exception_item_idx').on(table.userId, table.mediaItemId),
    uniqueIndex('age_exception_series_idx').on(table.userId, table.seriesId),
    index('age_exception_subject_item_idx').on(table.mediaItemId),
    index('age_exception_subject_series_idx').on(table.seriesId),
    check('age_exception_effect', sql`${table.effect} in ('allow', 'deny')`),
  ],
);

const preparedDownload = mysqlTable(
  'prepared_download',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    quality: varchar('quality', { length: 64 }).notNull(),
    audioLanguages: jsonColumn('audioLanguages')
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),
    renditionId: identifier('renditionId').notNull(),
    state: varchar('state', { length: 32 }).notNull().default('preparing'),
    progress: int('progress').notNull().default(0),
    bytesPerSecond: bigint('bytesPerSecond', { mode: 'number' }),
    secondsLeft: int('secondsLeft'),
    sizeBytes: bigint('sizeBytes', { mode: 'number' }),
    failure: jsonColumn('failure').$type<Said>(),
    askedFromClientId: mediumtext('askedFromClientId'),
    askedAt: momentNow('askedAt').notNull(),
    readyAt: moment('readyAt'),
  },
  (table) => [
    uniqueIndex('prepared_download_asked_idx').on(
      table.profileId,
      table.mediaItemId,
      table.quality,
    ),
    index('prepared_download_rendition_idx').on(table.renditionId),
    index('prepared_download_recent_idx').on(table.profileId, table.askedAt),
  ],
);

const downloadHolding = mysqlTable(
  'download_holding',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    clientId: varchar('clientId', { length: 255 }).notNull(),
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    quality: varchar('quality', { length: 64 }).notNull(),
    heldAt: momentNow('heldAt').notNull(),
  },
  (table) => [
    uniqueIndex('download_holding_one_idx').on(
      table.profileId,
      table.clientId,
      table.mediaItemId,
      table.quality,
    ),
    index('download_holding_profile_idx').on(table.profileId, table.heldAt),
  ],
);

const share = mysqlTable(
  'share',
  {
    id: identifier('id').primaryKey(),
    tokenHash: varchar('tokenHash', { length: 255 }).notNull(),
    kind: mediumtext('kind').notNull(),
    mediaItemId: identifier('mediaItemId').references(() => mediaItem.id, { onDelete: 'cascade' }),
    seriesId: identifier('seriesId').references(() => series.id, { onDelete: 'cascade' }),
    bookId: identifier('bookId').references(() => book.id, { onDelete: 'cascade' }),
    createdBy: identifier('createdBy')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: momentNow('createdAt').notNull(),
    expiresAt: moment('expiresAt'),
    viewCap: int('viewCap'),
    revokedAt: moment('revokedAt'),
  },
  (table) => [
    uniqueIndex('share_token_idx').on(table.tokenHash),
    index('share_creator_idx').on(table.createdBy),
    check('share_kind', sql`${table.kind} in ('item', 'series', 'book')`),
    check('share_view_cap', sql`${table.viewCap} is null or ${table.viewCap} > 0`),
  ],
);

const calendarFeed = mysqlTable(
  'calendar_feed',
  {
    id: identifier('id').primaryKey(),
    tokenHash: varchar('tokenHash', { length: 255 }).notNull(),
    sealedToken: mediumtext('sealedToken').notNull(),
    ownerKey: varchar('ownerKey', { length: 255 }).notNull(),
    accountId: identifier('accountId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    profileId: identifier('profileId').references(() => viewerProfile.id, { onDelete: 'cascade' }),
    createdAt: momentNow('createdAt').notNull(),
    lastReadAt: moment('lastReadAt'),
  },
  (table) => [
    uniqueIndex('calendar_feed_token_idx').on(table.tokenHash),
    uniqueIndex('calendar_feed_owner_idx').on(table.ownerKey),
    index('calendar_feed_account_idx').on(table.accountId),
  ],
);

const logRecord = mysqlTable(
  'log_record',
  {
    id: identifier('id').primaryKey(),
    at: momentNow('at').notNull(),
    level: varchar('level', { length: 32 }).notNull(),
    source: varchar('source', { length: 255 }).notNull(),
    message: mediumtext('message').notNull(),
    detail: longtext('detail'),
    count: int('count').notNull().default(1),
    sameEventKey: mediumtext('sameEventKey').notNull(),
    sameEventKeyHash: hashOf('sameEventKeyHash', 'sameEventKey'),
    jobId: varchar('jobId', { length: 255 }),
    jobKind: varchar('jobKind', { length: 255 }),
    libraryId: varchar('libraryId', { length: 255 }),
    mediaId: varchar('mediaId', { length: 255 }),
    sessionId: varchar('sessionId', { length: 255 }),
    requestId: varchar('requestId', { length: 255 }),
    forgetAfter: moment('forgetAfter').notNull(),
  },
  (table) => [
    index('log_record_at_idx').on(table.at),
    index('log_record_level_idx').on(table.level, table.at),
    index('log_record_source_idx').on(table.source, table.at),
    index('log_record_job_idx').on(table.jobId),
    index('log_record_job_kind_idx').on(table.jobKind, table.at),
    index('log_record_library_idx').on(table.libraryId, table.at),
    index('log_record_media_idx').on(table.mediaId, table.at),
    index('log_record_session_idx').on(table.sessionId, table.at),
    index('log_record_request_idx').on(table.requestId, table.at),
    index('log_record_forget_idx').on(table.forgetAfter),
    index('log_record_same_event_idx').on(table.sameEventKeyHash, table.at),
    check('log_record_count_positive', sql`${table.count} > 0`),
  ],
);

const jobRun = mysqlTable(
  'job_run',
  {
    id: identifier('id').primaryKey(),
    kind: varchar('kind', { length: 255 }).notNull(),
    status: varchar('status', { length: 32 }).notNull(),
    subject: mediumtext('subject'),
    startedAt: moment('startedAt'),
    finishedAt: moment('finishedAt'),
    progress: jsonColumn('progress'),
    errorMessage: jsonColumn('errorMessage').$type<Said>(),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [
    index('job_run_kind_idx').on(table.kind, table.createdAt),
    index('job_run_status_idx').on(table.status, table.createdAt),
  ],
);

const jobRunIssue = mysqlTable(
  'job_run_issue',
  {
    id: identifier('id').primaryKey(),
    jobRunId: identifier('jobRunId')
      .notNull()
      .references(() => jobRun.id, { onDelete: 'cascade' }),
    path: mediumtext('path').notNull(),
    reason: jsonColumn('reason').$type<Said>().notNull(),
    atMs: bigint('atMs', { mode: 'number' }).notNull(),
  },
  (table) => [index('job_run_issue_run_idx').on(table.jobRunId)],
);

const queuedJob = mysqlTable(
  'queued_job',
  {
    id: identifier('id').primaryKey(),
    kind: varchar('kind', { length: 255 }).notNull(),
    payload: jsonColumn('payload').notNull(),
    subject: varchar('subject', { length: 512 }),
    state: varchar('state', { length: 32 }).notNull(),
    waitingKey: varchar('waitingKey', { length: 255 }),
    attempts: int('attempts').notNull().default(0),
    retryLimit: int('retryLimit').notNull(),
    lastError: mediumtext('lastError'),
    runAfter: moment('runAfter').notNull(),
    finishedAt: moment('finishedAt'),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [
    uniqueIndex('queued_job_waiting_key_idx').on(table.kind, table.waitingKey),
    index('queued_job_next_idx').on(table.kind, table.state, table.runAfter),
    index('queued_job_subject_idx').on(table.subject, table.state),
    index('queued_job_finished_idx').on(table.state, table.finishedAt),
  ],
);

const jobSchedule = mysqlTable(
  'job_schedule',
  {
    queueName: varchar('queueName', { length: 255 }).notNull(),
    key: varchar('key', { length: 255 }).notNull(),
    cron: mediumtext('cron').notNull(),
    timezone: mediumtext('timezone').notNull(),
    nextRunAt: moment('nextRunAt').notNull(),
  },
  (table) => [primaryKey({ columns: [table.queueName, table.key] })],
);

const resourceSample = mysqlTable(
  'resource_sample',
  {
    id: identifier('id').primaryKey(),
    atMs: bigint('atMs', { mode: 'number' }).notNull(),
    systemCpuPercent: float('systemCpuPercent').notNull(),
    loadAverage: float('loadAverage').notNull(),
    systemMemoryUsedBytes: bigint('systemMemoryUsedBytes', { mode: 'number' }).notNull(),
    systemMemoryTotalBytes: bigint('systemMemoryTotalBytes', { mode: 'number' }).notNull(),
    cpuCount: int('cpuCount').notNull(),
  },
  (table) => [index('resource_sample_at_idx').on(table.atMs)],
);

const shareVisit = mysqlTable(
  'share_visit',
  {
    id: identifier('id').primaryKey(),
    shareId: identifier('shareId')
      .notNull()
      .references(() => share.id, { onDelete: 'cascade' }),
    joiner: varchar('joiner', { length: 255 }).notNull(),
    firstSeenAt: momentNow('firstSeenAt').notNull(),
    lastSeenAt: momentNow('lastSeenAt').notNull(),
  },
  (table) => [
    uniqueIndex('share_visit_joiner_idx').on(table.shareId, table.joiner),
    index('share_visit_share_idx').on(table.shareId),
  ],
);

const mediaSegment = mysqlTable(
  'media_segment',
  {
    id: identifier('id').primaryKey(),
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 64 }).notNull(),
    startSeconds: float('startSeconds').notNull(),
    endSeconds: float('endSeconds').notNull(),
    source: mediumtext('source').notNull(),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [
    uniqueIndex('media_segment_kind_idx').on(table.mediaItemId, table.kind),
    index('media_segment_item_idx').on(table.mediaItemId),
  ],
);

const mediaOverride = mysqlTable(
  'media_override',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 4096 }).notNull(),
    pathHash: hashOf('pathHash', 'path'),
    externalId: mediumtext('externalId').notNull(),
    externalKind: mediumtext('externalKind').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
    updatedBy: mediumtext('updatedBy'),
  },
  (table) => [
    uniqueIndex('media_override_path_idx').on(table.libraryId, table.pathHash),
    index('media_override_library_idx').on(table.libraryId),
  ],
);

const mediaLeftOut = mysqlTable(
  'media_left_out',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 4096 }).notNull(),
    pathHash: hashOf('pathHash', 'path'),
    isFolder: boolean('isFolder').notNull().default(false),
    note: mediumtext('note'),
    createdAt: momentNow('createdAt').notNull(),
    createdBy: mediumtext('createdBy'),
  },
  (table) => [
    uniqueIndex('media_left_out_path_idx').on(table.libraryId, table.pathHash),
    index('media_left_out_library_idx').on(table.libraryId),
  ],
);

const mediaPreviewOverride = mysqlTable(
  'media_preview_override',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 4096 }).notNull(),
    pathHash: hashOf('pathHash', 'path'),
    atSeconds: int('atSeconds').notNull(),
    durationSeconds: int('durationSeconds'),
    updatedAt: momentNow('updatedAt').notNull(),
    updatedBy: mediumtext('updatedBy'),
  },
  (table) => [
    uniqueIndex('media_preview_override_path_idx').on(table.libraryId, table.pathHash),
    index('media_preview_override_library_idx').on(table.libraryId),
  ],
);

const mediaArtworkChoice = mysqlTable(
  'media_artwork_choice',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    externalKind: varchar('externalKind', { length: 32 }).notNull(),
    externalId: varchar('externalId', { length: 255 }).notNull(),
    kind: varchar('kind', { length: 64 }).notNull(),
    url: mediumtext('url').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
    updatedBy: mediumtext('updatedBy'),
  },
  (table) => [
    uniqueIndex('media_artwork_choice_title_idx').on(
      table.libraryId,
      table.externalKind,
      table.externalId,
      table.kind,
    ),
  ],
);

const series = mysqlTable(
  'series',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 4096 }).notNull(),
    keyHash: hashOf('keyHash', 'key'),
    title: mediumtext('title').notNull(),
    externalId: mediumtext('externalId'),
    addedAt: momentNow('addedAt').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    uniqueIndex('series_key_idx').on(table.libraryId, table.keyHash),
    index('series_library_idx').on(table.libraryId),
  ],
);

const mediaItem = mysqlTable(
  'media_item',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 4096 }).notNull(),
    pathHash: hashOf('pathHash', 'path'),
    title: varchar('title', { length: 768 }).notNull(),
    year: int('year'),
    sizeBytes: bigint('sizeBytes', { mode: 'number' }).notNull(),
    modifiedAtMs: bigint('modifiedAtMs', { mode: 'number' }).notNull(),
    container: mediumtext('container').notNull(),
    durationSeconds: float('durationSeconds').notNull(),
    bitrateKbps: int('bitrateKbps'),
    videoCodec: mediumtext('videoCodec').notNull(),
    videoCodecTag: mediumtext('videoCodecTag'),
    videoRange: mediumtext('videoRange').notNull(),
    videoRangeBase: mediumtext('videoRangeBase'),
    videoBitDepth: int('videoBitDepth'),
    canCopySegments: boolean('canCopySegments'),
    probeVersion: int('probeVersion'),
    videoLevel: int('videoLevel'),
    videoFrameRate: float('videoFrameRate'),
    videoIsInterlaced: boolean('videoIsInterlaced'),
    videoRefFrames: int('videoRefFrames'),
    videoPixelAspect: mediumtext('videoPixelAspect'),
    videoRotationDegrees: int('videoRotationDegrees'),
    width: int('width').notNull(),
    height: int('height').notNull(),
    audioStreams: jsonColumn('audioStreams').notNull(),
    subtitleStreams: jsonColumn('subtitleStreams').notNull(),
    chapters: jsonColumn('chapters'),
    parentId: identifier('parentId').references((): AnyMySqlColumn => mediaItem.id, {
      onDelete: 'cascade',
    }),
    extraKind: mediumtext('extraKind'),
    versionLabel: mediumtext('versionLabel'),
    trailerKey: mediumtext('trailerKey'),
    releaseDate: mediumtext('releaseDate'),
    budget: bigint('budget', { mode: 'number' }),
    revenue: bigint('revenue', { mode: 'number' }),
    catalogueStatus: mediumtext('catalogueStatus'),
    imdbId: mediumtext('imdbId'),
    rottenTomatoes: int('rottenTomatoes'),
    seriesId: identifier('seriesId').references(() => series.id, { onDelete: 'set null' }),
    seriesTitle: varchar('seriesTitle', { length: 512 }),
    certifications: jsonColumn('certifications'),
    certificationAge: int('certificationAge'),
    seasonNumber: int('seasonNumber'),
    episodeNumber: int('episodeNumber'),
    episodeNumberEnd: int('episodeNumberEnd'),
    overview: mediumtext('overview'),
    tagline: mediumtext('tagline'),
    genres: jsonColumn('genres'),
    castMembers: jsonColumn('castMembers'),
    rating: float('rating'),
    posterUrl: mediumtext('posterUrl'),
    backdropUrl: mediumtext('backdropUrl'),
    logoUrl: mediumtext('logoUrl'),
    externalId: mediumtext('externalId'),
    addedAt: momentNow('addedAt').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    uniqueIndex('media_item_path_idx').on(table.libraryId, table.pathHash),
    index('media_item_library_idx').on(table.libraryId),
    index('media_item_title_idx').on(table.title),
    index('media_item_series_idx').on(table.seriesTitle, table.seasonNumber),
    index('media_item_series_id_idx').on(table.seriesId, table.seasonNumber),
    index('media_item_parent_idx').on(table.parentId),
  ],
);

const mediaRendition = mysqlTable(
  'media_rendition',
  {
    id: identifier('id').primaryKey(),
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 32 }).notNull().default('pinned'),
    path: varchar('path', { length: 4096 }).notNull(),
    pathHash: hashOf('pathHash', 'path'),
    label: mediumtext('label').notNull(),
    quality: mediumtext('quality'),
    sizeBytes: bigint('sizeBytes', { mode: 'number' }).notNull(),
    container: mediumtext('container').notNull(),
    durationSeconds: float('durationSeconds').notNull(),
    bitrateKbps: int('bitrateKbps').notNull(),
    videoCodec: mediumtext('videoCodec').notNull(),
    videoCodecTag: mediumtext('videoCodecTag'),
    videoRange: mediumtext('videoRange').notNull(),
    videoRangeBase: mediumtext('videoRangeBase'),
    videoBitDepth: int('videoBitDepth'),
    canCopySegments: boolean('canCopySegments'),
    videoLevel: int('videoLevel'),
    videoFrameRate: float('videoFrameRate'),
    videoIsInterlaced: boolean('videoIsInterlaced'),
    videoRefFrames: int('videoRefFrames'),
    videoPixelAspect: mediumtext('videoPixelAspect'),
    videoRotationDegrees: int('videoRotationDegrees'),
    width: int('width').notNull(),
    height: int('height').notNull(),
    audioStreams: jsonColumn('audioStreams').notNull(),
    subtitleStreams: jsonColumn('subtitleStreams').notNull(),
    createdAt: momentNow('createdAt').notNull(),
    createdBy: mediumtext('createdBy'),
  },
  (table) => [
    uniqueIndex('media_rendition_path_idx').on(table.pathHash),
    index('media_rendition_item_idx').on(table.mediaItemId),
    check('media_rendition_kind', sql`${table.kind} in ('pinned')`),
  ],
);

const reencodeRequest = mysqlTable(
  'reencode_request',
  {
    id: identifier('id').primaryKey(),
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    mode: mediumtext('mode').notNull(),
    state: varchar('state', { length: 32 }).notNull().default('queued'),
    quality: mediumtext('quality'),
    videoCodec: mediumtext('videoCodec'),
    audio: mediumtext('audio').notNull(),
    originalPath: mediumtext('originalPath').notNull(),
    originalSizeBytes: bigint('originalSizeBytes', { mode: 'number' }).notNull(),
    originalProbe: jsonColumn('originalProbe').notNull(),
    workingPath: mediumtext('workingPath').notNull(),
    asidePath: mediumtext('asidePath'),
    renditionId: identifier('renditionId'),
    samplePath: mediumtext('samplePath'),
    estimatedBytes: bigint('estimatedBytes', { mode: 'number' }),
    producedBytes: bigint('producedBytes', { mode: 'number' }),
    progress: int('progress').notNull().default(0),
    bytesPerSecond: bigint('bytesPerSecond', { mode: 'number' }),
    failure: jsonColumn('failure').$type<Said>(),
    askedBy: mediumtext('askedBy'),
    askedAt: momentNow('askedAt').notNull(),
    startedAt: moment('startedAt'),
    encodedAt: moment('encodedAt'),
    reviewedAt: moment('reviewedAt'),
    container: varchar('container', { length: 8 }),
    maxBitrateKbps: int('maxBitrateKbps'),
    placement: varchar('placement', { length: 16 }).notNull().default('hidden'),
    origin: varchar('origin', { length: 16 }).notNull().default('admin'),
  },
  (table) => [
    index('reencode_request_state_idx').on(table.state, table.askedAt),
    index('reencode_request_item_idx').on(table.mediaItemId),
    index('reencode_request_library_idx').on(table.libraryId),
    index('reencode_request_origin_idx').on(table.origin, table.state),
    check('reencode_request_mode', sql`${table.mode} in ('replace', 'keep', 'audioOnly')`),
    check(
      'reencode_request_state',
      sql`${table.state} in ('queued', 'encoding', 'verifying', 'awaitingReview', 'finished', 'rejected', 'failed', 'cancelled')`,
    ),
    check('reencode_request_container', sql`${table.container} in ('mp4', 'mkv')`),
    check('reencode_request_placement', sql`${table.placement} in ('hidden', 'beside')`),
    check('reencode_request_origin', sql`${table.origin} in ('admin', 'preTranscode')`),
  ],
);

const preTranscodeRefusal = mysqlTable(
  'pre_transcode_refusal',
  {
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    target: varchar('target', { length: 191 }).notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    detail: jsonColumn('detail').$type<Said>().notNull(),
    refusedAt: momentNow('refusedAt').notNull(),
  },
  (table) => [primaryKey({ columns: [table.mediaItemId, table.target] })],
);

const book = mysqlTable(
  'book',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 4096 }).notNull(),
    pathHash: hashOf('pathHash', 'path'),
    title: varchar('title', { length: 768 }).notNull(),
    layout: mediumtext('layout').notNull(),
    direction: mediumtext('direction').notNull(),
    year: int('year'),
    overview: mediumtext('overview'),
    genres: jsonColumn('genres'),
    authors: jsonColumn('authors'),
    rating: float('rating'),
    posterUrl: mediumtext('posterUrl'),
    externalId: mediumtext('externalId'),
    seriesName: mediumtext('seriesName'),
    seriesPosition: float('seriesPosition'),
    narrators: jsonColumn('narrators'),
    isCorrected: boolean('isCorrected').notNull().default(false),
    addedAt: momentNow('addedAt').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    uniqueIndex('book_path_idx').on(table.libraryId, table.pathHash),
    index('book_library_idx').on(table.libraryId),
    index('book_title_idx').on(table.title),
    check('book_layout_known', sql`${table.layout} in ('fixed', 'reflow', 'audio')`),
    check('book_direction_known', sql`${table.direction} in ('rightToLeft', 'leftToRight')`),
  ],
);

const bookChapter = mysqlTable(
  'book_chapter',
  {
    id: identifier('id').primaryKey(),
    bookId: identifier('bookId')
      .notNull()
      .references(() => book.id, { onDelete: 'cascade' }),
    path: varchar('path', { length: 4096 }).notNull(),
    pathHash: hashOf('pathHash', 'path'),
    number: float('number').notNull(),
    title: mediumtext('title').notNull(),
    format: mediumtext('format').notNull(),
    pageCount: int('pageCount'),
    durationSeconds: float('durationSeconds'),
    marks: jsonColumn('marks'),
    sizeBytes: bigint('sizeBytes', { mode: 'number' }).notNull(),
    modifiedAtMs: bigint('modifiedAtMs', { mode: 'number' }).notNull(),
    addedAt: momentNow('addedAt').notNull(),
  },
  (table) => [
    uniqueIndex('book_chapter_path_idx').on(table.bookId, table.pathHash),
    index('book_chapter_order_idx').on(table.bookId, table.number),
    check(
      'book_chapter_format_known',
      sql`${table.format} in ('cbz', 'cbr', 'pdf', 'epub', 'm4b', 'm4a', 'mp3', 'aac', 'ogg', 'opus', 'flac')`,
    ),
  ],
);

const readingProgress = mysqlTable(
  'reading_progress',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    bookId: identifier('bookId')
      .notNull()
      .references(() => book.id, { onDelete: 'cascade' }),
    chapterId: identifier('chapterId')
      .notNull()
      .references(() => bookChapter.id, { onDelete: 'cascade' }),
    pageNumber: int('pageNumber'),
    fraction: float('fraction'),
    isFinished: boolean('isFinished').notNull().default(false),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    uniqueIndex('reading_progress_profile_idx').on(table.profileId, table.chapterId),
    index('reading_progress_recent_idx').on(table.profileId, table.updatedAt),
    index('reading_progress_book_idx').on(table.profileId, table.bookId),
    check(
      'reading_progress_somewhere',
      sql`${table.pageNumber} is not null or ${table.fraction} is not null`,
    ),
  ],
);

const listeningProgress = mysqlTable(
  'listening_progress',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    bookId: identifier('bookId')
      .notNull()
      .references(() => book.id, { onDelete: 'cascade' }),
    chapterId: identifier('chapterId')
      .notNull()
      .references(() => bookChapter.id, { onDelete: 'cascade' }),
    positionSeconds: float('positionSeconds').notNull(),
    isFinished: boolean('isFinished').notNull().default(false),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    uniqueIndex('listening_progress_book_idx').on(table.profileId, table.bookId),
    index('listening_progress_recent_idx').on(table.profileId, table.updatedAt),
  ],
);

const musicArtist = mysqlTable(
  'music_artist',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    name: mediumtext('name').notNull(),
    nameKey: varchar('nameKey', { length: 512 }).notNull(),
    sortName: varchar('sortName', { length: 512 }).notNull(),
    musicbrainzId: mediumtext('musicbrainzId'),
    imagePath: mediumtext('imagePath'),
    lookedUpAt: moment('lookedUpAt'),
    addedAt: momentNow('addedAt').notNull(),
  },
  (table) => [
    uniqueIndex('music_artist_key_idx').on(table.libraryId, table.nameKey),
    index('music_artist_sort_idx').on(table.libraryId, table.sortName),
  ],
);

const musicAlbum = mysqlTable(
  'music_album',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    artistId: identifier('artistId')
      .notNull()
      .references(() => musicArtist.id, { onDelete: 'cascade' }),
    title: mediumtext('title').notNull(),
    titleKey: varchar('titleKey', { length: 512 }).notNull(),
    year: int('year'),
    genres: jsonColumn('genres'),
    isCompilation: boolean('isCompilation').notNull().default(false),
    artworkPath: mediumtext('artworkPath'),
    musicbrainzId: mediumtext('musicbrainzId'),
    releaseGroupMusicbrainzId: varchar('releaseGroupMusicbrainzId', { length: 255 }),
    isCorrected: boolean('isCorrected').notNull().default(false),
    lookedUpAt: moment('lookedUpAt'),
    addedAt: momentNow('addedAt').notNull(),
  },
  (table) => [
    uniqueIndex('music_album_key_idx').on(table.libraryId, table.artistId, table.titleKey),
    index('music_album_release_group_idx').on(table.libraryId, table.releaseGroupMusicbrainzId),
    index('music_album_recent_idx').on(table.libraryId, table.addedAt),
    index('music_album_artist_idx').on(table.artistId),
  ],
);

const musicTrack = mysqlTable(
  'music_track',
  {
    mediaItemId: identifier('mediaItemId')
      .primaryKey()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    albumId: identifier('albumId')
      .notNull()
      .references(() => musicAlbum.id, { onDelete: 'cascade' }),
    discNumber: int('discNumber'),
    trackNumber: int('trackNumber'),
    codec: mediumtext('codec').notNull(),
    isLossless: boolean('isLossless').notNull().default(false),
    isExplicit: boolean('isExplicit').notNull().default(false),
    bitDepth: int('bitDepth'),
    sampleRate: int('sampleRate'),
    lyrics: mediumtext('lyrics'),
    lyricsAreSynced: boolean('lyricsAreSynced').notNull().default(false),
    lyricsModifiedAtMs: bigint('lyricsModifiedAtMs', { mode: 'number' }),
    lyricsLookedUpAt: moment('lyricsLookedUpAt'),
    videoKey: mediumtext('videoKey'),
  },
  (table) => [
    index('music_track_album_idx').on(table.albumId, table.discNumber, table.trackNumber),
  ],
);

const musicTrackArtist = mysqlTable(
  'music_track_artist',
  {
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    artistId: identifier('artistId')
      .notNull()
      .references(() => musicArtist.id, { onDelete: 'cascade' }),
    position: int('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.mediaItemId, table.artistId] }),
    index('music_track_artist_artist_idx').on(table.artistId),
  ],
);

const favouriteArtist = mysqlTable(
  'favourite_artist',
  {
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    artistId: identifier('artistId')
      .notNull()
      .references(() => musicArtist.id, { onDelete: 'cascade' }),
    keptAt: momentNow('keptAt').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.profileId, table.artistId] }),
    index('favourite_artist_recent_idx').on(table.profileId, table.keptAt),
  ],
);

const musicPlay = mysqlTable(
  'music_play',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    trackId: identifier('trackId')
      .notNull()
      .references(() => musicTrack.mediaItemId, { onDelete: 'cascade' }),
    playedAt: momentNow('playedAt').notNull(),
  },
  (table) => [
    index('music_play_recent_idx').on(table.profileId, table.playedAt),
    index('music_play_track_idx').on(table.profileId, table.trackId),
  ],
);

const playlist = mysqlTable(
  'playlist',
  {
    id: identifier('id').primaryKey(),
    profileId: identifier('profileId').references(() => viewerProfile.id, { onDelete: 'set null' }),
    name: mediumtext('name').notNull(),
    description: mediumtext('description'),
    isShared: boolean('isShared').notNull().default(false),
    isOrdered: boolean('isOrdered').notNull().default(false),
    artworkPath: mediumtext('artworkPath'),
    createdAt: momentNow('createdAt').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    index('playlist_owner_idx').on(table.profileId, table.updatedAt),
    index('playlist_shared_idx').on(table.isShared),
  ],
);

const playlistEntry = mysqlTable(
  'playlist_entry',
  {
    id: identifier('id').primaryKey(),
    playlistId: identifier('playlistId')
      .notNull()
      .references(() => playlist.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId').references(() => mediaItem.id, { onDelete: 'set null' }),
    missingTitle: mediumtext('missingTitle'),
    missingArtist: mediumtext('missingArtist'),
    missingAlbum: mediumtext('missingAlbum'),
    missingReleaseId: identifier('missingReleaseId'),
    position: double('position').notNull(),
    addedAt: momentNow('addedAt').notNull(),
  },
  (table) => [index('playlist_entry_order_idx').on(table.playlistId, table.position)],
);

const uploadSession = mysqlTable(
  'upload_session',
  {
    id: identifier('id').primaryKey(),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    path: mediumtext('path').notNull(),
    destination: mediumtext('destination').notNull(),
    staging: mediumtext('staging').notNull(),
    bytes: bigint('bytes', { mode: 'number' }).notNull(),
    pieceBytes: int('pieceBytes').notNull(),
    pieces: int('pieces').notNull(),
    received: jsonColumn('received')
      .$type<number[]>()
      .notNull()
      .$defaultFn(() => []),
    touchedAt: momentNow('touchedAt').notNull(),
  },
  (table) => [index('upload_session_touched_idx').on(table.touchedAt)],
);

const serverSetting = mysqlTable('server_setting', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: jsonColumn('value').notNull(),
  updatedAt: momentNow('updatedAt').notNull(),
});

const mediaItemJob = mysqlTable(
  'media_item_job',
  {
    mediaItemId: identifier('mediaItemId')
      .notNull()
      .references(() => mediaItem.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 255 }).notNull(),
    completedAt: momentNow('completedAt').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.mediaItemId, table.kind] }),
    index('media_item_job_kind_idx').on(table.kind),
  ],
);

const jobTrigger = mysqlTable(
  'job_trigger',
  {
    id: identifier('id').primaryKey(),
    kind: varchar('kind', { length: 255 }).notNull(),
    trigger: jsonColumn('trigger').notNull(),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [index('job_trigger_kind_idx').on(table.kind)],
);

const webhookSubscription = mysqlTable(
  'webhook_subscription',
  {
    id: identifier('id').primaryKey(),
    name: mediumtext('name').notNull(),
    url: mediumtext('url').notNull(),
    secret: mediumtext('secret').notNull(),
    preset: varchar('preset', { length: 64 }).notNull().default('generic'),
    events: jsonColumn('events').notNull(),
    filters: jsonColumn('filters')
      .notNull()
      .$defaultFn(() => ({})),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: momentNow('createdAt').notNull(),
    lastAttemptAt: moment('lastAttemptAt'),
    lastStatus: int('lastStatus'),
    lastError: mediumtext('lastError'),
  },
  (table) => [index('webhook_subscription_enabled_idx').on(table.enabled)],
);

const webhookDelivery = mysqlTable(
  'webhook_delivery',
  {
    id: identifier('id').primaryKey(),
    subscriptionId: identifier('subscriptionId')
      .notNull()
      .references(() => webhookSubscription.id, { onDelete: 'cascade' }),
    eventId: varchar('eventId', { length: 255 }).notNull(),
    event: mediumtext('event').notNull(),
    body: longtext('body').notNull(),
    attempts: int('attempts').notNull().default(1),
    firstAttemptAt: momentNow('firstAttemptAt').notNull(),
    lastAttemptAt: momentNow('lastAttemptAt').notNull(),
    ok: boolean('ok').notNull().default(false),
    status: int('status'),
    error: mediumtext('error'),
  },
  (table) => [
    uniqueIndex('webhook_delivery_occurrence_idx').on(table.subscriptionId, table.eventId),
    index('webhook_delivery_recent_idx').on(table.subscriptionId, table.lastAttemptAt),
    index('webhook_delivery_pruning_idx').on(table.lastAttemptAt),
  ],
);

const linkInvite = mysqlTable(
  'link_invite',
  {
    id: identifier('id').primaryKey(),
    codeHash: varchar('codeHash', { length: 255 }).notNull(),
    createdAt: momentNow('createdAt').notNull(),
    expiresAt: moment('expiresAt').notNull(),
    usedAt: moment('usedAt'),
  },
  (table) => [uniqueIndex('link_invite_code_idx').on(table.codeHash)],
);

const linkedServer = mysqlTable(
  'linked_server',
  {
    id: identifier('id').primaryKey(),
    name: mediumtext('name').notNull(),
    colour: varchar('colour', { length: 16 }).notNull(),
    address: mediumtext('address').notNull(),
    publicKey: jsonColumn('publicKey').notNull(),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    theirPairingId: identifier('theirPairingId'),
    createdAt: momentNow('createdAt').notNull(),
    linkedAt: moment('linkedAt'),
    lastSeenAt: moment('lastSeenAt'),
    maximumAge: int('maximumAge'),
    allowsUnrated: boolean('allowsUnrated').notNull().default(false),
    namesTravel: boolean('namesTravel').notNull().default(true),
    showsActivity: boolean('showsActivity').notNull().default(false),
    mostStreams: int('mostStreams'),
    qualityCeiling: varchar('qualityCeiling', { length: 16 }),
    takesTheirControls: boolean('takesTheirControls').notNull().default(true),
    allowsDownloads: boolean('allowsDownloads').notNull().default(false),
    takesTheirRequests: boolean('takesTheirRequests').notNull().default(false),
    playsDirect: boolean('playsDirect').notNull().default(false),
    pictureAt: varchar('pictureAt', { length: 40 }),
  },
  (table) => [
    uniqueIndex('linked_server_fingerprint_idx').on(table.fingerprint),
    check(
      'linked_server_state',
      sql`${table.state} in ('awaitingThem', 'awaitingUs', 'linked', 'refused', 'unlinkedByThem', 'unlinked')`,
    ),
  ],
);

const linkGrant = mysqlTable(
  'link_grant',
  {
    linkedServerId: identifier('linkedServerId')
      .notNull()
      .references(() => linkedServer.id, { onDelete: 'cascade' }),
    libraryId: identifier('libraryId')
      .notNull()
      .references(() => library.id, { onDelete: 'cascade' }),
    grantedAt: momentNow('grantedAt').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.linkedServerId, table.libraryId] }),
    index('link_grant_library_idx').on(table.libraryId),
  ],
);

const linkDecline = mysqlTable(
  'link_decline',
  {
    linkedServerId: identifier('linkedServerId')
      .notNull()
      .references(() => linkedServer.id, { onDelete: 'cascade' }),
    libraryId: identifier('libraryId').notNull(),
    declinedAt: momentNow('declinedAt').notNull(),
  },
  (table) => [primaryKey({ columns: [table.linkedServerId, table.libraryId] })],
);

const remotePerson = mysqlTable(
  'remote_person',
  {
    id: identifier('id').primaryKey(),
    linkedServerId: identifier('linkedServerId')
      .notNull()
      .references(() => linkedServer.id, { onDelete: 'cascade' }),
    pseudonym: varchar('pseudonym', { length: 64 }).notNull(),
    name: mediumtext('name'),
    firstSeenAt: momentNow('firstSeenAt').notNull(),
    lastSeenAt: momentNow('lastSeenAt').notNull(),
    blockedAt: moment('blockedAt'),
  },
  (table) => [uniqueIndex('remote_person_pseudonym_idx').on(table.linkedServerId, table.pseudonym)],
);

const federationAudit = mysqlTable(
  'federation_audit',
  {
    id: identifier('id').primaryKey(),
    linkedServerId: identifier('linkedServerId')
      .notNull()
      .references(() => linkedServer.id, { onDelete: 'cascade' }),
    remotePersonId: identifier('remotePersonId').references(() => remotePerson.id, {
      onDelete: 'set null',
    }),
    action: varchar('action', { length: 32 }).notNull(),
    mediaId: identifier('mediaId'),
    mediaTitle: mediumtext('mediaTitle'),
    outcome: varchar('outcome', { length: 32 }).notNull(),
    count: int('count').notNull().default(1),
    sameEventKey: varchar('sameEventKey', { length: 191 }).notNull(),
    at: momentNow('at').notNull(),
  },
  (table) => [
    index('federation_audit_server_idx').on(table.linkedServerId, table.at),
    index('federation_audit_same_event_idx').on(table.sameEventKey, table.at),
  ],
);

const notification = mysqlTable(
  'notification',
  {
    id: identifier('id').primaryKey(),
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    event: mediumtext('event').notNull(),
    title: jsonColumn('title').$type<Said>().notNull(),
    body: jsonColumn('body').$type<Said>().notNull(),
    link: mediumtext('link'),
    createdAt: momentNow('createdAt').notNull(),
    readAt: moment('readAt'),
  },
  (table) => [
    index('notification_unread_idx').on(table.userId, table.readAt),
    index('notification_recent_idx').on(table.userId, table.createdAt),
  ],
);

const notificationPreference = mysqlTable(
  'notification_preference',
  {
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    event: varchar('event', { length: 255 }).notNull(),
    inApp: boolean('inApp').notNull().default(true),
    push: boolean('push').notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.userId, table.event] })],
);

const pushSubscription = mysqlTable(
  'push_subscription',
  {
    id: identifier('id').primaryKey(),
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    endpoint: varchar('endpoint', { length: 768 }).notNull(),
    p256dh: mediumtext('p256dh').notNull(),
    auth: mediumtext('auth').notNull(),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [
    uniqueIndex('push_subscription_endpoint_idx').on(table.endpoint),
    index('push_subscription_user_idx').on(table.userId),
  ],
);

const role = mysqlTable(
  'role',
  {
    id: identifier('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: mediumtext('description')
      .notNull()
      .default(sql`('')`),
    position: int('position').notNull().default(0),
    color: mediumtext('color'),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [uniqueIndex('role_name_idx').on(table.name)],
);

const rolePermission = mysqlTable(
  'role_permission',
  {
    roleId: identifier('roleId')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    permission: varchar('permission', { length: 255 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permission] })],
);

const userRole = mysqlTable(
  'user_role',
  {
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: identifier('roleId')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    grantedAt: momentNow('grantedAt').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index('user_role_role_idx').on(table.roleId),
  ],
);

const userPermissionOverride = mysqlTable(
  'user_permission_override',
  {
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    permission: varchar('permission', { length: 255 }).notNull(),
    effect: mediumtext('effect').notNull(),
    grantedAt: momentNow('grantedAt').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.permission] })],
);

const userProfile = mysqlTable('user_profile', {
  userId: identifier('userId')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayName: mediumtext('displayName'),
  colour: mediumtext('colour'),
  avatarStyle: mediumtext('avatarStyle'),
  avatarSeed: mediumtext('avatarSeed'),
  photoPath: mediumtext('photoPath'),
  onboardedAt: moment('onboardedAt'),
  createdAt: momentNow('createdAt').notNull(),
  updatedAt: momentNow('updatedAt').notNull(),
});

const pluginInstallation = mysqlTable('plugin_installation', {
  id: identifier('id').primaryKey(),
  version: mediumtext('version').notNull(),
  trust: mediumtext('trust').notNull(),
  manifest: jsonColumn('manifest').notNull(),
  package: longtext('package').notNull(),
  sha256: mediumtext('sha256').notNull(),
  isEnabled: boolean('isEnabled').notNull().default(true),
  settings: jsonColumn('settings')
    .notNull()
    .$defaultFn(() => ({})),
  installedBy: identifier('installedBy').references(() => user.id, { onDelete: 'set null' }),
  installedAt: momentNow('installedAt').notNull(),
  updatedAt: momentNow('updatedAt').notNull(),
  problem: jsonColumn('problem').$type<Said>(),
});

const pluginStorage = mysqlTable(
  'plugin_storage',
  {
    pluginId: identifier('pluginId')
      .notNull()
      .references(() => pluginInstallation.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 512 }).notNull(),
    value: jsonColumn('value').notNull(),
    bytes: int('bytes').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [primaryKey({ columns: [table.pluginId, table.key] })],
);

const pluginPrevious = mysqlTable('plugin_previous', {
  pluginId: identifier('pluginId')
    .primaryKey()
    .references(() => pluginInstallation.id, { onDelete: 'cascade' }),
  version: mediumtext('version').notNull(),
  trust: mediumtext('trust').notNull(),
  manifest: jsonColumn('manifest').notNull(),
  package: longtext('package').notNull(),
  sha256: mediumtext('sha256').notNull(),
  storage: jsonColumn('storage').notNull(),
  keptAt: momentNow('keptAt').notNull(),
});

const pluginHook = mysqlTable(
  'plugin_hook',
  {
    pluginId: identifier('pluginId')
      .notNull()
      .references(() => pluginInstallation.id, { onDelete: 'cascade' }),
    hookId: varchar('hookId', { length: 255 }).notNull(),
    secret: mediumtext('secret').notNull(),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [primaryKey({ columns: [table.pluginId, table.hookId] })],
);

const pluginConnection = mysqlTable(
  'plugin_connection',
  {
    pluginId: identifier('pluginId')
      .notNull()
      .references(() => pluginInstallation.id, { onDelete: 'cascade' }),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 255 }).notNull(),
    accessToken: mediumtext('accessToken').notNull(),
    refreshToken: mediumtext('refreshToken'),
    expiresAt: moment('expiresAt'),
    account: mediumtext('account'),
    connectedAt: momentNow('connectedAt').notNull(),
  },
  (table) => [primaryKey({ columns: [table.pluginId, table.profileId, table.provider] })],
);

const pluginProfile = mysqlTable(
  'plugin_profile',
  {
    pluginId: identifier('pluginId')
      .notNull()
      .references(() => pluginInstallation.id, { onDelete: 'cascade' }),
    profileId: identifier('profileId')
      .notNull()
      .references(() => viewerProfile.id, { onDelete: 'cascade' }),
    firstUsedAt: momentNow('firstUsedAt').notNull(),
  },
  (table) => [primaryKey({ columns: [table.pluginId, table.profileId] })],
);

const collection = mysqlTable('collection', {
  id: identifier('id').primaryKey(),
  name: mediumtext('name').notNull(),
  description: mediumtext('description'),
  artworkPath: mediumtext('artworkPath'),
  isOrdered: boolean('isOrdered').notNull().default(false),
  createdBy: identifier('createdBy').references(() => user.id, { onDelete: 'set null' }),
  createdAt: momentNow('createdAt').notNull(),
  updatedAt: momentNow('updatedAt').notNull(),
});

const collectionEntry = mysqlTable(
  'collection_entry',
  {
    id: identifier('id').primaryKey(),
    collectionId: identifier('collectionId')
      .notNull()
      .references(() => collection.id, { onDelete: 'cascade' }),
    mediaItemId: identifier('mediaItemId').references(() => mediaItem.id, { onDelete: 'cascade' }),
    seriesId: identifier('seriesId').references(() => series.id, { onDelete: 'cascade' }),
    position: double('position').notNull(),
    addedAt: momentNow('addedAt').notNull(),
  },
  (table) => [
    uniqueIndex('collection_entry_item_idx').on(table.collectionId, table.mediaItemId),
    uniqueIndex('collection_entry_series_idx').on(table.collectionId, table.seriesId),
    index('collection_entry_order_idx').on(table.collectionId, table.position),
    index('collection_entry_media_item_idx').on(table.mediaItemId),
    index('collection_entry_series_id_idx').on(table.seriesId),
  ],
);

const accountSetupLink = mysqlTable(
  'account_setup_link',
  {
    id: identifier('id').primaryKey(),
    userId: identifier('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: varchar('tokenHash', { length: 255 }).notNull().unique(),
    expiresAt: moment('expiresAt').notNull(),
    usedAt: moment('usedAt'),
    revokedAt: moment('revokedAt'),
    createdBy: identifier('createdBy').references(() => user.id, { onDelete: 'set null' }),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [index('account_setup_link_user_idx').on(table.userId)],
);

const emailSend = mysqlTable(
  'email_send',
  {
    id: identifier('id').primaryKey(),
    kind: varchar('kind', { length: 64 }).notNull(),
    recipient: mediumtext('recipient').notNull(),
    idempotencyKey: varchar('idempotencyKey', { length: 255 }).notNull().unique(),
    state: varchar('state', { length: 16 }).notNull(),
    failure: jsonColumn('failure').$type<Said>(),
    createdAt: momentNow('createdAt').notNull(),
  },
  (table) => [
    index('email_send_recent_idx').on(table.createdAt),
    check('email_send_state', sql`${table.state} in ('sent', 'failed')`),
  ],
);

const importSource = mysqlTable(
  'import_source',
  {
    id: identifier('id').primaryKey(),
    kind: varchar('kind', { length: 32 }).notNull(),
    name: mediumtext('name').notNull(),
    url: mediumtext('url').notNull(),
    token: mediumtext('token').notNull(),
    details: jsonColumn('details')
      .notNull()
      .$defaultFn(() => ({})),
    createdAt: momentNow('createdAt').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    check(
      'import_source_kind',
      sql`${table.kind} in ('jellyfin', 'emby', 'plex', 'radarr', 'sonarr', 'lidarr', 'prowlarr', 'overseerr', 'jellyseerr')`,
    ),
  ],
);

const importRun = mysqlTable(
  'import_run',
  {
    id: identifier('id').primaryKey(),
    sourceId: identifier('sourceId')
      .notNull()
      .references(() => importSource.id, { onDelete: 'cascade' }),
    state: varchar('state', { length: 16 }).notNull().default('planning'),
    options: jsonColumn('options')
      .notNull()
      .$defaultFn(() => ({})),
    cursor: jsonColumn('cursor'),
    report: jsonColumn('report'),
    failure: jsonColumn('failure').$type<Said>(),
    jobId: identifier('jobId'),
    createdAt: momentNow('createdAt').notNull(),
    startedAt: moment('startedAt'),
    finishedAt: moment('finishedAt'),
  },
  (table) => [
    index('import_run_source_idx').on(table.sourceId, table.createdAt),
    index('import_run_state_idx').on(table.state),
    check(
      'import_run_state',
      sql`${table.state} in ('planning', 'planned', 'importing', 'completed', 'failed', 'cancelled')`,
    ),
  ],
);

const importLink = mysqlTable(
  'import_link',
  {
    id: identifier('id').primaryKey(),
    sourceId: identifier('sourceId')
      .notNull()
      .references(() => importSource.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 32 }).notNull(),
    sourceKey: varchar('sourceKey', { length: 4096 }).notNull(),
    sourceKeyHash: hashOf('sourceKeyHash', 'sourceKey'),
    valenceId: varchar('valenceId', { length: 255 }).notNull(),
    createdAt: momentNow('createdAt').notNull(),
    updatedAt: momentNow('updatedAt').notNull(),
  },
  (table) => [
    uniqueIndex('import_link_key_idx').on(table.sourceId, table.kind, table.sourceKeyHash),
    index('import_link_valence_idx').on(table.kind, table.valenceId),
  ],
);

const authSchema = {
  user,
  session,
  account,
  verification,
  twoFactor,
  passkey,
  deviceCode,
  jwks,
  apikey,
};

const valenceSchema = { userProfile, viewerProfile, serverSetting, library, mediaItem };

export {
  calendarFeed,
  pluginInstallation,
  pluginStorage,
  pluginPrevious,
  pluginHook,
  pluginConnection,
  pluginProfile,
  accountActivity,
  watchHistory,
  series,
  authSchema,
  valenceSchema,
  library,
  mediaLeftOut,
  mediaOverride,
  mediaPreviewOverride,
  mediaArtworkChoice,
  mediaItem,
  mediaRendition,
  mediaSegment,
  reencodeRequest,
  preTranscodeRefusal,
  mediaItemJob,
  jobTrigger,
  webhookSubscription,
  webhookDelivery,
  federationAudit,
  linkDecline,
  linkGrant,
  linkInvite,
  linkedServer,
  remotePerson,
  notification,
  notificationPreference,
  pushSubscription,
  watchProgress,
  favourite,
  preparedDownload,
  downloadHolding,
  share,
  shareVisit,
  logRecord,
  jobRun,
  jobRunIssue,
  queuedJob,
  jobSchedule,
  resourceSample,
  rating,
  hidden,
  libraryBlock,
  ageCeiling,
  ageException,
  user,
  session,
  account,
  verification,
  twoFactor,
  passkey,
  deviceCode,
  jwks,
  serverSetting,
  uploadSession,
  apikey,
  userProfile,
  viewerProfile,
  role,
  rolePermission,
  userRole,
  userPermissionOverride,
  book,
  bookChapter,
  readingProgress,
  listeningProgress,
  musicArtist,
  musicAlbum,
  musicTrack,
  musicTrackArtist,
  favouriteArtist,
  musicPlay,
  playlist,
  playlistEntry,
  collection,
  collectionEntry,
  accountSetupLink,
  emailSend,
  importSource,
  importRun,
  importLink,
};
