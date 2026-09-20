import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  unlink,
  utimes,
} from 'node:fs/promises';
import { z } from 'zod';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { serveStatic } from '@hono/node-server/serve-static';
import { isAppAddress } from '@ValenceServer/web/isAppAddress';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { and, count, eq, gt, isNull, lt, lte, sql } from 'drizzle-orm';
import { createApp } from './App';
import { createRealtimeRegistry } from '@ValenceServer/realtime/createRealtimeRegistry';
import { createRealtimeHandler } from '@ValenceServer/realtime/createRealtimeHandler';
import { createRealtimeClock } from '@ValenceServer/realtime/createRealtimeClock';
import { createEntitlements } from '@ValenceServer/realtime/createEntitlements';
import { watchPermissionChanges } from '@ValenceServer/realtime/watchPermissionChanges';
import { relayMonitor } from '@ValenceServer/realtime/relayMonitor';
import { relayDownloads } from '@ValenceServer/requests/relayDownloads';
import { createPartyRegistry } from '@ValenceServer/parties/createPartyRegistry';
import { createLogger } from '@ValenceServer/logging/createLogger';
import { createDatabaseLogStore } from '@ValenceServer/logging/createDatabaseLogStore';
import { createJobHistoryStore } from '@ValenceServer/jobs/createJobHistoryStore';
import { createResourceHistoryStore } from '@ValenceServer/logging/createResourceHistoryStore';
import { asJsonLog } from '@ValenceServer/logging/asJsonLog';
import { createLogScope } from '@ValenceServer/logging/createLogScope';
import { createTranscoderIntake } from '@ValenceServer/logging/createTranscoderIntake';
import { withApiMemory } from '@ValenceServer/monitor/withApiMemory';
import { createJobHealthWatch } from '@ValenceServer/jobs/createJobHealthWatch';
import { labelForQueue } from '@ValenceServer/jobs/labelForQueue';
import { announcesCompletion } from '@ValenceServer/jobs/announcesCompletion';
import { traceJobs } from '@ValenceServer/logging/traceJobs';
import { createPresenceService } from '@ValenceServer/presence/PresenceService';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import { createAuth } from '@ValenceServer/auth/Auth';
import { trustedOriginsFor } from '@ValenceServer/auth/trustedOriginsFor';
import type { RealtimeSession } from '@ValenceServer/realtime/createRealtimeHandler';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import { createDatabaseHiddenService } from '@ValenceServer/hiding/createDatabaseHiddenService';
import { createDatabase } from '@ValenceServer/db/Database';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { findPendingMigrations } from '@ValenceServer/db/findPendingMigrations';
import { migrateToLatest } from '@ValenceServer/db/migrateToLatest';
import { createMissedMigrationApplier } from '@ValenceServer/db/createMissedMigrationApplier';
import { settleTheOwner } from '@ValenceServer/auth/settleTheOwner';
import { movePhotographsOnce } from '@ValenceServer/profiles/movePhotographsOnce';
import { dropPrivatePlaylistsOf } from '@ValenceServer/playlists/dropPrivatePlaylistsOf';
import {
  user,
  account,
  library,
  mediaItem,
  mediaRendition,
  mediaItemJob,
  mediaPreviewOverride,
  userProfile,
  viewerProfile,
  session,
  deviceCode,
  bookChapter,
  musicAlbum,
  musicArtist,
  musicTrack,
  apikey,
} from '@ValenceServer/db/Schema';
import { readEnv } from '@ValenceServer/env/Env';
import { createDatabaseSettingsStore } from '@ValenceServer/settings/createDatabaseSettingsStore';
import { createDatabaseLibraryService } from '@ValenceServer/library/createDatabaseLibraryService';
import { mediaKindOf } from '@ValenceServer/library/mediaKindOf';
import { describeQuality } from '@ValenceServer/library/describeQuality';
import { describeSignInAttempt } from '@ValenceServer/auth/describeSignInAttempt';
import { ARRIVED_TITLES_KEPT } from '@ValenceContracts/schemas/Webhook';
import { summariseArrivals } from '@ValenceServer/events/summariseArrivals';
import type { ScannedItem } from '@ValenceServer/library/scanLibrary';
import type { LibraryKind, ScanResult } from '@ValenceContracts/schemas/Library';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { catalogueForRequest } from '@ValenceServer/requests/catalogueForRequest';
import { createExpiringCache } from '@ValenceServer/library/createExpiringCache';
import { createDatabaseRequestedAlbumStore } from '@ValenceServer/requests/albums/createDatabaseRequestedAlbumStore';
import { tieRequestedAlbum } from '@ValenceServer/requests/albums/tieRequestedAlbum';
import { createDatabaseCatalogueLookup } from '@ValenceServer/requests/catalogue/createDatabaseCatalogueLookup';
import { findOnMusicBrainz } from '@ValenceServer/requests/deezer/findOnMusicBrainz';
import { readDeezerCharts } from '@ValenceServer/requests/deezer/readDeezerCharts';
import type { Discovery } from '@ValenceServer/requests/catalogue/Discovery';
import type { DeezerCharts } from '@ValenceServer/requests/deezer/readDeezerCharts';
import type { CatalogueStudio } from '@ValenceContracts/schemas/CatalogueTitle';
import { describeAlbumForRequest } from '@ValenceServer/requests/musicBrainz/describeAlbumForRequest';
import { describeArtistForRequest } from '@ValenceServer/requests/musicBrainz/describeArtistForRequest';
import { searchMusicCatalogue } from '@ValenceServer/requests/musicBrainz/searchMusicCatalogue';
import type {
  MediaRequestKind,
  MusicRequestKind,
  RequestCatalogue,
  VideoRequestKind,
} from '@ValenceContracts/schemas/MediaRequest';
import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { readCallerAddress } from '@ValenceServer/web/readCallerAddress';
import { createSessionWatch } from '@ValenceServer/presence/createSessionWatch';
import type { PresenceSession, PresenceViewing } from '@ValenceServer/presence/PresenceService';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type ViewingData = Extract<WebhookPayload, { event: 'playback.started' }>['data'];

type SessionData = Extract<WebhookPayload, { event: 'session.started' }>['data'];
import { runScanPhases } from '@ValenceServer/library/runScanPhases';
import { createCatalogueMetadataProvider } from '@ValenceServer/library/createCatalogueMetadataProvider';
import { createFilenameMetadataProvider } from '@ValenceServer/library/createFilenameMetadataProvider';
import { createMediaFileSystem } from '@ValenceServer/library/createMediaFileSystem';
import { createTranscoderClient } from '@ValenceServer/transcoder/TranscoderClient';
import { createImageCache } from '@ValenceServer/images/createImageCache';
import { createDiskUsage } from '@ValenceServer/maintenance/createDiskUsage';
import { measureArtwork } from '@ValenceServer/images/measureArtwork';
import { measureBookPages } from '@ValenceServer/books/measureBookPages';
import { detectLibrarySegments } from '@ValenceServer/segments/detectLibrarySegments';
import { createDatabaseWatchProgressService } from '@ValenceServer/progress/createDatabaseWatchProgressService';
import { createDatabaseFavouriteService } from '@ValenceServer/favourites/createDatabaseFavouriteService';
import { createDatabaseRatingService } from '@ValenceServer/ratings/createDatabaseRatingService';
import { getCookie } from 'hono/cookie';
import { createDatabaseShareService } from '@ValenceServer/sharing/createDatabaseShareService';
import { guestAtTheDoor } from '@ValenceServer/sharing/guestAtTheDoor';
import { SHARE_COOKIE } from '@ValenceServer/sharing/createShareGate';
import { createShareSessions } from '@ValenceServer/sharing/createShareSessions';
import { createPlaybackSessions } from '@ValenceServer/playback/createPlaybackSessions';
import { createDatabaseSegmentService } from '@ValenceServer/segments/createDatabaseSegmentService';
import { createFingerprintSegmentProvider } from '@ValenceServer/segments/createFingerprintSegmentProvider';
import { createSidecarSubtitleService } from '@ValenceServer/subtitles/createSidecarSubtitleService';
import { createDatabaseProfileService } from '@ValenceServer/profiles/createDatabaseProfileService';
import { createDatabaseHouseholdService } from '@ValenceServer/household/createDatabaseHouseholdService';
import { createFileSplashscreenStore } from '@ValenceServer/splashscreen/createFileSplashscreenStore';
import { createDatabaseBookService } from '@ValenceServer/books/createDatabaseBookService';
import { ViewerProfileSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { createEmbeddedSubtitleService } from '@ValenceServer/subtitles/createEmbeddedSubtitleService';
import { createLayeredSubtitleService } from '@ValenceServer/subtitles/createLayeredSubtitleService';
import { createPlaybackService } from '@ValenceServer/playback/createPlaybackService';
import { createJobQueue } from '@ValenceServer/jobs/createJobQueue';
import type { FinishedJob } from '@ValenceServer/jobs/createJobQueue';
import {
  READ_CERTIFICATES_AGAIN_JOB,
  SCAN_LIBRARY_JOB,
  SCAN_REQUEST_FOLDER_JOB,
  ScanRequestFolderJobSchema,
  REFRESH_REQUESTS_JOB,
  READ_AGAIN_JOB,
  ReadAgainJobSchema,
  ScanLibraryJobSchema,
  REGENERATE_PREVIEWS_JOB,
  RegeneratePreviewsJobSchema,
  REGENERATE_TRICKPLAY_JOB,
  FETCH_LOGOS_JOB,
  RegenerateTrickplayJobSchema,
  FetchLogosJobSchema,
  DETECT_SEGMENTS_JOB,
  DetectSegmentsJobSchema,
  CLEAR_LIBRARY_PARTS_JOB,
  ClearLibraryPartsJobSchema,
  CLEANUP_IMAGE_CACHE_JOB,
  CLEANUP_ARTEFACT_CACHE_JOB,
  CLEANUP_SESSIONS_JOB,
  PRUNE_HISTORY_JOB,
  CHECK_CATALOGUE_CONNECTIVITY_JOB,
  CHECK_TRANSCODER_JOB,
  CHECK_REQUESTS_JOB,
  CHECK_DISK_SPACE_JOB,
  SEND_MEDIA_DIGEST_JOB,
  DELIVER_WEBHOOK_JOB,
  PRUNE_WEBHOOK_DELIVERIES_JOB,
  PRUNE_LOGS_JOB,
  PRUNE_JOB_HISTORY_JOB,
  PRUNE_RESOURCE_HISTORY_JOB,
  REENCODE_JOB,
  DeliverWebhookJobSchema,
  scheduleTriggerKind,
} from '@ValenceServer/jobs/JobQueue';
import { createDatabaseWebhookStore } from '@ValenceServer/webhooks/createDatabaseWebhookStore';
import { createDatabaseNotificationStore } from '@ValenceServer/notifications/createDatabaseNotificationStore';
import { notifyHousehold } from '@ValenceServer/notifications/notifyHousehold';
import { summariseNewMedia } from '@ValenceServer/notifications/summariseNewMedia';
import { readDigestWindow } from '@ValenceServer/notifications/readDigestWindow';
import webPush from 'web-push';
import type { VapidKeys } from '@ValenceServer/notifications/sendWebPush';
import { runWebhookDelivery } from '@ValenceServer/webhooks/runWebhookDelivery';
import { createWebhookEventBus } from '@ValenceServer/events/createWebhookEventBus';
import { collectScanRuns } from '@ValenceServer/events/collectScanRuns';
import { createReachabilityWatch } from '@ValenceServer/events/createReachabilityWatch';
import { readRequestsSetup } from '@ValenceServer/requests/readRequestsSetup';
import { createRequestsClient } from '@ValenceServer/requests/createRequestsClient';
import { createRequestsMonitor } from '@ValenceServer/requests/createRequestsMonitor';
import { createDiskPressureWatch } from '@ValenceServer/events/createDiskPressureWatch';
import { MonitorDisksSchema } from '@ValenceServer/maintenance/DiskUse';
import {
  findDisksUnderPressure,
  findMountFor,
} from '@ValenceServer/maintenance/findDisksUnderPressure';
import { createDatabaseMaintenanceService } from '@ValenceServer/maintenance/createDatabaseMaintenanceService';
import { cleanupImageCache } from '@ValenceServer/maintenance/cleanupImageCache';
import { sweepBookPages } from '@ValenceServer/maintenance/sweepBookPages';
import { createDatabaseMusicService } from '@ValenceServer/music/createDatabaseMusicService';
import { createDatabaseMusicStore } from '@ValenceServer/music/createDatabaseMusicStore';
import { createMusicArtwork } from '@ValenceServer/music/createMusicArtwork';
import { createMusicDevices } from '@ValenceServer/music/createMusicDevices';
import { createMusicWeb } from '@ValenceServer/music/web/createMusicWeb';
import { enrichMusicLibrary } from '@ValenceServer/music/web/enrichMusicLibrary';
import { createMusicFileSystem } from '@ValenceServer/music/createMusicFileSystem';
import { createDatabasePlaylistService } from '@ValenceServer/playlists/createDatabasePlaylistService';
import type { MusicServices } from '@ValenceServer/music/MusicServices';
import { sweepArtefactCache } from '@ValenceServer/maintenance/sweepArtefactCache';
import { AudioStreamSchema, MediaItemSchema } from '@ValenceContracts/schemas/MediaItem';
import {
  TRICKPLAY_INTERVAL_SECONDS,
  TRICKPLAY_TILE_WIDTH,
  TRICKPLAY_COLUMNS,
  TRICKPLAY_ROWS,
} from '@ValenceServer/playback/PlaybackService';
import { cleanupSessions } from '@ValenceServer/maintenance/cleanupSessions';
import { checkCatalogueConnectivity } from '@ValenceServer/maintenance/checkCatalogueConnectivity';
import {
  RESET_LIBRARY_JOB,
  jobDefinitionsFor,
  scheduleQueueNameFor,
} from '@ValenceServer/jobs/jobDefinitions';
import { createJobScheduleService } from '@ValenceServer/jobs/createJobScheduleService';
import { resolveJobsTimezone } from '@ValenceServer/jobs/resolveJobsTimezone';
import { createDatabaseJobTriggerStore } from '@ValenceServer/jobs/createDatabaseJobTriggerStore';
import { markJobComplete } from '@ValenceServer/library/createMediaStore';
import { createWorkLock } from '@ValenceServer/jobs/createWorkLock';
import { createDatabaseWorkLock } from '@ValenceServer/jobs/createDatabaseWorkLock';
import { createLibraryWorkRunner } from '@ValenceServer/jobs/createLibraryWorkRunner';
import { seedDefaultJobTriggers } from '@ValenceServer/jobs/seedDefaultJobTriggers';
import { seedDefaultRoles } from '@ValenceServer/auth/seedDefaultRoles';
import { ADMINISTRATOR_ROLE_NAME, DEFAULT_ROLE_NAME } from '@ValenceCore/functions/defaultRoles';
import { createDatabaseHistoryService } from '@ValenceServer/history/createDatabaseHistoryService';
import { createDatabaseSignInStore } from '@ValenceServer/accounts/createDatabaseSignInStore';
import { recordSignIn } from '@ValenceServer/accounts/recordSignIn';
import { createDatabasePermissionService } from '@ValenceServer/auth/createDatabasePermissionService';
import { createDownloadService } from '@ValenceServer/downloads/createDownloadService';
import { createDatabaseReencodeService } from '@ValenceServer/reencode/createDatabaseReencodeService';
import { keepingProfile } from '@ValenceServer/downloads/keepingProfile';
import { readCertificatesAgain } from '@ValenceServer/library/readCertificatesAgain';
const ChapterListSchema = z.array(
  z.object({
    title: z.string().nullable(),
    startSeconds: z.number(),
    endSeconds: z.number(),
  }),
);
const MonitorResourceSampleSchema = z.object({
  resources: z.object({
    atMs: z.number(),
    systemCpuPercent: z.number(),
    loadAverage: z.number(),
    systemMemoryUsedBytes: z.number(),
    systemMemoryTotalBytes: z.number(),
    cpuCount: z.number(),
  }),
});
const env = readEnv(process.env);
const { db, pool, schema } = createDatabase(env.DATABASE_URL);

const MIGRATIONS_FOLDER = join(import.meta.dirname, '..', 'drizzle');

const MIGRATION_JOURNAL = join(MIGRATIONS_FOLDER, 'meta', '_journal.json');

const AppliedMigrationSchema = z.object({ created_at: z.union([z.string(), z.number()]) });

/**
 * The stamps of the migrations this database has run, or none where it has never run any.
 *
 * A database nobody has migrated has no ledger table to read, which is not a fault — it is what
 * every first start looks like. Drizzle creates it as part of applying the first migration.
 *
 * @returns The stamps.
 */
const readAppliedStamps = async (): Promise<number[]> => {
  try {
    const applied = await db.execute(sql`select created_at from drizzle.__drizzle_migrations`);

    return applied.rows.map((row) => Number(AppliedMigrationSchema.parse(row).created_at));
  } catch {
    return [];
  }
};

await migrateToLatest({
  pending: () =>
    findPendingMigrations({
      readJournal: () => readFile(MIGRATION_JOURNAL, 'utf8'),
      readAppliedAt: readAppliedStamps,
    }),
  apply: () => migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }),
  applyMissed: createMissedMigrationApplier(db, MIGRATIONS_FOLDER),
  isAllowed: env.MIGRATE_ON_START,
  say: (_level, line) => {
    process.stdout.write(`${line}\n`);
  },
});

const settings = createDatabaseSettingsStore({
  db,
  defaults: {
    trustedOrigins: env.TRUSTED_ORIGINS,
    cookieSecure: env.COOKIE_SECURE,
    setupCompletedAt: null,
    catalogueApiKey: env.CATALOGUE_API_KEY,
    hardwareAccel: '',
    previewQuality: 'high',
    showsProfilesBeforeSignIn: true,
    seededJobTriggerKinds: [],
    seededRoleNames: [],
    pushPublicKey: '',
    pushPrivateKey: '',
    mediaDigestReadTo: null,
    jobsTimezone: '',
    certificationRegion: 'GB',
    fetchesCatalogueTrailers: false,
    requestReleaseTypes: ['album'],
    fetchesMusicDetails: false,
    audioDbKey: '',
    ownerAccountId: '',
    splashscreenFile: null,
    reencodesAwaitingReviewCap: 5,
    roundness: 'default',
  },
});

const settleOwnershipOnce = async (): Promise<void> => {
  const { ownerAccountId } = await settings.read();

  const administrators = await db
    .select({ id: user.id, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.role, 'admin'));

  const owner = settleTheOwner(ownerAccountId, administrators);

  if (owner === null) {
    return;
  }

  await settings.write({ ownerAccountId: owner });

  log.info('auth', `this server is owned by ${owner}`);
};

await settleOwnershipOnce();

const REALTIME_WINDOW_MS = 200;

const REALTIME_ENTITLEMENT_TTL_MS = 5000;

const REALTIME_HEARTBEAT_MS = 20000;

const SESSION_LINGER_MS = 60_000;

const MONITOR_RETRY_MS = 5000;

const LOG_WINDOW_MS = 250;

const LOG_BATCH_SIZE = 200;

const LOG_DEDUPE_WINDOW_MS = 60_000;

const HISTORY_KEPT_FOR_DAYS = 365;

const WEBHOOK_DELIVERIES_KEPT_FOR_DAYS = 7;

const signInStore = createDatabaseSignInStore(db);
const historyService = createDatabaseHistoryService(db);

const persisted = await settings.read();

const shareService = createDatabaseShareService(db);

const auth = createAuth({
  env,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  settings,
  cookieSecure: persisted.cookieSecure,
  onUserCreated: async (userId) => {
    await db.insert(userProfile).values({ userId }).onConflictDoNothing();
    await giveDefaultRole(userId);

    const [made] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    void events.publish({
      event: 'account.created',
      data: { accountId: userId, name: made?.name ?? 'Somebody' },
    });
  },
  onSignInSettled: (attempt) => {
    const occurrence = describeSignInAttempt(attempt);

    if (occurrence !== null) {
      void events.publish(occurrence);
    }
  },
  onSignedIn: async (userId, at) => {
    await recordSignIn({
      store: signInStore,
      userId,
      at,
      lastSignInAt: await signInStore.lastSignInAt(userId),
    });
  },
  onPasswordResetRequested: (email, url) => {
    log.info('auth', `password reset for ${email}: ${url}`);

    return Promise.resolve();
  },
});

/**
 * Counts the accounts on this server, which is what first-run setup asks to decide whether the
 * server belongs to anybody yet.
 *
 * @returns How many accounts there are.
 */
const countUsers = async (): Promise<number> => {
  const rows = await db.select({ total: count() }).from(user);

  return rows[0]?.total ?? 0;
};

/**
 * How much disk the media itself takes, across every library. Reported beside what Valence has added to
 * it, since the useful question on the dashboard is which of the two is growing.
 */
const readLibraryBytes = async (): Promise<number> => {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${mediaItem.sizeBytes}), 0)::bigint` })
    .from(mediaItem);

  return Number(rows[0]?.total ?? 0);
};

const storedPermissions = createDatabasePermissionService(db);

const realtime = createRealtimeRegistry({
  entitlements: createEntitlements({
    resolve: (accountId) => storedPermissions.resolve(accountId),
    now: () => Date.now(),
    ttlMs: REALTIME_ENTITLEMENT_TTL_MS,
  }),
  now: () => Date.now(),
  schedule: createRealtimeClock(),
  windowMs: REALTIME_WINDOW_MS,
});

const logScope = createLogScope();

/**
 * Which job run a line belongs to, where the code writing it is running inside one. Read from the
 * same ambient context a log line's own `jobId` comes from, so a per-item failure deep inside a scan
 * or a render can be attributed to the run without threading a job id through every call in between.
 *
 * @returns The job run's id, or null where nothing running now is a job.
 */
const jobIdInScope = (): string | null => logScope.current().jobId ?? null;

const logStore = createDatabaseLogStore(db);

const jobHistory = createJobHistoryStore(db);

const resourceHistory = createResourceHistoryStore(db);

const log = createLogger({
  store: logStore,
  now: () => Date.now(),
  newId: () => randomUUID(),
  schedule: createRealtimeClock(),
  writeLine: (line, level) => {
    if (level === 'error' || level === 'warn') {
      process.stderr.write(line);

      return;
    }

    process.stdout.write(line);
  },
  windowMs: LOG_WINDOW_MS,
  batchSize: LOG_BATCH_SIZE,
  dedupeWindowMs: LOG_DEDUPE_WINDOW_MS,
  ambient: () => logScope.current(),
  onRecord: (record) => {
    realtime.publish('logs', asJsonLog(record), { kind: 'everyone' });
  },
});

/**
 * Reads what an account is called, for the events that say who they are about.
 *
 * @param accountId - Whose name to read, or null where nobody is signed in.
 * @returns The name, or null where nobody is signed in or the account has since gone.
 */
const nameOfAccount = async (accountId: string | null): Promise<string | null> => {
  if (accountId === null) {
    return null;
  }

  const named = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, accountId))
    .limit(1);

  return named[0]?.name ?? null;
};

/**
 * Fills out what a viewing was of, which presence does not hold.
 *
 * Presence knows who is connected and which item they asked for; the poster, the library it sits in
 * and what kind of thing it is all live in the catalogue. Reading them here keeps presence an
 * in-memory view of connections rather than a second, staler copy of the library.
 *
 * @param viewing - Who is watching what, as presence saw it.
 * @returns The viewing as a subscriber reads it, or nothing where the item has since gone.
 */
const describeViewing = async (viewing: PresenceViewing): Promise<ViewingData | null> => {
  const item = await libraryService.getMedia(viewing.mediaId);

  if (item === null) {
    return null;
  }

  const shelf = (await libraryService.list(asTheServer)).find((one) => one.id === item.libraryId);

  return {
    accountId: viewing.accountId,
    accountName: await nameOfAccount(viewing.accountId),
    profileId: viewing.profileId,
    profileName: viewing.profileName,
    item: {
      itemId: item.id,
      kind: mediaKindOf(
        { seriesTitle: item.metadata.seriesTitle ?? null },
        shelf?.kind ?? 'movies',
      ),
      title: item.title,
      seriesTitle: item.metadata.seriesTitle ?? null,
      seasonNumber: item.metadata.seasonNumber ?? null,
      episodeNumber: item.metadata.episodeNumber ?? null,
      year: item.year ?? null,
      posterUrl: await libraryService.readArtworkUrl(viewing.mediaId, 'poster'),
      libraryId: item.libraryId,
      libraryName: shelf?.name ?? 'A library',
      overview: item.metadata.overview ?? null,
      durationSeconds: item.durationSeconds,
      genres: item.metadata.genres ?? [],
      rating: item.metadata.rating ?? null,
      quality: describeQuality(item.width, item.height, item.videoRange),
    },
    deviceLabel: viewing.deviceLabel,
    mode: viewing.mode,
  };
};

/**
 * Fills out whose session it is, which presence holds by id rather than by name.
 *
 * @param session - The session, as presence saw it.
 * @returns The session as a subscriber reads it.
 */
const describeSession = async (session: PresenceSession): Promise<SessionData> => ({
  accountId: session.accountId,
  accountName: await nameOfAccount(session.accountId),
  profileId: session.profileId,
  profileName: session.profileName,
  clientId: session.clientId,
  deviceLabel: session.deviceLabel,
  address: session.address,
  guestOf: session.guestOf,
  viaShare: session.viaShare,
});

const sessions = createSessionWatch({
  lingerMs: SESSION_LINGER_MS,
  schedule: createRealtimeClock(),
  now: () => Date.now(),
  onStarted: (session) => {
    void describeSession(session).then((described) => {
      void events.publish({ event: 'session.started', data: described });
    });
  },
  onEnded: ({ lastedSeconds, ...session }) => {
    void describeSession(session).then((described) => {
      void events.publish({ event: 'session.ended', data: { ...described, lastedSeconds } });
    });
  },
});

const presence = createPresenceService({
  onPlaybackStarted: (viewing) => {
    void describeViewing(viewing).then((described) => {
      if (described !== null) {
        void events.publish({ event: 'playback.started', data: described });
      }
    });
  },
  onPlaybackStopped: (viewing) => {
    void describeViewing(viewing).then((described) => {
      if (described !== null) {
        void events.publish({
          event: 'playback.stopped',
          data: {
            ...described,
            positionSeconds: viewing.positionSeconds,
            durationSeconds: viewing.durationSeconds,
          },
        });
      }
    });
  },
  onSessionOpened: (session) => {
    sessions.opened(session);
  },
  onSessionClosed: (clientId) => {
    sessions.closed(clientId);
  },
});

presence.watch(() => {
  realtime.publish('sessions', { changed: true }, { kind: 'everyone' });
});

const permissions = watchPermissionChanges(storedPermissions, {
  accountChanged: (userId) => {
    void realtime.recheck(userId);
    realtime.publish('profile', { changed: true }, { kind: 'accounts', accountIds: [userId] });
  },
  everyoneChanged: () => {
    void realtime.recheckAll();
    realtime.publish('profile', { changed: true }, { kind: 'everyone' });
  },
});

/**
 * Gives a freshly created account the role new accounts are meant to have, so somebody who has just
 * signed up can do something rather than nothing until an administrator notices them.
 *
 * @param userId - The account that was just created.
 */
const giveDefaultRole = async (userId: string): Promise<void> => {
  const member = (await permissions.listRoles()).find((role) => role.name === DEFAULT_ROLE_NAME);

  if (member !== undefined) {
    await permissions.assignRole(userId, member.id);
  }
};

/**
 * Makes an account an administrator, used by first-run setup for the account that claims a server
 * nobody owns yet.
 *
 * Both halves of it, because two different things are read. The mark on the account is what the
 * screens ask about; the role is what every permission check in this server resolves against. An
 * account given one and not the other is an administrator in the chrome and a stranger to the API,
 * and that is how first-run setup left the only account on a new instance.
 *
 * Found without regard to case. What somebody typed into the setup form is not what is stored —
 * better-auth folds an address before it keeps it — so an email with a capital in it matched nothing
 * here, silently, and setup finished by reporting success and promoting nobody.
 *
 * @param email - The account to promote.
 */
const promoteToAdmin = async (email: string): Promise<string | null> => {
  const promoted = await db
    .update(user)
    .set({ role: 'admin' })
    .where(sql`lower(${user.email}) = lower(${email})`)
    .returning({ id: user.id });

  if (promoted.length === 0) {
    log.warn('auth', `no account at ${email} to make an administrator`);

    return null;
  }

  const administrator = (await permissions.listRoles()).find(
    (role) => role.name === ADMINISTRATOR_ROLE_NAME,
  );

  if (administrator === undefined) {
    log.warn('auth', 'there is no Administrator role to give');

    return promoted[0]?.id ?? null;
  }

  for (const account of promoted) {
    await permissions.assignRole(account.id, administrator.id);
  }

  return promoted[0]?.id ?? null;
};
await movePhotographsOnce({
  from: join(env.IMAGE_CACHE_DIR, 'profiles'),
  to: env.PROFILE_IMAGE_DIR,
  files: {
    list: async (directory) => {
      const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);

      return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    },
    ensure: async (directory) => {
      await mkdir(directory, { recursive: true });
    },
    has: (path) =>
      stat(path).then(
        () => true,
        () => false,
      ),
    move: async (fromPath, toPath) => {
      await rename(fromPath, toPath).catch(async (error: NodeJS.ErrnoException) => {
        if (error.code !== 'EXDEV') {
          throw error;
        }

        await copyFile(fromPath, toPath);
        await unlink(fromPath);
      });
    },
  },
  onProblem: (name, reason) => {
    log.error('server', `profiles: ${name} could not be moved — ${reason}`);
  },
});

const profileService = createDatabaseProfileService(db, env.PROFILE_IMAGE_DIR);

const householdService = createDatabaseHouseholdService(db, env.PROFILE_IMAGE_DIR);

const splashscreen = createFileSplashscreenStore(env.PROFILE_IMAGE_DIR, settings);

const bookService = createDatabaseBookService(db, env.IMAGE_CACHE_DIR);

const transcoder = createTranscoderClient({ baseUrl: env.TRANSCODER_URL });

const musicArtworkDir = join(env.IMAGE_CACHE_DIR, 'music');

const musicLibrary = createDatabaseMusicService(db);

const musicStore = createDatabaseMusicStore(db);

const musicArtwork = createMusicArtwork(musicArtworkDir);

const AUDIO_DB_FREE_KEY = '123';

const musicWeb = createMusicWeb({
  userAgent: `Valence/${env.VALENCE_VERSION} ( https://github.com/ValenceOSS/Valence )`,
  spacingMs: {
    'musicbrainz.org': 1100,
    'coverartarchive.org': 250,
    'www.theaudiodb.com': 2100,
    'lrclib.net': 250,
    'api.deezer.com': 250,
  },
});

/**
 * Looks for what a music library's files left out on the web, where the server has been told it
 * may: covers, artists' photographs, music videos and song words.
 *
 * @param libraryId - The library.
 * @param jobId - The scan it is part of, for progress and cancellation.
 * @param isAgain - Whether to ask again about what was not found before, as a forced scan does.
 */
const lookUpMusic = async (libraryId: string, jobId: string, isAgain: boolean): Promise<void> => {
  const current = await settings.read();

  if (!current.fetchesMusicDetails) {
    return;
  }

  const found = await enrichMusicLibrary({
    libraryId,
    store: musicStore,
    web: musicWeb,
    artwork: musicArtwork,
    audioDbKey: current.audioDbKey === '' ? AUDIO_DB_FREE_KEY : current.audioDbKey,
    isAgain,
    onProgress: (done, total) => {
      jobs.reportProgress(
        jobId,
        `${done.toString()} of ${total.toString()} looked up`,
        done,
        total,
      );
    },
    isCancelled: () => jobs.isCancelled(jobId),
  });

  log.info(
    'scanner',
    `music looked up on the web: ${found.covers.toString()} covers, ${found.pictures.toString()} photographs, ${found.videos.toString()} videos, ${found.lyrics.toString()} lyrics`,
  );
};

const musicServices: MusicServices = {
  library: musicLibrary,
  playlists: createDatabasePlaylistService(db, musicLibrary),
  devices: createMusicDevices({
    presence,
    onChanged: (accountId) => {
      realtime.publish(
        'playback',
        { kind: 'musicDevicesChanged' },
        { kind: 'accounts', accountIds: [accountId] },
      );
      realtime.publish('sessions', { changed: true }, { kind: 'everyone' });
    },
  }),
  stream: (file, rendition, range) =>
    rendition.kind === 'original'
      ? transcoder.readFile(file.path, range)
      : transcoder.readAudioRendition(file.path, rendition.kbps, range),
  readImage: async (path) => {
    const bytes = await readFile(path).catch(() => null);

    return bytes === null ? null : new Uint8Array(bytes);
  },
};

/**
 * Finds intros, outros and recaps across a library's already-scanned files by fingerprinting their
 * audio and looking for stretches every episode of a season shares. Runs against what has been
 * scanned rather than as part of a scan, since it compares episodes against each other and so needs
 * them all present.
 *
 * @param libraryId - The library to work through.
 * @param jobId - The job to report progress against.
 */
const runDetectSegments = async (libraryId: string, jobId: string): Promise<void> => {
  const marked = await detectLibrarySegments({
    correlationId: jobId,
    libraryId,
    providers: segmentProviders,
    segments: segmentService,
    listCandidates: async (id) => {
      const rows = await db
        .select({
          mediaId: mediaItem.id,
          path: mediaItem.path,
          durationSeconds: mediaItem.durationSeconds,
          seriesId: mediaItem.seriesId,
          seasonNumber: mediaItem.seasonNumber,
          chapters: mediaItem.chapters,
          container: mediaItem.container,
          bitrateKbps: mediaItem.bitrateKbps,
          completedAt: mediaItemJob.completedAt,
        })
        .from(mediaItem)
        .leftJoin(
          mediaItemJob,
          and(
            eq(mediaItemJob.mediaItemId, mediaItem.id),
            eq(mediaItemJob.kind, DETECT_SEGMENTS_JOB),
          ),
        )
        .where(eq(mediaItem.libraryId, id));

      return rows.map((row) => ({
        mediaId: row.mediaId,
        path: row.path,
        durationSeconds: row.durationSeconds,
        seriesId: row.seriesId,
        seasonNumber: row.seasonNumber,
        isComplete: row.completedAt !== null,
        probe: {
          container: row.container,
          durationSeconds: row.durationSeconds,
          bitrateKbps: row.bitrateKbps,
          video: null,
          audioStreams: [],
          subtitleStreams: [],
          chapters: ChapterListSchema.catch([]).parse(row.chapters),
        },
      }));
    },
    markComplete: (mediaId) => markJobComplete(db, mediaId, DETECT_SEGMENTS_JOB),
    onProblem: (provider, reason) => {
      log.warn('scanner', `segments: ${provider}: ${reason}`);
    },
    onProgress: (processed, total) => {
      jobs.reportProgress(jobId, 'segments', processed, total);
    },
    isCancelled: () => jobs.isCancelled(jobId),
  });

  if (marked > 0) {
    log.info('scanner', `marked segments on ${marked.toString()} item(s)`);
  }
};

/**
 * Wraps a job that runs against one library so a single schedule can fire it against every library
 * there is. Which libraries those are is decided when it runs rather than when the schedule was set,
 * so a library added last week is included without anybody rescheduling anything.
 *
 * @param run - The work to do for one library.
 * @returns A handler that does it for all of them.
 */
const scheduleAcrossLibraries =
  (run: (libraryId: string) => Promise<{ jobId: string; state: string } | null>) =>
  async (): Promise<void> => {
    const libraries = await libraryService.list(asTheServer);

    await Promise.all(libraries.map((library) => run(library.id)));
  };

const libraryWork = createWorkLock();

const librariesAcrossProcesses = createDatabaseWorkLock({ sessions: pool });

const webhookSubscriptions = createDatabaseWebhookStore(db);

let openDeliveries: ((subscriptionId: string, payload: string) => Promise<void>) | null = null;

const events = createWebhookEventBus({
  subscriptions: webhookSubscriptions,
  enqueue: async (subscriptionId, payload) => {
    if (openDeliveries === null) {
      throw new Error('the delivery queue was not open yet');
    }

    await openDeliveries(subscriptionId, payload);
  },
  onProblem: (reason) => {
    log.error('server', `events: ${reason}`);
  },
});
const notifications = createDatabaseNotificationStore(db);

/**
 * The identity push services check this server by, made on first need and then kept. Generated here
 * rather than configured, because the keys mean nothing outside this server and asking an operator
 * to make a key pair before they can be told about new films would be a poor trade.
 */
const readPushKeys = async (): Promise<VapidKeys> => {
  const held = await settings.read();

  if (held.pushPublicKey !== '' && held.pushPrivateKey !== '') {
    return { publicKey: held.pushPublicKey, privateKey: held.pushPrivateKey };
  }

  const made = webPush.generateVAPIDKeys();

  await settings.write({ pushPublicKey: made.publicKey, pushPrivateKey: made.privateKey });

  return { publicKey: made.publicKey, privateKey: made.privateKey };
};

const transcoderWatch = createReachabilityWatch({
  onLost: () => {
    log.warn('transcoder', 'transcoder: stopped answering');

    void events.publish({
      event: 'transcoder.unreachable',
      data: { reason: `${env.TRANSCODER_URL} did not answer a health check.` },
    });
  },
  onRegained: () => {
    log.info('transcoder', 'transcoder: answering again');

    void events.publish({ event: 'transcoder.reachable', data: {} });
  },
});

const requestsSetup = readRequestsSetup(env.REQUESTS_URL, env.REQUESTS_SECRET);

if (requestsSetup.kind === 'incomplete') {
  log.warn(
    'requests',
    `requesting is left off, since ${requestsSetup.missing} is missing or too short; it needs REQUESTS_URL and a REQUESTS_SECRET of at least 32 characters`,
  );
}

const requestsClient =
  requestsSetup.kind === 'on'
    ? createRequestsClient({ address: requestsSetup.address, secret: requestsSetup.secret, fetch })
    : null;

const requests =
  requestsSetup.kind === 'on' && requestsClient !== null
    ? createRequestsMonitor({
        address: requestsSetup.address,
        client: requestsClient,
        onLost: (reason) => {
          log.warn('requests', `the requests service stopped answering — ${reason}`);

          void events.publish({ event: 'requests.unreachable', data: { reason } });
        },
        onRegained: () => {
          log.info('requests', 'the requests service is answering again');

          void events.publish({ event: 'requests.reachable', data: {} });
        },
        onVpnDown: (reason) => {
          log.warn('requests', `the VPN is down — ${reason}`);

          void events.publish({ event: 'requests.vpnDown', data: { reason } });
        },
        onVpnUp: (vpn) => {
          log.info('requests', 'the VPN is up');

          void events.publish({
            event: 'requests.vpnUp',
            data: { publicAddress: vpn.publicAddress, country: vpn.country },
          });
        },
        onIndexerFailing: ({ name, problem }) => {
          log.warn('requests', `the indexer ${name} keeps failing — ${problem}`);

          void events.publish({ event: 'requests.indexerFailing', data: { name, problem } });
        },
        onIndexerWorking: ({ name }) => {
          log.info('requests', `the indexer ${name} is working again`);

          void events.publish({ event: 'requests.indexerWorking', data: { name } });
        },
      })
    : null;

const jobDefinitions = jobDefinitionsFor(requests !== null);

const diskWatch = createDiskPressureWatch({
  onLow: (disk) => {
    log.warn('server', `disk: ${disk.mountPoint} is running out of room`);

    void events.publish({ event: 'disk.low', data: disk });
  },
  onRecovered: (disk) => {
    log.info('server', `disk: ${disk.mountPoint} has room again`);

    void events.publish({ event: 'disk.recovered', data: disk });
  },
});

/**
 * Everywhere Valence writes: the library folders and the image cache. This is what the disk warnings are
 * measured against, since a filesystem filling up only matters where something is filling it.
 */
const pathsValenceWritesTo = async (): Promise<string[]> => [
  ...(await libraryService.list(asTheServer)).map((entry) => entry.path),
  env.IMAGE_CACHE_DIR,
];

const catalogueWatch = createReachabilityWatch({
  onLost: () => {
    void events.publish({ event: 'catalogue.unreachable', data: {} });
  },
  onRegained: () => {
    void events.publish({ event: 'catalogue.reachable', data: {} });
  },
});

const jobHealth = createJobHealthWatch({
  onStalled: ({ kind, failures, everSucceeded, reason }) => {
    const label = labelForQueue(kind);

    log.error(
      'jobs',
      everSucceeded
        ? `${label} has failed every time it has run since it last worked — ${failures.toString()} attempts, most recently: ${reason}`
        : `${label} has never once succeeded — ${failures.toString()} attempts, most recently: ${reason}`,
    );

    void events.publish({
      event: 'job.stalled',
      data: { kind, label, failures, everSucceeded, reason },
    });
  },
  onWorking: (kind) => {
    const label = labelForQueue(kind);

    log.info('jobs', `${label} has run without failing.`);

    void events.publish({ event: 'job.working', data: { kind, label } });
  },
});

const SCHEDULE_TRIGGER_SUFFIX = '.scheduled';

/**
 * Names the library a job was about, so that a delivery says "Movies" rather than the identifier the
 * queue happens to carry. A subject that is not a library, or one that has since been deleted, has
 * no name and is reported as none rather than as a bare identifier.
 *
 * @param subject - What the job was about, as the queue recorded it.
 * @returns The library's name, or nothing.
 */
const nameOfLibrary = async (subject: string | null): Promise<string | null> =>
  subject === null
    ? null
    : ((await libraryService.list(asTheServer)).find((one) => one.id === subject)?.name ?? null);

/**
 * Announces a job that has ended, to whatever is subscribed.
 *
 * Says nothing about the job that does the announcing, which would announce its own announcements
 * for ever, and nothing about a schedule's trigger, which exists only to enqueue the real work and
 * would otherwise report every scan twice. Nor about anything finishing that `announcesCompletion`
 * judges not worth saying — though anything failing is still announced, whatever it is.
 *
 * @param finished - Which job ended, what it was about, and whether it succeeded.
 */
const announceFinishedJob = (finished: FinishedJob): void => {
  const { kind, jobId, subject, reason } = finished;

  if (kind === DELIVER_WEBHOOK_JOB) {
    return;
  }

  jobHealth.record(finished);

  if (kind.endsWith(SCHEDULE_TRIGGER_SUFFIX)) {
    return;
  }

  if (reason === null && !announcesCompletion(kind)) {
    return;
  }

  void (async () => {
    const about = {
      kind,
      label: labelForQueue(kind),
      jobId,
      subject,
      subjectName: await nameOfLibrary(subject),
    };

    await events.publish(
      reason === null
        ? { event: 'job.completed', data: about }
        : { event: 'job.failed', data: { ...about, reason } },
    );

    realtime.publish(
      'jobs',
      { event: reason === null ? 'completed' : 'failed', ...about },
      {
        kind: 'everyone',
      },
    );
  })();
};

const jobs = await createJobQueue({
  connectionString: env.DATABASE_URL,
  handlers: traceJobs(
    {
      [SCAN_LIBRARY_JOB]: async (jobId, payload) => {
        const parsed = ScanLibraryJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error('jobs', 'job queue: a scan job carried data Valence could not read.');

          return;
        }

        const { libraryId, force, runId, runOf } = parsed.data;

        await runLibraryWork(SCAN_LIBRARY_JOB, libraryId, payload, async () => {
          const libraries = await libraryService.list(asTheServer);
          const scanned = libraries.find((entry) => entry.id === libraryId);
          const isMusic = scanned?.kind === 'music';

          await runScanPhases({
            work: {
              scan: () => libraryService.runScan(libraryId, force, jobId),
              lookUp: () =>
                isMusic ? lookUpMusic(libraryId, jobId, force === true) : Promise.resolve(),
            },
            isCancelled: () => jobs.isCancelled(jobId),
            onRead: async () => {
              if (isMusic) {
                return;
              }

              await libraryService.fetchLogos(libraryId);
              await libraryService.detectSegments(libraryId);
              await libraryService.regeneratePreviews(libraryId);
              await libraryService.regenerateTrickplay(libraryId);
            },
            onScanned: async (result) => {
              jobs.reportProgress(
                jobId,
                `added ${result.added.toString()}, updated ${result.updated.toString()}, removed ${result.removed.toString()}`,
                1,
                1,
              );

              const libraryName = scanned?.name ?? 'A library';
              const arrived = await sayWhatAScanChanged(
                libraryId,
                { name: libraryName, kind: scanned?.kind ?? 'movies' },
                result,
              );

              const summarised = summariseArrivals(arrived, ARRIVED_TITLES_KEPT);

              scanRuns.record(runId ?? `${LONE_SCAN}:${jobId}`, runOf ?? 1, {
                libraryId,
                libraryName,
                ...result,
                arrived: summarised.listed,
                arrivedNotListed: summarised.notListed,
              });
            },
          });
        });
      },
      [SCAN_REQUEST_FOLDER_JOB]: async (jobId, payload) => {
        const parsed = ScanRequestFolderJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error(
            'jobs',
            'job queue: a request’s folder scan carried data Valence could not read.',
          );

          return;
        }

        const filed = parsed.data;

        await runLibraryWork(SCAN_REQUEST_FOLDER_JOB, filed.libraryId, payload, async () => {
          const result = await libraryService.runScanFolder(filed.libraryId, filed.folder, jobId);
          const scanned = (await libraryService.list(asTheServer)).find(
            (entry) => entry.id === filed.libraryId,
          );

          if (result === null || scanned === undefined) {
            log.warn('requests', `${filed.title} was filed into a library that is not there now`);

            return;
          }

          await sayWhatAScanChanged(filed.libraryId, scanned, result);

          if (scanned.kind !== 'music') {
            await libraryService.regeneratePreviews(filed.libraryId);
            await libraryService.regenerateTrickplay(filed.libraryId);
          }

          const { request } = filed;

          if (request === null) {
            jobs.reportProgress(jobId, `added ${result.added.toString()}`, 1, 1);

            return;
          }

          const catalogueId = request.musicBrainzId ?? request.tmdbId?.toString() ?? '';
          const mediaId = isMusicRequest(request.kind)
            ? request.musicBrainzId === null
              ? null
              : await tieRequestedAlbum(
                  requestedAlbums,
                  filed.libraryId,
                  request.musicBrainzId,
                  filed.folder,
                )
            : request.tmdbId === null
              ? null
              : await libraryService.findByCatalogueId(
                  filed.libraryId,
                  request.kind,
                  request.tmdbId.toString(),
                );

          jobs.reportProgress(jobId, mediaId === null ? 'not found' : 'found', 1, 1);

          if (mediaId === null) {
            log.warn(
              'requests',
              `${filed.title} was filed, but reading ${filed.folder} did not find it as the catalogue’s ${catalogueId}`,
            );

            return;
          }

          await sayARequestArrived({ ...request, title: filed.title }, mediaId);
        });
      },
      [REFRESH_REQUESTS_JOB]: async (jobId) => {
        if (requestsClient === null) {
          return;
        }

        const followed = await requestsClient.followedRequests();

        if (followed.kind !== 'answered') {
          log.warn(
            'requests',
            'refreshing requests: the requests service would not say what it follows',
          );

          return;
        }

        const libraries = await libraryService.list(asTheServer);
        let done = 0;

        for (const request of followed.value) {
          jobs.reportProgress(jobId, 'asking the catalogue', done, followed.value.length);

          const catalogue = await catalogueForRequest(
            { describeForRequest, describeMusicForRequest },
            request,
          );
          const libraryPath = libraries.find((entry) => entry.id === request.libraryId)?.path;

          if (catalogue !== null) {
            await requestsClient.updateRequestCatalogue(request.id, {
              catalogue,
              ...(libraryPath === undefined ? {} : { libraryPath }),
            });
          }

          done += 1;
        }

        jobs.reportProgress(jobId, `${done.toString()} brought up to date`, done, done);
      },
      [READ_AGAIN_JOB]: async (jobId, payload) => {
        const parsed = ReadAgainJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error('jobs', 'job queue: a re-read job carried data Valence could not read.');

          return;
        }

        const { libraryId, paths } = parsed.data;

        await runLibraryWork(READ_AGAIN_JOB, libraryId, payload, async () => {
          await libraryService.runReadAgain(libraryId, paths, jobId);
        });
      },
      [REGENERATE_PREVIEWS_JOB]: async (jobId, payload) => {
        const parsed = RegeneratePreviewsJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error(
            'jobs',
            'job queue: a preview regeneration job carried data Valence could not read.',
          );

          return;
        }

        await runLibraryWork(REGENERATE_PREVIEWS_JOB, parsed.data.libraryId, payload, () =>
          libraryService.runRegeneratePreviews(
            parsed.data.libraryId,
            parsed.data.defaultAudioLanguage,
            jobId,
          ),
        );
      },
      [REGENERATE_TRICKPLAY_JOB]: async (jobId, payload) => {
        const parsed = RegenerateTrickplayJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error('jobs', 'job queue: a trickplay job carried data Valence could not read.');

          return;
        }

        await runLibraryWork(REGENERATE_TRICKPLAY_JOB, parsed.data.libraryId, payload, () =>
          libraryService.runRegenerateTrickplay(parsed.data.libraryId, jobId),
        );
      },
      [FETCH_LOGOS_JOB]: async (jobId, payload) => {
        const parsed = FetchLogosJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error('jobs', 'job queue: a logo job carried data Valence could not read.');

          return;
        }

        await runLibraryWork(FETCH_LOGOS_JOB, parsed.data.libraryId, payload, () =>
          libraryService.runFetchLogos(parsed.data.libraryId, jobId),
        );
      },
      [CLEAR_LIBRARY_PARTS_JOB]: async (jobId, payload) => {
        const parsed = ClearLibraryPartsJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error('jobs', 'job queue: a clearing job carried data Valence could not read.');

          return;
        }

        await runLibraryWork(CLEAR_LIBRARY_PARTS_JOB, parsed.data.libraryId, payload, () =>
          libraryService.runClearParts(parsed.data.libraryId, parsed.data.parts, jobId),
        );
      },
      [DETECT_SEGMENTS_JOB]: async (jobId, payload) => {
        const parsed = DetectSegmentsJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error(
            'jobs',
            'job queue: a segment detection job carried data Valence could not read.',
          );

          return;
        }

        await runLibraryWork(DETECT_SEGMENTS_JOB, parsed.data.libraryId, payload, () =>
          runDetectSegments(parsed.data.libraryId, jobId),
        );
      },
      [CLEANUP_IMAGE_CACHE_JOB]: async (jobId) => {
        const removed = await cleanupImageCache({
          imageCacheDir: env.IMAGE_CACHE_DIR,
          profilesDir: env.PROFILE_IMAGE_DIR,
          files: {
            list: async (directory) => {
              const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);

              return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
            },
            remove: (path) => unlink(path),
          },
          nameFor: images.nameFor,
          listMediaImageUrls: () =>
            db
              .select({ posterUrl: mediaItem.posterUrl, backdropUrl: mediaItem.backdropUrl })
              .from(mediaItem),
          listKeptPictures: async () => {
            const faces = await db
              .select({ photoPath: viewerProfile.photoPath })
              .from(viewerProfile);

            const households = await db
              .select({ photoPath: userProfile.photoPath })
              .from(userProfile);

            return [
              ...faces.map((row) => row.photoPath),
              ...households.map((row) => row.photoPath),
              (await settings.read()).splashscreenFile,
            ];
          },
          musicDir: musicArtworkDir,
          listMusicArtwork: async () => {
            const albums = await db.select({ path: musicAlbum.artworkPath }).from(musicAlbum);
            const artists = await db.select({ path: musicArtist.imagePath }).from(musicArtist);

            return [...albums, ...artists].map((row) => row.path);
          },
          onProblem: (path, reason) => {
            log.error('server', `image cache: ${path}: ${reason}`);
            void jobHistory.recordIssue({ jobRunId: jobId, path, reason }).catch(() => {});
          },
          onProgress: (phase, processed, total) => {
            jobs.reportProgress(jobId, phase, processed, total);
          },
        });

        const pagesRemoved = await sweepBookPages({
          directory: bookPagesDir,
          nowMs: Date.now(),
          files: {
            listChapters: async (directory) => {
              const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
              const folders = entries.filter((entry) => entry.isDirectory());
              const read = await Promise.all(
                folders.map(async (entry) => ({
                  name: entry.name,
                  lastReadMs:
                    (await stat(join(directory, entry.name)).catch(() => null))?.mtimeMs ??
                    Date.now(),
                })),
              );

              return read;
            },
            listPages: (directory) => readdir(directory).catch(() => []),
            removeChapter: (path) => rm(path, { recursive: true, force: true }),
            removePage: (path) => unlink(path),
            setLastRead: (path, atMs) => utimes(path, new Date(atMs), new Date(atMs)),
          },
          listChapterIds: async () =>
            (await db.select({ id: bookChapter.id }).from(bookChapter)).map((row) => row.id),
          onProblem: (path, reason) => {
            log.error('server', `book pages: ${path}: ${reason}`);
            void jobHistory.recordIssue({ jobRunId: jobId, path, reason }).catch(() => {});
          },
          onProgress: (processed, total) => {
            jobs.reportProgress(jobId, 'books', processed, total);
          },
        });

        log.info(
          'server',
          `image cache cleanup: removed ${removed.toString()} file(s) and ${pagesRemoved.toString()} book chapter(s) or page(s)`,
        );
        void bookPageUsage.refresh();
      },
      [REENCODE_JOB]: async (jobId) => {
        await reencodeService.work(
          (processed, total) => {
            jobs.reportProgress(jobId, 'encoding', processed, total);
          },
          () => jobs.isCancelled(jobId),
        );
      },
      [CLEANUP_ARTEFACT_CACHE_JOB]: async () => {
        const swept = await sweepArtefactCache({
          quality: (await settings.read()).previewQuality,
          listLiveItems: async () => {
            const rows = await db
              .select({
                path: mediaItem.path,
                audioStreams: mediaItem.audioStreams,
                generation: library.generation,
                defaultAudioLanguage: library.defaultAudioLanguage,
                atSeconds: mediaPreviewOverride.atSeconds,
                clipSeconds: mediaPreviewOverride.durationSeconds,
              })
              .from(mediaItem)
              .innerJoin(library, eq(library.id, mediaItem.libraryId))
              .leftJoin(
                mediaPreviewOverride,
                and(
                  eq(mediaPreviewOverride.libraryId, mediaItem.libraryId),
                  eq(mediaPreviewOverride.path, mediaItem.path),
                ),
              );

            return rows.map((row) => ({
              path: row.path,
              audioStreams: z.array(AudioStreamSchema).parse(row.audioStreams),
              generation: row.generation,
              defaultAudioLanguage: row.defaultAudioLanguage,
              previewMoment:
                row.atSeconds === null
                  ? null
                  : { atSeconds: row.atSeconds, durationSeconds: row.clipSeconds },
            }));
          },
          trickplay: {
            intervalSeconds: TRICKPLAY_INTERVAL_SECONDS,
            tileWidth: TRICKPLAY_TILE_WIDTH,
            columns: TRICKPLAY_COLUMNS,
            rows: TRICKPLAY_ROWS,
          },
          transcoder,
          onProblem: (what, reason) => {
            log.error('server', `artefact cache: ${what}: ${reason}`);

            const jobRunId = jobIdInScope();

            if (jobRunId !== null) {
              void jobHistory.recordIssue({ jobRunId, path: what, reason }).catch(() => {});
            }
          },
        });

        log.info(
          'server',
          `artefact cache cleanup: removed ${swept.removed.toString()} directory(ies), freed ${swept.freedBytes.toString()} byte(s), kept ${swept.kept.toString()}, skipped ${swept.tooNew.toString()} as too new`,
        );
      },
      [READ_CERTIFICATES_AGAIN_JOB]: async () => {
        const region = (await settings.read()).certificationRegion;
        const { looked, rated } = await readCertificatesAgain(db, region);

        log.info(
          'server',
          `certificates: read ${looked.toString()} again in ${region}, ${rated.toString()} of them certificated here`,
        );
      },
      [PRUNE_HISTORY_JOB]: async () => {
        const forgotten = await historyService.prune(
          new Date(Date.now() - HISTORY_KEPT_FOR_DAYS * 86_400_000),
        );

        log.info('server', `history: forgot ${forgotten.toString()} old viewings`);
      },
      [CLEANUP_SESSIONS_JOB]: async (jobId) => {
        const removed = await cleanupSessions({
          deleteExpiredSessions: async () => {
            const rows = await db
              .delete(session)
              .where(lt(session.expiresAt, new Date()))
              .returning({ id: session.id });

            return rows.length;
          },
          deleteExpiredDeviceCodes: async () => {
            const rows = await db
              .delete(deviceCode)
              .where(lt(deviceCode.expiresAt, new Date()))
              .returning({ id: deviceCode.id });

            return rows.length;
          },
          onProgress: (phase, processed, total) => {
            jobs.reportProgress(jobId, phase, processed, total);
          },
        });

        log.info('server', `session cleanup: removed ${removed.toString()} row(s)`);
      },
      [CHECK_CATALOGUE_CONNECTIVITY_JOB]: async (jobId) => {
        jobs.reportProgress(jobId, 'checking', 0, 1);

        const reachable = await checkCatalogueConnectivity({
          readApiKey: async () => (await settings.read()).catalogueApiKey,
        });

        jobs.reportProgress(jobId, reachable ? 'reachable' : 'unreachable', 1, 1);
        log.info('catalogue', `catalogue connectivity: ${reachable ? 'reachable' : 'unreachable'}`);

        catalogueWatch.record(reachable);
      },
      [CHECK_TRANSCODER_JOB]: async (jobId) => {
        jobs.reportProgress(jobId, 'checking', 0, 1);

        const reachable = await transcoder.isReachable();

        jobs.reportProgress(jobId, reachable ? 'reachable' : 'unreachable', 1, 1);

        transcoderWatch.record(reachable);
      },
      [CHECK_REQUESTS_JOB]: async (jobId) => {
        if (requests === null) {
          return;
        }

        jobs.reportProgress(jobId, 'checking', 0, 1);

        const reachable = await requests.check();

        jobs.reportProgress(jobId, reachable ? 'reachable' : 'unreachable', 1, 1);
      },
      [CHECK_DISK_SPACE_JOB]: async (jobId) => {
        jobs.reportProgress(jobId, 'reading', 0, 1);

        const reading = MonitorDisksSchema.safeParse(await transcoder.readMonitor());

        if (!reading.success) {
          log.warn('server', 'disk: the monitor did not say what the filesystems hold');

          return;
        }

        const { disks } = reading.data.resources;
        const paths = await pathsValenceWritesTo();
        const mounts = [...new Set(paths.flatMap((path) => findMountFor(path, disks) ?? []))];

        diskWatch.record(mounts, findDisksUnderPressure(paths, disks));

        jobs.reportProgress(jobId, `${mounts.length.toString()} checked`, 1, 1);
      },
      [SEND_MEDIA_DIGEST_JOB]: async (jobId) => {
        jobs.reportProgress(jobId, 'reading', 0, 1);

        const now = new Date();
        const { since, announce } = readDigestWindow(
          (await settings.read()).mediaDigestReadTo,
          now,
        );

        await settings.write({ mediaDigestReadTo: now.toISOString() });

        if (!announce) {
          log.info('server', 'digest: first run, noting where to read from next time');

          return;
        }

        const arrived = await db
          .select({
            id: mediaItem.id,
            title: mediaItem.title,
            seriesId: mediaItem.seriesId,
            seriesTitle: mediaItem.seriesTitle,
            albumId: musicTrack.albumId,
            albumTitle: musicAlbum.title,
          })
          .from(mediaItem)
          .leftJoin(musicTrack, eq(musicTrack.mediaItemId, mediaItem.id))
          .leftJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId))
          .where(
            and(
              gt(mediaItem.addedAt, since),
              lte(mediaItem.addedAt, now),
              isNull(mediaItem.extraKind),
            ),
          );

        const summary = summariseNewMedia(arrived);

        jobs.reportProgress(jobId, `${arrived.length.toString()} arrived`, 1, 1);

        if (summary === null) {
          return;
        }

        await notifyHousehold({
          store: notifications,
          event: 'media.added',
          title: summary.title,
          body: summary.body,
          link: summary.link,
          vapid: await readPushKeys(),
          onProblem: (reason) => {
            log.error('server', `digest: ${reason}`);
          },
          announce: (userIds) => {
            realtime.publish(
              'notifications',
              { event: 'media.added' },
              { kind: 'accounts', accountIds: [...userIds] },
            );
          },
        });

        realtime.publish('media', { added: arrived.length }, { kind: 'everyone' });
      },
      [PRUNE_WEBHOOK_DELIVERIES_JOB]: async () => {
        const forgotten = await webhookSubscriptions.pruneDeliveries(
          new Date(Date.now() - WEBHOOK_DELIVERIES_KEPT_FOR_DAYS * 86_400_000),
        );

        log.info('server', `webhooks: forgot ${forgotten.toString()} old deliveries`);
      },
      [PRUNE_LOGS_JOB]: async () => {
        await log.flush();

        const forgotten = await logStore.forgetExpired(Date.now());

        log.info('server', `logs: forgot ${forgotten.toString()} old records`);
      },
      [PRUNE_JOB_HISTORY_JOB]: async () => {
        await jobHistory.forgetExpired(Date.now());

        log.info('server', 'job history: forgot runs older than 30 days');
      },
      [PRUNE_RESOURCE_HISTORY_JOB]: async () => {
        await resourceHistory.forgetExpired(Date.now());

        log.info('server', 'resource history: forgot samples older than 7 days');
      },
      [DELIVER_WEBHOOK_JOB]: async (_jobId, payload) => {
        const parsed = DeliverWebhookJobSchema.safeParse(payload);

        if (!parsed.success) {
          log.error('jobs', 'job queue: a delivery job carried data Valence could not read.');

          return;
        }

        const delivered = await runWebhookDelivery({
          subscriptions: webhookSubscriptions,
          subscriptionId: parsed.data.subscriptionId,
          payload: parsed.data.payload,
        });

        if (!delivered) {
          throw new Error(`The delivery to ${parsed.data.subscriptionId} did not land.`);
        }
      },
      [scheduleTriggerKind(SCAN_LIBRARY_JOB)]: scheduleAcrossLibraries((id) =>
        libraryService.scan(id, false),
      ),
      [scheduleTriggerKind(REGENERATE_PREVIEWS_JOB)]: scheduleAcrossLibraries((id) =>
        libraryService.regeneratePreviews(id),
      ),
      [scheduleTriggerKind(REGENERATE_TRICKPLAY_JOB)]: scheduleAcrossLibraries((id) =>
        libraryService.regenerateTrickplay(id),
      ),
      [scheduleTriggerKind(DETECT_SEGMENTS_JOB)]: scheduleAcrossLibraries((id) =>
        libraryService.detectSegments(id),
      ),
      [scheduleTriggerKind(RESET_LIBRARY_JOB)]: scheduleAcrossLibraries((id) =>
        libraryService.reset(id),
      ),
    },
    logScope,
  ),
  onProblem: (message) => {
    log.error('jobs', `job queue: ${message}`);
  },
  onStarted: async (entry) => {
    realtime.publish('jobs', { event: 'started', ...entry }, { kind: 'everyone' });

    await jobHistory
      .recordStarted({ id: entry.jobId, kind: entry.kind, subject: entry.subject })
      .catch(() => {});
  },
  onProgress: (entry) => {
    void jobHistory
      .recordProgress({
        id: entry.jobId,
        progress: { phase: entry.phase, processed: entry.processed, total: entry.total },
      })
      .catch(() => {});
    realtime.publish('jobs', { event: 'progress', ...entry }, { kind: 'everyone' });
  },
  onFinished: (finished) => {
    announceFinishedJob(finished);
    void jobHistory
      .recordFinished({
        id: finished.jobId,
        status: finished.reason === null ? 'completed' : 'failed',
        errorMessage: finished.reason,
      })
      .catch(() => {});
  },
});

const runLibraryWork = createLibraryWorkRunner({
  inProcess: libraryWork,
  acrossProcesses: librariesAcrossProcesses,
  jobs: {
    enqueueAfter: (kind, payload, seconds, singletonKey) =>
      jobs.enqueueAfter(kind, payload, seconds, singletonKey),
  },
  onDeferred: (kind, libraryId) => {
    log.info('jobs', `${kind}: another process has ${libraryId}, asking again shortly`);
  },
});

/**
 * Queues one webhook delivery to one subscriber. Queued rather than sent inline so a slow or
 * unreachable subscriber delays nothing, and so a failed delivery can be retried on its own.
 *
 * @param subscriptionId - Who is being delivered to.
 * @param payload - The event to deliver.
 */
const queueWebhookDelivery = async (subscriptionId: string, payload: string): Promise<void> => {
  await jobs.enqueue(DELIVER_WEBHOOK_JOB, { subscriptionId, payload });
};

openDeliveries = queueWebhookDelivery;

const maintenance = createDatabaseMaintenanceService({ jobs });
const schedules = createJobScheduleService({
  store: createDatabaseJobTriggerStore(db),
  jobs,
  definitions: jobDefinitions,
  readTimezone: async () =>
    resolveJobsTimezone({
      configured: (await settings.read()).jobsTimezone,
      environment: process.env['TZ'],
      host: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
});

const catalogueProvider = createCatalogueMetadataProvider({
  readApiKey: async () => (await settings.read()).catalogueApiKey,
  readWantsTrailers: async () => (await settings.read()).fetchesCatalogueTrailers,
  onProblem: (reason) => {
    log.error('catalogue', `catalogue: ${reason}`);
  },
});

const arrivals = new Map<string, ScannedItem[]>();
const departures = new Map<string, ScannedItem[]>();

/**
 * Keeps what a scan changed until the scan ends, so that arrivals can be reported as a list as well
 * as one at a time. A library scans under a mutex, so one list per library is enough.
 *
 * @param held - Where to keep it.
 * @param libraryId - The library being scanned.
 * @param items - What changed.
 */
const remember = (held: Map<string, ScannedItem[]>, libraryId: string, items: ScannedItem[]) => {
  held.set(libraryId, [...(held.get(libraryId) ?? []), ...items]);
};

const SCAN_GIVES_UP_AFTER_MILLISECONDS = 600_000;

const LONE_SCAN = 'a scan on its own';

const scanRuns = collectScanRuns({
  givesUpAfterMilliseconds: SCAN_GIVES_UP_AFTER_MILLISECONDS,
  onFinished: (report) => {
    void events.publish({ event: 'library.scanned', data: report });
  },
});

const libraryService = createDatabaseLibraryService({
  db,
  files: createMediaFileSystem(),
  transcoder,
  forcedAccel: async () => (await settings.read()).hardwareAccel,
  jobs,
  providers: [catalogueProvider, createFilenameMetadataProvider()],
  books: bookService,
  images: { forget: (url) => images.forget(url) },
  music: {
    store: musicStore,
    artwork: musicArtwork,
    files: createMusicFileSystem(),
  },
  atOnce: env.MEDIA_JOBS,
  previewQuality: async () => (await settings.read()).previewQuality,
  certificationRegion: async () => (await settings.read()).certificationRegion,
  onProblem: (path, reason) => {
    log.warn('scanner', `skipped ${path}: ${reason}`);

    const jobRunId = jobIdInScope();

    if (jobRunId !== null) {
      void jobHistory.recordIssue({ jobRunId, path, reason }).catch(() => {});
    }
  },
  onArrived: (libraryId, item) => {
    remember(arrivals, libraryId, [item]);
  },
  onDeparted: (libraryId, items) => {
    remember(departures, libraryId, items);
  },
});

/**
 * Tells anything subscribed what a scan brought in and took out, and every open page that the
 * library changed, handing back what arrived.
 *
 * @param libraryId - The library scanned.
 * @param scanned - Its name and kind.
 * @param result - What the scan changed.
 * @returns What arrived.
 */
const sayWhatAScanChanged = async (
  libraryId: string,
  scanned: { name: string; kind: LibraryKind },
  result: ScanResult,
): Promise<ScannedItem[]> => {
  const arrived = arrivals.get(libraryId) ?? [];
  const departed = departures.get(libraryId) ?? [];

  arrivals.delete(libraryId);
  departures.delete(libraryId);

  const named = (item: ScannedItem) => ({
    ...item,
    kind: mediaKindOf(item, scanned.kind),
    libraryId,
    libraryName: scanned.name,
  });

  for (const item of arrived) {
    await events.publish({ event: 'media.added', data: named(item) });
  }

  for (const item of departed) {
    await events.publish({ event: 'media.removed', data: named(item) });
  }

  if (result.added + result.updated + result.removed > 0) {
    realtime.publish('media', { added: result.added }, { kind: 'everyone' });
  }

  return arrived;
};

/**
 * What the catalogue says about a film or series somebody is asking for.
 *
 * @param tmdbId - Its catalogue id.
 * @param kind - Whether it is a film or a series.
 * @returns What a request needs to know, or null where the catalogue would not say.
 */
const describeForRequest = async (
  tmdbId: number,
  kind: VideoRequestKind,
): Promise<RequestCatalogue | null> =>
  (await catalogueProvider.describeForRequest?.(
    tmdbId.toString(),
    kind === 'film' ? 'movie' : 'tv',
  )) ?? null;

/**
 * What MusicBrainz knows of an artist or an album asked for.
 *
 * @param musicBrainzId - The artist, or the album's release group.
 * @param kind - Whether it is an artist or an album.
 * @returns What a request keeps of it, or null where MusicBrainz does not know it.
 */
const describeMusicForRequest = (
  musicBrainzId: string,
  kind: MusicRequestKind,
  mostPages?: number,
): Promise<RequestCatalogue | null> =>
  kind === 'artist'
    ? describeArtistForRequest(musicWeb, musicBrainzId, mostPages)
    : describeAlbumForRequest(musicWeb, musicBrainzId);

const requestedAlbums = createDatabaseRequestedAlbumStore(db);

const CHARTS_LIVE_FOR_MS = 6 * 60 * 60 * 1000;

const charted = createExpiringCache<Promise<DeezerCharts>>(CHARTS_LIVE_FOR_MS);

const studioed = createExpiringCache<Promise<CatalogueStudio[]>>(CHARTS_LIVE_FOR_MS);

const ALBUM_PAGES_SHOWN = 3;

const described = createExpiringCache<Promise<RequestCatalogue | null>>(CHARTS_LIVE_FOR_MS);

const foundOnMusicBrainz = createExpiringCache<Promise<string | null>>(CHARTS_LIVE_FOR_MS);

/**
 * Keeps an answer for as long as the charts are kept, so opening the same album twice asks
 * MusicBrainz once. MusicBrainz answers a request a second, and a page somebody is waiting on is
 * the worst place to spend that.
 *
 * @param kept - The cache to keep it in.
 * @param key - What it is kept under.
 * @param read - How to read it where it is not kept yet.
 * @returns The answer.
 */
const keeping = <T>(
  kept: ReturnType<typeof createExpiringCache<Promise<T>>>,
  key: string,
  read: () => Promise<T>,
): Promise<T> => {
  const already = kept.get(key);

  if (already !== undefined) {
    return already;
  }

  const reading = read();

  kept.set(key, reading);

  return reading;
};

const discovery: Discovery = {
  browse: (browsing) =>
    catalogueProvider.browse?.(browsing) ?? Promise.resolve({ matches: [], hasMore: false }),
  studios: () => {
    const kept = studioed.get('studios');

    if (kept !== undefined) {
      return kept;
    }

    const reading = catalogueProvider.studios?.() ?? Promise.resolve([]);

    studioed.set('studios', reading);

    return reading;
  },
  charts: () => {
    const kept = charted.get('charts');

    if (kept !== undefined) {
      return kept;
    }

    const reading = readDeezerCharts(musicWeb);

    charted.set('charts', reading);

    return reading;
  },
  describeTitle: (tmdbId, kind) =>
    catalogueProvider.describeTitle?.(tmdbId, kind) ?? Promise.resolve(null),
  describeMusic: (musicBrainzId, kind) =>
    keeping(described, `${kind}:${musicBrainzId}`, () =>
      describeMusicForRequest(musicBrainzId, kind, ALBUM_PAGES_SHOWN),
    ),
  findOnMusicBrainz: (kind, deezerId) =>
    keeping(foundOnMusicBrainz, `${kind}:${deezerId.toString()}`, () =>
      findOnMusicBrainz(musicWeb, kind, deezerId),
    ),
  lookup: createDatabaseCatalogueLookup(db),
};

const LINKS_TO_ARRIVALS: Record<MediaRequestKind, (mediaId: string) => string> = {
  film: (mediaId) => `/?item=${mediaId}`,
  series: (mediaId) => `/?show=${mediaId}`,
  artist: (mediaId) => `/music?listen=album:${mediaId}`,
  album: (mediaId) => `/music?listen=album:${mediaId}`,
};

/**
 * Ties a request to the item the library found it as, and tells whoever asked that it is ready —
 * in the app, and by push where they chose — and anything subscribed.
 *
 * @param filed - The request, as it was filed.
 * @param mediaId - The film, the series, or the album the library found.
 */
const sayARequestArrived = async (
  filed: { id: string; kind: MediaRequestKind; title: string },
  mediaId: string,
): Promise<void> => {
  if (requestsClient === null) {
    return;
  }

  const arrived = await requestsClient.requestArrived(filed.id, mediaId);

  if (arrived.kind !== 'answered') {
    log.warn('requests', `${filed.title} is in the library, but the requests service was not told`);

    return;
  }

  const { requestedBy } = arrived.value;

  log.info('requests', `${filed.title} is in the library, as ${requestedBy.name} asked`);

  await events.publish({
    event: 'requests.available',
    data: { title: filed.title, requestedBy: requestedBy.name, mediaId },
  });
  await notifyHousehold({
    store: notifications,
    event: 'requests.available',
    title: `${filed.title} is ready`,
    body: `${filed.title}, which you asked for, is in the library now.`,
    link: LINKS_TO_ARRIVALS[filed.kind](mediaId),
    vapid: await readPushKeys(),
    only: [requestedBy.id],
    onProblem: (reason) => {
      log.error('requests', `telling ${requestedBy.name}: ${reason}`);
    },
    announce: (userIds) => {
      realtime.publish(
        'notifications',
        { event: 'requests.available' },
        { kind: 'accounts', accountIds: [...userIds] },
      );
    },
  });
};

/**
 * Finds where an item's file is on disk, which is what the subtitle services need before they can
 * look beside it or inside it.
 *
 * @param mediaId - The item.
 * @returns Its path, or null where the catalogue has no such item.
 */
const findMediaPath = async (mediaId: string): Promise<string | null> => {
  const rows = await db
    .select({ path: mediaItem.path })
    .from(mediaItem)
    .where(eq(mediaItem.id, mediaId))
    .limit(1);

  return rows[0]?.path ?? null;
};

/**
 * Reports a subtitle that could not be read, without failing the request that found it. A file with
 * a broken subtitle track should still play; the operator is told, and the viewer is not.
 *
 * @param path - The file the problem was in.
 * @param reason - What went wrong.
 */
const reportSubtitleProblem = (path: string, reason: string): void => {
  log.warn('scanner', `subtitles: ${path}: ${reason}`);
};

const subtitleService = createLayeredSubtitleService([
  createSidecarSubtitleService({
    media: { findPath: findMediaPath },
    onProblem: reportSubtitleProblem,
  }),
  createEmbeddedSubtitleService({
    media: {
      find: async (mediaId) => {
        const item = await libraryService.getMedia(mediaId);
        const path = await findMediaPath(mediaId);

        return item === null || path === null ? null : { path, streams: item.subtitleStreams };
      },
    },
    transcoder,
    canBurnImageSubtitles: async () =>
      transcoder
        .capabilities()
        .then((found) => found.canBurnImageSubtitles)
        .catch(() => false),
    onProblem: reportSubtitleProblem,
  }),
]);

const segmentService = createDatabaseSegmentService(db);

const segmentProviders = [
  createFingerprintSegmentProvider({
    transcoder,
    onProblem: (path, reason) => {
      log.warn('scanner', `segments ${path}: ${reason}`);

      const jobRunId = jobIdInScope();

      if (jobRunId !== null) {
        void jobHistory.recordIssue({ jobRunId, path, reason }).catch(() => {});
      }
    },
  }),
];

const images = createImageCache({
  directory: env.IMAGE_CACHE_DIR,
  onProblem: (url, reason) => {
    log.warn('scanner', `artwork ${url}: ${reason}`);

    const jobRunId = jobIdInScope();

    if (jobRunId !== null) {
      void jobHistory.recordIssue({ jobRunId, path: url, reason }).catch(() => {});
    }
  },
});

const bookPagesDir = join(env.IMAGE_CACHE_DIR, 'books');

const artworkUsage = createDiskUsage({ measure: () => measureArtwork(env.IMAGE_CACHE_DIR) });

const bookPageUsage = createDiskUsage({ measure: () => measureBookPages(bookPagesDir) });

artworkUsage.watch();
void artworkUsage.refresh();
bookPageUsage.watch();
void bookPageUsage.refresh();

const playbackService = createPlaybackService({
  media: {
    findForPlayback: async (mediaId) => {
      const item = await libraryService.getMedia(mediaId);

      if (item === null) {
        return null;
      }

      const rows = await db
        .select({
          path: mediaItem.path,
          defaultAudioLanguage: library.defaultAudioLanguage,
          generation: library.generation,
          atSeconds: mediaPreviewOverride.atSeconds,
          clipSeconds: mediaPreviewOverride.durationSeconds,
        })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .leftJoin(
          mediaPreviewOverride,
          and(
            eq(mediaPreviewOverride.libraryId, mediaItem.libraryId),
            eq(mediaPreviewOverride.path, mediaItem.path),
          ),
        )
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      const row = rows[0];

      if (row === undefined) {
        return null;
      }

      const kept = await db
        .select()
        .from(mediaRendition)
        .where(eq(mediaRendition.mediaItemId, mediaId));

      return {
        item,
        path: row.path,
        defaultAudioLanguage: row.defaultAudioLanguage,
        generation: row.generation,
        previewMoment:
          row.atSeconds === null
            ? null
            : { atSeconds: row.atSeconds, durationSeconds: row.clipSeconds },
        renditions: kept.map((one) => ({
          id: one.id,
          path: one.path,
          item: MediaItemSchema.parse({ ...one, id: one.id, title: item.title }),
        })),
      };
    },
  },
  transcoder,
  sessionUrlPrefix: '/api/playback/session',
  directUrlPrefix: '/api/playback',
  trickplayUrlPrefix: '/api/playback/trickplay',
  forcedAccel: async () => (await settings.read()).hardwareAccel,
  previewQuality: async () => (await settings.read()).previewQuality,
});

const downloadService = createDownloadService({
  db,
  media: {
    findForPlayback: async (mediaId) => {
      const item = await libraryService.getMedia(mediaId);

      if (item === null) {
        return null;
      }

      const rows = await db
        .select({
          path: mediaItem.path,
          sizeBytes: mediaItem.sizeBytes,
          generation: library.generation,
        })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      const row = rows[0];

      if (row === undefined) {
        return null;
      }

      const kept = await db
        .select()
        .from(mediaRendition)
        .where(eq(mediaRendition.mediaItemId, mediaId));

      return {
        item,
        path: row.path,
        sizeBytes: row.sizeBytes,
        generation: row.generation,
        renditions: kept.map((one) => ({
          id: one.id,
          path: one.path,
          item: MediaItemSchema.parse({ ...one, id: one.id, title: item.title }),
        })),
      };
    },
    titleOf: async (mediaId) => (await libraryService.getMedia(mediaId))?.title ?? null,
    episodesOf: async (seriesId) =>
      (await libraryService.itemsForShare({ kind: 'series', mediaId: null, seriesId })).map(
        (item) => ({ id: item.id, title: item.title }),
      ),
    seriesOf: async (mediaId) => {
      const seriesId = await libraryService.seriesOf(mediaId);

      return seriesId === null ? null : await libraryService.getSeries(seriesId);
    },
    keepingProfile,
  },
  transcoder,
  capabilities: async () => transcoder.capabilities(),
  forcedAccel: async () => (await settings.read()).hardwareAccel,
});

const reencodeService = createDatabaseReencodeService({
  db,
  media: {
    findForReencode: async (mediaId) => {
      const item = await libraryService.getMedia(mediaId);

      if (item === null) {
        return null;
      }

      const rows = await db
        .select({
          path: mediaItem.path,
          libraryId: mediaItem.libraryId,
          libraryPath: library.path,
          seriesTitle: mediaItem.seriesTitle,
        })
        .from(mediaItem)
        .innerJoin(library, eq(library.id, mediaItem.libraryId))
        .where(eq(mediaItem.id, mediaId))
        .limit(1);

      const row = rows[0];

      return row === undefined
        ? null
        : {
            item,
            title: item.title,
            seriesTitle: row.seriesTitle,
            path: row.path,
            libraryId: row.libraryId,
            libraryPath: row.libraryPath,
          };
    },
  },
  transcoder,
  capabilities: async () => transcoder.capabilities(),
  forcedAccel: async () => (await settings.read()).hardwareAccel,
  isBeingWatched: (mediaId) => presence.list().some((entry) => entry.playback?.mediaId === mediaId),
  awaitingReviewCap: async () => (await settings.read()).reencodesAwaitingReviewCap,
  afterChange: async (mediaItemId) => {
    await libraryService.rebuildArtefacts(mediaItemId);

    realtime.publish('media', { event: 'changed', mediaId: mediaItemId }, { kind: 'everyone' });
  },
  onProblem: (what, reason) => {
    log.warn('jobs', `re-encoding ${what}: ${reason}`);
  },
});

const app = createApp({
  auth,
  settings,
  version: env.VALENCE_VERSION,
  trustedOrigins: trustedOriginsFor({
    configured: env.TRUSTED_ORIGINS,
    port: env.PORT,
    settings,
  }),
  realtime,
  logs: logStore,
  jobHistory,
  resourceHistory,
  presence,
  countUsers,
  promoteToAdmin,
  library: libraryService,
  playback: playbackService,
  maintenance,
  schedules,
  subtitles: subtitleService,
  segments: segmentService,
  progress: createDatabaseWatchProgressService(db),
  history: historyService,
  webhooks: webhookSubscriptions,
  queueWebhookDelivery,
  notifications,
  events,
  readPushPublicKey: async () => (await readPushKeys()).publicKey,
  downloads: downloadService,
  reencodes: reencodeService,
  onReencodeQueued: () => {
    void jobs.enqueue(REENCODE_JOB, {}, REENCODE_JOB);
  },
  favourites: createDatabaseFavouriteService(db),
  hiding: createDatabaseHiddenService(db),
  ratings: createDatabaseRatingService(db),
  shares: shareService,
  shareSessions: createShareSessions(),
  playbackSessions: createPlaybackSessions(),
  sayALinkWasWithdrawn: async ({ accountId, title, byName }) => {
    await notifyHousehold({
      store: notifications,
      event: 'sharing.withdrawn',
      title: 'A link you handed out was withdrawn',
      body: `${byName} withdrew your link to ${title}. Anybody watching through it has stopped.`,
      link: null,
      vapid: await readPushKeys(),
      only: [accountId],
      onProblem: (reason) => {
        log.error('server', `withdrawn link: ${reason}`);
      },
      announce: (userIds) => {
        realtime.publish(
          'notifications',
          { event: 'sharing.withdrawn' },
          { kind: 'accounts', accountIds: [...userIds] },
        );
      },
    });
  },
  profiles: profileService,
  households: householdService,
  splashscreen,
  books: bookService,
  music: musicServices,
  promoteProfile: async ({ profileId, email, password }) => {
    const rows = await db
      .select({
        id: viewerProfile.id,
        name: viewerProfile.name,
        colour: viewerProfile.colour,
        createdAt: viewerProfile.createdAt,
      })
      .from(viewerProfile)
      .where(eq(viewerProfile.id, profileId))
      .limit(1);

    const found = rows[0];

    if (found === undefined) {
      return { kind: 'missing' };
    }

    const created = await auth.api
      .signUpEmail({ body: { email, password, name: found.name } })
      .catch(() => null);

    if (created === null) {
      return { kind: 'taken' };
    }

    await profileService.moveTo(profileId, created.user.id);

    return {
      kind: 'promoted',
      profile: ViewerProfileSchema.parse({
        id: found.id,
        name: found.name,
        colour: found.colour,
        createdAt: found.createdAt.toISOString(),
      }),
    };
  },
  listUsers: async () => {
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user);

    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  },
  permissions,
  banAccount: async (userId, reason) => {
    const [found] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);

    if (found === undefined) {
      return false;
    }

    await db.update(user).set({ banned: true, banReason: reason }).where(eq(user.id, userId));
    await db.delete(session).where(eq(session.userId, userId));
    await db.update(apikey).set({ enabled: false }).where(eq(apikey.referenceId, userId));

    return true;
  },
  unbanAccount: async (userId) => {
    const [found] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);

    if (found === undefined) {
      return false;
    }

    await db.update(user).set({ banned: false, banReason: null }).where(eq(user.id, userId));

    return true;
  },
  removeAccount: async (userId) => {
    const theirs = await db
      .select({ id: viewerProfile.id })
      .from(viewerProfile)
      .where(eq(viewerProfile.userId, userId));

    await dropPrivatePlaylistsOf(
      db,
      theirs.map((one) => one.id),
    );

    const [removed] = await db
      .delete(user)
      .where(eq(user.id, userId))
      .returning({ id: user.id, name: user.name });

    if (removed === undefined) {
      return false;
    }

    void events.publish({
      event: 'account.deleted',
      data: { accountId: removed.id, name: removed.name },
    });

    return true;
  },
  isAccountBanned: async (userId) => {
    const [found] = await db
      .select({ banned: user.banned })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return found?.banned === true;
  },
  readBanReason: async (userId) => {
    const [found] = await db
      .select({ reason: user.banReason })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return found?.reason ?? null;
  },
  inviteAccount: async ({ name, email, password }) => {
    const created = await auth.api
      .signUpEmail({ body: { name, email, password }, asResponse: true })
      .catch(() => null);

    if (created === null || !created.ok) {
      return null;
    }

    const [found] = await db
      .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (found === undefined) {
      return null;
    }

    await giveDefaultRole(found.id);

    return { ...found, createdAt: found.createdAt.toISOString() };
  },
  editAccount: async (userId, changes) => {
    const [found] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);

    if (found === undefined) {
      return 'missing';
    }

    if (changes.email !== undefined) {
      const [taken] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, changes.email))
        .limit(1);

      if (taken !== undefined && taken.id !== userId) {
        return 'taken';
      }
    }

    await db.update(user).set(changes).where(eq(user.id, userId));

    return 'changed';
  },
  resetAccountPassword: async (userId, password) => {
    const [found] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);

    if (found === undefined) {
      return false;
    }

    const hashed = await (await auth.$context).password.hash(password);

    await db
      .update(account)
      .set({ password: hashed })
      .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')));
    await db.delete(session).where(eq(session.userId, userId));

    return true;
  },
  listAccountSessions: async (userId) => {
    const rows = await db
      .select({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(eq(session.userId, userId));

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    }));
  },
  endAccountSessions: async (userId) => {
    await db.delete(session).where(eq(session.userId, userId));
  },
  endAccountSession: async (userId, sessionId) => {
    await db.delete(session).where(and(eq(session.id, sessionId), eq(session.userId, userId)));
  },
  setAccountPhoto: (userId, photo) => householdService.savePhoto(userId, photo),
  setAccountAvatar: (userId, changes) =>
    householdService.change(userId, {
      ...(changes.avatar === undefined ? {} : { avatar: changes.avatar }),
      ...(changes.colour === undefined ? {} : { colour: changes.colour }),
    }),
  capabilities: () => transcoder.capabilities(),
  artworkUsage: () => artworkUsage.read(),
  bookPageUsage: () => bookPageUsage.read(),
  libraryBytes: () => readLibraryBytes(),
  measureStorage: async () => {
    const [cache, artwork, bookPages, bytes] = await Promise.all([
      transcoder.measureCache(),
      artworkUsage.refresh(),
      bookPageUsage.refresh(),
      readLibraryBytes(),
    ]);

    return { cache, artwork, bookPages, libraryBytes: bytes };
  },
  monitor: async () => withApiMemory(await transcoder.readMonitor()),
  stalledJobs: () =>
    jobHealth.stalled().map((stall) => ({ ...stall, label: labelForQueue(stall.kind) })),
  readImage: (url) => images.read(url),
  isTranscoderReachable: () => transcoder.isReachable(),
  transcoderAddress: env.TRANSCODER_URL,
  listRunningJobs: () => jobs.listRunning(),
  jobDefinitions,
  requests,
  requestsClient,
  cancelJob: (jobId) => jobs.cancel(jobId),
  describeForRequest,
  describeMusicForRequest,
  searchMusicCatalogue: (query, kind) => searchMusicCatalogue(musicWeb, query, kind),
  discovery,
  searchCatalogue: (query, kind) => catalogueProvider.search?.(query, kind) ?? Promise.resolve([]),
});

const seededRoles = await seedDefaultRoles({
  permissions,
  settings,
  accounts: async () =>
    (await db.select({ id: user.id, role: user.role }).from(user)).map((row) => ({
      id: row.id,
      role: row.role ?? null,
    })),
});

if (seededRoles.rolesCreated.length > 0) {
  log.info('server', `roles: created ${seededRoles.rolesCreated.join(', ')}`);
}

if (seededRoles.administratorsCarried > 0 || seededRoles.membersAssigned > 0) {
  log.info(
    'server',
    `roles: carried ${seededRoles.administratorsCarried.toString()} administrator(s) and gave ${seededRoles.membersAssigned.toString()} account(s) the default role`,
  );
}

const seededKinds = await seedDefaultJobTriggers({ schedules, settings });

if (seededKinds.length > 0) {
  log.info('server', `schedule: default triggers set for ${seededKinds.join(', ')}`);
}

await jobs.startWorking();

for (const kind of await schedules.sync()) {
  const queueName = scheduleQueueNameFor(kind);

  await jobs.enqueue(queueName, {}, queueName);
  log.info('server', `schedule: running ${kind} on startup`);
}

await jobs.enqueue(REENCODE_JOB, {}, REENCODE_JOB);

const parties = createPartyRegistry(() => randomUUID());

const realtimeHandler = createRealtimeHandler({
  registry: realtime,
  newId: () => randomUUID(),
  now: () => Date.now(),
  ownsProfile: (accountId, profileId) => profileService.belongsTo(accountId, profileId),
  party: {
    registry: parties,
    tell: (connectionIds, payload) => {
      realtime.publish('party', payload, {
        kind: 'connections',
        connectionIds: [...connectionIds],
      });
    },
    ask: ({ party, byName, profileId }) => {
      void askSomebodyToTheParty(party, byName, profileId);
    },
  },
  presence: {
    connect: (arrival) => presence.connect(arrival),
    disconnect: (clientId, socketId) => {
      presence.disconnect(clientId, socketId);
    },
    nameOf: async (accountId, profileId) => {
      const named =
        profileId === null
          ? null
          : ((await profileService.list(accountId)).find((profile) => profile.id === profileId)
              ?.name ?? null);

      if (named !== null) {
        return named;
      }

      const [account] = await db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, accountId))
        .limit(1);

      return account?.name ?? null;
    },
  },
});

/**
 * Asks somebody to a watch or listening party, in whatever way they asked to be told things.
 *
 * The notification carries the same address the party's own invitation does, which holds no
 * credential of its own: being asked is not being let in, and whoever opens it still has to be
 * allowed to watch the thing.
 *
 * @param party - The party they are being asked to.
 * @param byName - Who is asking.
 * @param profileId - Which face they picked, since that is what a viewer chooses between.
 */
const askSomebodyToTheParty = async (
  party: { id: string; kind: 'watch' | 'listen'; mediaId: string },
  byName: string,
  profileId: string,
): Promise<void> => {
  const accountId = await profileService.accountOf(profileId);

  if (accountId === null) {
    return;
  }

  const [found] = await db
    .select({ title: mediaItem.title })
    .from(mediaItem)
    .where(eq(mediaItem.id, party.mediaId))
    .limit(1);

  const isListening = party.kind === 'listen';

  await notifyHousehold({
    store: notifications,
    event: 'party.invited',
    title: `${byName} wants to ${isListening ? 'listen' : 'watch'} with you`,
    body:
      found === undefined
        ? `They have a ${isListening ? 'listening' : 'watch'} party running.`
        : `They are ${isListening ? 'listening to' : 'watching'} ${found.title}.`,
    link: isListening ? `/music?party=${party.id}` : `/watch/${party.mediaId}?party=${party.id}`,
    vapid: await readPushKeys(),
    only: [accountId],
    onProblem: (reason) => {
      log.error('server', `party invite: ${reason}`);
    },
    announce: (userIds) => {
      realtime.publish(
        'notifications',
        { event: 'party.invited' },
        { kind: 'accounts', accountIds: [...userIds] },
      );
    },
  });
};

const transcoderIntake = createTranscoderIntake(log);

const RESOURCE_SAMPLE_INTERVAL_MS = 60_000;

let lastSampledAtMs = 0;

/**
 * Records one resource sample for the load history, no more often than once a minute — the monitor
 * relay reads roughly once a second, and keeping every reading for a week would be tens of millions
 * of rows for a number nobody reads back that finely.
 *
 * @param reading - The monitor reading the sample is drawn from.
 */
const sampleResourcesThrottled = (reading: JsonValue): void => {
  const parsed = MonitorResourceSampleSchema.safeParse(reading);

  if (!parsed.success) {
    return;
  }

  const { resources } = parsed.data;

  if (resources.atMs - lastSampledAtMs < RESOURCE_SAMPLE_INTERVAL_MS) {
    return;
  }

  lastSampledAtMs = resources.atMs;

  void resourceHistory
    .record({
      id: randomUUID(),
      atMs: resources.atMs,
      systemCpuPercent: resources.systemCpuPercent,
      loadAverage: resources.loadAverage,
      systemMemoryUsedBytes: resources.systemMemoryUsedBytes,
      systemMemoryTotalBytes: resources.systemMemoryTotalBytes,
      cpuCount: resources.cpuCount,
    })
    .catch(() => {});
};

void relayMonitor({
  open: () => transcoder.openMonitorSocket(),
  publish: (report) => {
    const reading = withApiMemory(report);

    realtime.publish('monitor', reading, { kind: 'everyone' });
    transcoderIntake.take(reading);
    sampleResourcesThrottled(reading);
  },
  wait: (afterMs) => new Promise((resolve) => setTimeout(resolve, afterMs)),
  retryMs: MONITOR_RETRY_MS,
  keepGoing: () => true,
});

if (requestsClient !== null) {
  let isDownloadsHeard = false;

  realtime.onHeard('downloads', (isHeard) => {
    isDownloadsHeard = isHeard;

    void requestsClient.watchDownloads(isHeard);
  });

  void relayDownloads({
    stream: (onFrame, signal) => requestsClient.streamDownloads(onFrame, signal),
    onQueue: (queue) => {
      realtime.publish('downloads', queue, { kind: 'everyone' });
    },
    onEvent: (event) => {
      switch (event.kind) {
        case 'started': {
          log.info('requests', `sent ${event.title} to ${event.clientName}`);

          void events.publish({
            event: 'requests.downloadStarted',
            data: { title: event.title, client: event.clientName },
          });

          return;
        }

        case 'failed': {
          log.warn('requests', `${event.title} failed in ${event.clientName} — ${event.problem}`);

          void events.publish({
            event: 'requests.downloadFailed',
            data: { title: event.title, client: event.clientName, problem: event.problem },
          });

          return;
        }

        case 'chosen': {
          log.info('requests', `chose ${event.releaseTitle} for ${event.title}`);

          void events.publish({
            event: 'requests.chosen',
            data: { title: event.title, release: event.releaseTitle },
          });

          return;
        }

        case 'filed': {
          log.info('requests', `filed ${event.title} into ${event.folder}`);

          void events.publish({
            event: 'requests.filed',
            data: { title: event.title, folder: event.folder },
          });
          void jobs.enqueue(SCAN_REQUEST_FOLDER_JOB, {
            libraryId: event.libraryId,
            folder: event.folder,
            title: event.title,
            request: {
              id: event.requestId,
              kind: event.requestKind,
              tmdbId: event.tmdbId,
              musicBrainzId: event.musicBrainzId,
            },
          });

          return;
        }

        case 'imported': {
          log.info('requests', `filed ${event.title} into ${event.folder}`);

          void events.publish({
            event: 'requests.filed',
            data: { title: event.title, folder: event.folder },
          });
          void jobs.enqueue(SCAN_REQUEST_FOLDER_JOB, {
            libraryId: event.libraryId,
            folder: event.folder,
            title: event.title,
            request: null,
          });

          return;
        }

        case 'stuck': {
          log.warn('requests', `${event.title} is stuck — ${event.problem}`);
        }
      }
    },
    acknowledge: async (ids) => {
      await requestsClient.acknowledgeDownloadEvents(ids);
    },
    onConnected: () => {
      void requestsClient.watchDownloads(isDownloadsHeard);
    },
    onLost: () => undefined,
    wait: (afterMs) => new Promise((resolve) => setTimeout(resolve, afterMs)),
    retryMs: MONITOR_RETRY_MS,
    keepGoing: () => true,
  });
}

const WEB_ROOT = './apps/web/dist';

const nodeWebSocket = createNodeWebSocket({ app });

/**
 * Where a connection came from as Node sees it, for the case where nothing sits in front of this
 * server to forward it on.
 *
 * Asked of the adapter rather than of a header, and guarded, because the adapter answers only while
 * it is the thing serving the request — it knows nothing about a request that reached Hono some
 * other way.
 *
 * @param context - The request.
 * @returns The address the socket came from, or null where the adapter cannot say.
 */
const socketAddressOf = (context: Context): string | null => {
  try {
    return getConnInfo(context).remote.address ?? null;
  } catch {
    return null;
  }
};

/**
 * Keeps the address a session was last seen at.
 *
 * better-auth writes it once, when somebody signs in, and never touches it again — a refresh moves
 * only the expiry. So a phone that signed in on the sofa and has spent the fortnight since on
 * cellular is still listed at the address it was at a fortnight ago, which is the one address it is
 * certainly not at now.
 *
 * A client opening its connection is the moment its network could have changed, so that is when
 * this is asked, and only a changed address is written — the ordinary case costs a comparison
 * rather than a round trip.
 *
 * @param sessionId - The session to remember it against.
 * @param remembered - The address already stored against it.
 * @param seen - Where it has just been seen, where that is known.
 */
const rememberWhereTheyAre = async (
  sessionId: string,
  remembered: string | null,
  seen: string | null,
): Promise<void> => {
  if (seen === null || seen === remembered) {
    return;
  }

  await db.update(session).set({ ipAddress: seen }).where(eq(session.id, sessionId));
};

app.get(
  '/api/realtime',
  nodeWebSocket.upgradeWebSocket(async (context) => {
    const signedIn = await readSessionOnce(auth, context.req.raw.headers);
    const account = signedIn?.user ?? null;
    const who =
      account === null
        ? await guestAtTheDoor(getCookie(context, SHARE_COOKIE), shareService)
        : null;

    if (account === null && who === null) {
      return {};
    }

    const accountId = account?.id ?? null;
    const address = readCallerAddress({
      headers: context.req.raw.headers,
      socketAddress: socketAddressOf(context),
    });

    if (signedIn !== null) {
      void rememberWhereTheyAre(signedIn.session.id, signedIn.session.ipAddress ?? null, address);
    }
    let session: RealtimeSession | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    return {
      onOpen: (_event, socket) => {
        session = realtimeHandler.open(
          {
            accountId,
            profileId: null,
            guestOf: who?.guestOf ?? null,
            viaShare: who?.shareId ?? null,
            address,
          },
          {
            send: (raw) => {
              socket.send(raw);
            },
          },
        );

        heartbeat = setInterval(() => {
          session?.ping();
        }, REALTIME_HEARTBEAT_MS);
      },

      onMessage: (event: { data: string | ArrayBuffer | Uint8Array }) => {
        if (typeof event.data === 'string') {
          void session?.receive(event.data);
        }
      },

      onClose: () => {
        if (heartbeat !== null) {
          clearInterval(heartbeat);
        }

        session?.close();
      },
    };
  }),
);

app.use('/*', serveStatic({ root: WEB_ROOT }));

app.get('*', async (context, next) =>
  isAppAddress(context.req.path)
    ? serveStatic({ path: `${WEB_ROOT}/index.html` })(context, next)
    : next(),
);

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  const origin = `http://localhost:${info.port.toString()}`;

  log.info('server', `Valence listening on ${origin}`);

  if (persisted.setupCompletedAt === null) {
    log.info('server', `First-run setup at ${origin}`);
  }

  log.info('server', `API reference at ${origin}/api/reference`);
  log.info('server', `Media service dialled at ${env.TRANSCODER_URL}`);
});

nodeWebSocket.injectWebSocket(server);
