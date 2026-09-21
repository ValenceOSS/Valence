import { readCatalogueReference } from '@ValenceCore/functions/readCatalogueReference';
import type { QueueControl } from '@ValenceServer/transcoder/TranscoderClient';
import type { RunningJob } from '@ValenceServer/jobs/JobQueue';
import type { CatalogueMatch } from '@ValenceServer/library/MetadataProvider';
import { OpenAPIHono, z } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { suggestTrustedOrigins } from '@ValenceServer/setup/suggestTrustedOrigins';
import type { ValenceAuth } from '@ValenceServer/auth/Auth';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import { allowCrossOriginClients } from '@ValenceServer/auth/allowCrossOriginClients';
import { DEFAULT_LIMIT } from '@ValenceServer/library/LibraryService';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import { readViewer } from '@ValenceServer/visibility/readViewer';
import { subjectOfRequest } from '@ValenceServer/visibility/subjectOfRequest';
import type { Subject } from '@ValenceServer/visibility/subjectOfRequest';
import type { MiddlewareHandler } from 'hono';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { splitPersonCredits } from '@ValenceServer/library/splitPersonCredits';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { SubtitleService } from '@ValenceServer/subtitles/SubtitleService';
import type { SegmentService } from '@ValenceServer/segments/SegmentService';
import type { WatchProgressService } from '@ValenceServer/progress/WatchProgressService';
import type { DownloadService } from '@ValenceServer/downloads/DownloadService';
import type { FavouriteService } from '@ValenceServer/favourites/FavouriteService';
import type { HiddenService } from '@ValenceServer/hiding/HiddenService';
import { createMemoryHiddenService } from '@ValenceServer/hiding/createMemoryHiddenService';
import type { RatingService } from '@ValenceServer/ratings/RatingService';
import type { ShareService } from '@ValenceServer/sharing/ShareService';
import type { ShareSessions } from '@ValenceServer/sharing/createShareSessions';
import type { PlaybackSessions } from '@ValenceServer/playback/createPlaybackSessions';
import type { PlaybackService, PreviewRead } from '@ValenceServer/playback/PlaybackService';
import { createPresenceService } from '@ValenceServer/presence/PresenceService';
import type { PresenceService } from '@ValenceServer/presence/PresenceService';
import {
  readExceptionsOnRoute,
  readLibraryAccessRoute,
  allowLibraryRoute,
  refuseLibraryRoute,
  setCeilingRoute,
  clearCeilingRoute,
  readExceptionsRoute,
  setExceptionRoute,
  clearExceptionRoute,
} from '@ValenceServer/routes/LibraryAccessRoute';
import {
  listHiddenRoute,
  hideMediaRoute,
  showMediaRoute,
  hideSeriesRoute,
  showSeriesRoute,
  hideLibraryRoute,
  showLibraryRoute,
} from '@ValenceServer/routes/HiddenRoute';
import {
  askForDownloadRoute,
  askForSeriesRoute,
  offerSeriesRoute,
  pauseDownloadRoute,
  resumeDownloadRoute,
  forgetDownloadRoute,
  holdDownloadRoute,
  listDownloadsRoute,
  listHoldingsRoute,
  offerDownloadRoute,
  releaseDownloadRoute,
} from './routes/DownloadRoute';
import { healthRoute } from './routes/HealthRoute';
import {
  listLibrariesRoute,
  createLibraryRoute,
  updateLibraryRoute,
  listItemsRoute,
  listFacetsRoute,
  getMediaRoute,
  listShowsRoute,
  getShowRoute,
  comingUpRoute,
  scanLibraryRoute,
  scanStateRoute,
  runningScansRoute,
  correctMatchRoute,
  forgetCorrectionRoute,
  rebuildArtefactsRoute,
  setPreviewMomentRoute,
  clearPreviewMomentRoute,
  resetLibraryRoute,
  deleteLibraryRoute,
  regeneratePreviewsRoute,
} from './routes/LibraryRoute';
import { createFolderRoute, listFoldersRoute } from '@ValenceServer/routes/FolderRoute';
import { createFolder } from '@ValenceServer/folders/createFolder';
import { uploadMediaRoute } from '@ValenceServer/routes/UploadRoute';
import { planUpload } from '@ValenceServer/uploads/planUpload';
import { createUploadDisk } from '@ValenceServer/uploads/createUploadDisk';
import type { UploadDisk } from '@ValenceServer/uploads/UploadDisk';
import { listFolders } from '@ValenceServer/folders/listFolders';
import { createFolderDisk } from '@ValenceServer/folders/createFolderDisk';
import type { FolderDisk } from '@ValenceServer/folders/FolderDisk';
import {
  explainRoute,
  startRoute,
  sessionFileRoute,
  directFileRoute,
  trickplayRoute,
  trickplayFileRoute,
  frameRoute,
  stopRoute,
  heartbeatRoute,
} from './routes/PlaybackRoute';
import {
  presenceHeartbeatRoute,
  presenceStopWatchingRoute,
} from '@ValenceServer/routes/PresenceRoute';
import { mediaImageRoute } from '@ValenceServer/routes/ImageRoute';
import {
  listBooksRoute,
  findBooksRoute,
  forgetBookReadingRoute,
  forgetReadingRoute,
  listReadingRoute,
  readBookContentsRoute,
  readBookCoverRoute,
  readBookDocumentRoute,
  readBookPageRoute,
  readBookResourceRoute,
  readBookRoute,
  readReadingProgressRoute,
  saveReadingProgressRoute,
} from '@ValenceServer/routes/BookRoute';
import { listSegmentsRoute } from '@ValenceServer/routes/SegmentRoute';
import {
  listProgressRoute,
  recordProgressRoute,
  forgetProgressRoute,
} from '@ValenceServer/routes/ProgressRoute';
import { readPersonRoute, readPersonCreditsRoute } from '@ValenceServer/routes/PersonRoute';
import {
  createShareRoute,
  listSharesRoute,
  listEverybodysSharesRoute,
  revokeShareRoute,
  revokeAnybodysShareRoute,
  openShareRoute,
} from '@ValenceServer/routes/ShareRoute';
import { SHARE_COOKIE, createShareGate } from '@ValenceServer/sharing/createShareGate';
import { howShareEnded, isShareLive, whyShareEnded } from '@ValenceContracts/schemas/Share';
import { rememberGuestFor } from '@ValenceServer/sharing/rememberGuestFor';
import { bodyLimit } from 'hono/body-limit';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { HOUSEHOLD_LIMITS } from '@ValenceServer/household/HouseholdPicture';
import {
  readOnboardingRoute,
  changeHouseholdRoute,
  finishOnboardingRoute,
} from '@ValenceServer/routes/HouseholdRoute';
import type { HouseholdService } from '@ValenceServer/household/HouseholdService';
import { FACE_LIMITS } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type {
  PictureFault,
  PictureLimits,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { createMemorySplashscreenStore } from '@ValenceServer/splashscreen/createMemorySplashscreenStore';
import { SPLASHSCREEN_LIMITS } from '@ValenceServer/splashscreen/SplashscreenStore';
import type { SplashscreenStore } from '@ValenceServer/splashscreen/SplashscreenStore';
import { getCookie, setCookie } from 'hono/cookie';
import { randomUUID } from 'node:crypto';

const SHARE_JOINER = 'valence_share_joiner';

/**
 * Builds the guard that turns away a picture too big to keep before it has been read rather than
 * after.
 *
 * The size is checked again where the picture is judged, which is what makes the rule true; this is
 * only so that somebody uploading a film by mistake does not have it held in memory in full first.
 *
 * @param limits - The limits the picture is held to, a face's unless it is something drawn larger.
 * @returns The middleware to put in front of a route that takes a picture.
 */
const tooBigToRead = (limits: PictureLimits = FACE_LIMITS) =>
  bodyLimit({
    maxSize: limits.mostBytes,
    onError: (context) =>
      context.json({ error: describePictureFault('tooLarge', limits).error }, 413),
  });

const GUEST_REMEMBERED_FOR_SECONDS = 30 * 86_400;
import {
  listFavouritesRoute,
  keepFavouriteRoute,
  dropFavouriteRoute,
  keepBookFavouriteRoute,
  dropBookFavouriteRoute,
} from '@ValenceServer/routes/FavouriteRoute';
import {
  listRatingsRoute,
  rateMediaRoute,
  clearMediaRatingRoute,
  readMediaHouseholdRatingRoute,
  rateSeriesRoute,
  clearSeriesRatingRoute,
  readSeriesHouseholdRatingRoute,
  rateBookRoute,
  clearBookRatingRoute,
  readBookHouseholdRatingRoute,
} from '@ValenceServer/routes/RatingRoute';
import {
  adminOverviewRoute,
  adminLogsRoute,
  adminMeasureStorageRoute,
  searchCatalogueRoute,
  adminSettingsRoute,
  adminSessionsRoute,
  adminStopSessionRoute,
  adminPauseSessionRoute,
  adminMessageSessionRoute,
  adminResumeSessionRoute,
  adminJobDefinitionsRoute,
  adminRunJobRoute,
  adminCancelJobRoute,
  adminQueueConcurrencyRoute,
  adminQueuePauseRoute,
  adminQueueResumeRoute,
  adminQueueRunNowRoute,
  adminJobSchedulesRoute,
  adminAddJobTriggerRoute,
  adminRemoveJobTriggerRoute,
  adminJobHistoryRoute,
  adminJobHistoryIssuesRoute,
  adminMonitorHistoryRoute,
} from '@ValenceServer/routes/AdminRoute';
import {
  listDevicesRoute,
  endDeviceRoute,
  endOtherDevicesRoute,
} from '@ValenceServer/routes/DeviceRoute';
import { listMyPermissionsRoute } from '@ValenceServer/routes/PermissionRoute';
import { describeDevice } from '@ValenceServer/account/describeDevice';
import {
  listProfilesRoute,
  createProfileRoute,
  updateProfileRoute,
  deleteProfileRoute,
  promoteProfileRoute,
} from '@ValenceServer/routes/ProfileRoute';
import {
  listSubtitlesRoute,
  readSubtitleCuesRoute,
  readSubtitleRoute,
} from '@ValenceServer/routes/SubtitleRoute';
import { setupStatusRoute, setupCompleteRoute } from './routes/SetupRoute';
import { JOB_DEFINITIONS, RESET_LIBRARY_JOB } from '@ValenceServer/jobs/jobDefinitions';
import type { JobDefinition } from '@ValenceServer/jobs/jobDefinitions';
import {
  approveMediaRequestRoute,
  askForMediaRoute,
  changeMediaRequestRoute,
  listMediaRequestsRoute,
  mediaRequestLogRoute,
  mediaRequestReleasesRoute,
  pickMediaReleaseRoute,
  refuseMediaRequestRoute,
  removeMediaRequestRoute,
  retryMediaRequestRoute,
  draftReleasesRoute,
  searchMissingRoute,
  seriesSeasonsRoute,
  musicCatalogueRoute,
  discoverRoute,
  catalogueBrowseRoute,
  catalogueGenresRoute,
  decideMediaRequestsRoute,
  liftMediaBlockRoute,
  mediaRequestBlocklistRoute,
  catalogueSearchRoute,
  catalogueTitleRoute,
  requestProgressRoute,
  addQualityProfileRoute,
  changeQualityProfileRoute,
  listQualityProfilesRoute,
  removeQualityProfileRoute,
  addDownloadClientRoute,
  changeDownloadClientRoute,
  listDownloadClientsRoute,
  fileQueuedDownloadRoute,
  pauseQueuedDownloadRoute,
  readDownloadQueueRoute,
  removeDownloadClientRoute,
  removeQueuedDownloadRoute,
  resumeQueuedDownloadRoute,
  sendReleaseRoute,
  testDownloadClientRoute,
  tryDownloadClientChangeRoute,
  tryDownloadClientRoute,
  addIndexerRoute,
  adminCheckRequestsRoute,
  adminRequestsOverviewRoute,
  changeIndexerRoute,
  listDefinitionsRoute,
  listIndexersRoute,
  readDefinitionRoute,
  refreshDefinitionsRoute,
  removeIndexerRoute,
  requestsAvailabilityRoute,
  searchReleasesRoute,
  testIndexerRoute,
  tryIndexerChangeRoute,
  tryIndexerRoute,
} from '@ValenceServer/routes/RequestsRoute';
import type { RequestsAnswer, RequestsClient } from '@ValenceServer/requests/createRequestsClient';
import { ReleaseDownloadRequestSchema } from '@ValenceContracts/schemas/Indexer';
import type { RequestsMonitor } from '@ValenceServer/requests/createRequestsMonitor';
import {
  SCAN_LIBRARY_JOB,
  REGENERATE_PREVIEWS_JOB,
  REGENERATE_TRICKPLAY_JOB,
  FETCH_LOGOS_JOB,
  CLEAR_LIBRARY_PARTS_JOB,
  DETECT_SEGMENTS_JOB,
  READ_CERTIFICATES_AGAIN_JOB,
} from '@ValenceServer/jobs/JobQueue';
import { createMemoryMaintenanceService } from '@ValenceServer/maintenance/createMemoryMaintenanceService';
import type { MaintenanceService } from '@ValenceServer/maintenance/MaintenanceService';
import { createMemoryJobScheduleService } from '@ValenceServer/jobs/createMemoryJobScheduleService';
import type { JobScheduleService } from '@ValenceServer/jobs/JobScheduleService';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { JobStall } from '@ValenceServer/jobs/createJobHealthWatch';
import { drawAvatar, isAvatarStyle } from '@ValenceServer/profiles/drawAvatar';
import { shiftSubtitleCues } from '@ValenceCore/functions/shiftSubtitleCues';
import { shiftWebVtt } from '@ValenceCore/functions/shiftWebVtt';
import type { ProfileService } from '@ValenceServer/profiles/ProfileService';
import type { BookService } from '@ValenceServer/books/createDatabaseBookService';
import type { Avatar, ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { createSessionGate } from '@ValenceServer/auth/createSessionGate';
import { createBetterAuthAdminBlock } from '@ValenceServer/auth/createBetterAuthAdminBlock';
import { checkRoleChange } from '@ValenceServer/auth/checkRoleChange';
import { checkAccountAction } from '@ValenceServer/auth/checkAccountAction';
import type { AccountActionRefusal } from '@ValenceServer/auth/checkAccountAction';
import {
  listAccountsRoute,
  banAccountRoute,
  unbanAccountRoute,
  removeAccountRoute,
  inviteAccountRoute,
  editAccountRoute,
  resetAccountPasswordRoute,
  listAccountSessionsRoute,
  endAccountSessionsRoute,
  endAccountSessionRoute,
  setAccountAvatarRoute,
} from '@ValenceServer/routes/AccountRoute';
import type { RoleChangeRefusal } from '@ValenceServer/auth/checkRoleChange';
import { ADMINISTRATOR, PERMISSIONS } from '@ValenceContracts/schemas/Permission';
import {
  listPermissionsRoute,
  listRolesRoute,
  createRoleRoute,
  updateRoleRoute,
  deleteRoleRoute,
  listAccountRolesRoute,
  assignRoleRoute,
  removeRoleRoute,
  setOverrideRoute,
  clearOverrideRoute,
} from '@ValenceServer/routes/RoleRoute';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createBetterAuthApiKeyService } from '@ValenceServer/auth/createBetterAuthApiKeyService';
import {
  listApiKeysRoute,
  createApiKeyRoute,
  updateApiKeyRoute,
  revokeApiKeyRoute,
} from '@ValenceServer/routes/ApiKeyRoute';
import {
  listWebhooksRoute,
  createWebhookRoute,
  updateWebhookRoute,
  deleteWebhookRoute,
  testWebhookRoute,
  listWebhookDeliveriesRoute,
  redeliverWebhookRoute,
  DELIVERY_PAGE,
} from '@ValenceServer/routes/WebhookRoute';
import { createMemoryWebhookStore } from '@ValenceServer/webhooks/createMemoryWebhookStore';
import { createMemoryNotificationStore } from '@ValenceServer/notifications/createMemoryNotificationStore';
import {
  clearNotificationsRoute,
  listNotificationsRoute,
  readNotificationsRoute,
  readNotificationPreferencesRoute,
  writeNotificationPreferenceRoute,
  subscribeToPushRoute,
  unsubscribeFromPushRoute,
  NOTIFICATION_PAGE,
} from '@ValenceServer/routes/NotificationRoute';
import {
  DEFAULT_NOTIFICATION_PREFERENCE,
  NOTIFICATION_EVENTS,
} from '@ValenceContracts/schemas/Notification';
import type { NotificationStore } from '@ValenceServer/notifications/NotificationStore';
import { isSafeWebhookUrl } from '@ValenceServer/webhooks/isSafeWebhookUrl';
import { queueWebhookTest } from '@ValenceServer/webhooks/queueWebhookTest';
import { queueWebhookRedelivery } from '@ValenceServer/webhooks/queueWebhookRedelivery';
import { narrowToKey } from '@ValenceServer/auth/narrowToKey';
import { watchedBetween } from '@ValenceServer/progress/accumulateWatchTime';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import type { PermissionService } from '@ValenceServer/auth/PermissionService';
import type { ApiKeyService } from '@ValenceServer/auth/ApiKeyService';
import type { WebhookStore } from '@ValenceServer/webhooks/WebhookStore';
import type { RealtimePublisher } from '@ValenceServer/realtime/RealtimePublisher';
import type { EventBus, WebhookOccurrence } from '@ValenceServer/events/EventBus';
import type {
  MediaRequest,
  MediaRequestAsk,
  MediaRequestDraft,
  MusicCatalogueHit,
  MusicRequestKind,
  ReleaseType,
  RequestCatalogue,
  VideoRequestKind,
} from '@ValenceContracts/schemas/MediaRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { libraryKindOf } from '@ValenceContracts/functions/libraryKindOf';
import { seasonsOf } from '@ValenceContracts/functions/seasonsOf';
import { catalogueForRequest } from '@ValenceServer/requests/catalogueForRequest';
import { describeCatalogueTitle } from '@ValenceServer/requests/catalogue/describeCatalogueTitle';
import { workOf } from '@ValenceServer/requests/workOf';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';
import { discoverShelves } from '@ValenceServer/requests/catalogue/discoverShelves';
import { NO_DISCOVERY } from '@ValenceServer/requests/catalogue/NO_DISCOVERY';
import { standTitles } from '@ValenceServer/requests/catalogue/standTitles';
import { progressOf } from '@ValenceServer/requests/progressOf';
import type { Discovery } from '@ValenceServer/requests/catalogue/Discovery';
import type { UnstoodTitle } from '@ValenceServer/requests/catalogue/UnstoodTitle';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { CatalogueStanding } from '@ValenceContracts/schemas/CatalogueTitle';
import type { LogStore } from '@ValenceServer/logging/Logger';
import type { JobHistoryStore } from '@ValenceServer/jobs/createJobHistoryStore';
import type { ResourceHistoryStore } from '@ValenceServer/logging/createResourceHistoryStore';
import {
  listHistoryRoute,
  forgetViewingRoute,
  forgetHistoryRoute,
} from '@ValenceServer/routes/HistoryRoute';
import type { HistoryService } from '@ValenceServer/history/HistoryService';
import type { Permission, Role } from '@ValenceContracts/schemas/Permission';

import { registerMusicRoutes } from '@ValenceServer/music/registerMusicRoutes';
import { registerReencodeRoutes } from '@ValenceServer/reencode/registerReencodeRoutes';
import { listeningFor } from '@ValenceServer/music/listeningFor';
import type { MusicServices } from '@ValenceServer/music/MusicServices';
import type { ReencodeService } from '@ValenceServer/reencode/ReencodeService';

const PROFILE_HEADER = 'x-valence-profile';

/**
 * Picks the headers worth carrying from a media file the server is forwarding — the type, the
 * length, the range it answered with — and leaves the rest behind rather than passing an upstream
 * response's headers through wholesale.
 *
 * @param file - The response from the file or the media service.
 * @param extra - Anything to add on top.
 * @returns The headers to answer with.
 */
const forwardedFileHeaders = (
  file: { contentType: string; contentRange: string | null; contentLength: string | null },
  extra: Record<string, string> = {},
): Record<string, string> => {
  const headers: Record<string, string> = {
    'content-type': file.contentType,
    'accept-ranges': 'bytes',
    ...extra,
  };

  if (file.contentRange !== null) {
    headers['content-range'] = file.contentRange;
  }

  if (file.contentLength !== null) {
    headers['content-length'] = file.contentLength;
  }

  return headers;
};

/**
 * Tells a client never to keep a session's segments.
 *
 * A session is named by a hash of what was asked for, and that hash says nothing about how the
 * segments were muxed. Change the muxer and the same address answers with different bytes — which
 * is not a theory: it happened during VAL-145, where a browser went on playing segments produced
 * before a fix because it had them already. Sessions are short-lived and their segments are read
 * once, so there is nothing to gain by keeping them and a stale film to lose.
 *
 * @returns The header that stops it being stored at all.
 */
const neverKeep = (): Record<string, string> => ({ 'cache-control': 'no-store' });

const SignInBodySchema = z.object({ password: z.string().min(1) });

const OVERVIEW_PATIENCE_MILLISECONDS = 5_000;

const NOT_STOOD: CatalogueStanding = {
  status: 'askable',
  mediaId: null,
  requestId: null,
  requestState: null,
};

const LIBRARY_KIND_WORDS: Record<LibraryKind, string> = {
  movies: 'films',
  shows: 'series',
  music: 'music',
  books: 'books',
};

const within = async <Answer>(work: Promise<Answer>, fallback: Answer): Promise<Answer> =>
  Promise.race([
    work,
    new Promise<Answer>((resolve) => {
      setTimeout(() => {
        resolve(fallback);
      }, OVERVIEW_PATIENCE_MILLISECONDS).unref();
    }),
  ]);

/**
 * What to tell somebody whose action on an account was refused.
 */
const describeAccountRefusal = (refusal: AccountActionRefusal): string =>
  refusal === 'self'
    ? 'You cannot do that to your own account.'
    : 'That account is at or above your own rank.';

/**
 * What to tell somebody whose change to a role was refused.
 */
const describeRefusal = (refusal: RoleChangeRefusal): string =>
  refusal === 'outranked'
    ? 'That role is at or above your own.'
    : 'You cannot grant a permission you do not hold.';

type ArtefactCount = { count: number; bytes: number };

type StorageCount = {
  cache: {
    previews: ArtefactCount;
    trickplay: ArtefactCount;
    sessions: ArtefactCount;
    atMs: number;
  } | null;
  artwork: { count: number; bytes: number; atMs: number } | null;
  bookPages?: { count: number; bytes: number; atMs: number } | null;
  libraryBytes: number;
};

type CreateAppOptions = {
  auth: ValenceAuth;
  settings: SettingsStore;
  version?: string;
  trustedOrigins?: () => Promise<readonly string[]>;
  countUsers: () => Promise<number>;
  promoteToAdmin: (email: string) => Promise<string | null>;
  library: LibraryService;
  playback: PlaybackService;
  permissions?: PermissionService;
  history?: HistoryService;
  apiKeys?: ApiKeyService;
  webhooks?: WebhookStore;
  notifications?: NotificationStore;
  readPushPublicKey?: () => Promise<string>;
  queueWebhookDelivery?: (subscriptionId: string, payload: string) => Promise<void>;
  banAccount?: (userId: string, reason: string) => Promise<boolean>;
  unbanAccount?: (userId: string) => Promise<boolean>;
  removeAccount?: (userId: string) => Promise<boolean>;
  isAccountBanned?: (userId: string) => Promise<boolean>;
  inviteAccount?: (request: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ id: string; name: string; email: string; createdAt: string } | null>;
  editAccount?: (
    userId: string,
    changes: { name?: string; email?: string },
  ) => Promise<'changed' | 'missing' | 'taken'>;
  readBanReason?: (userId: string) => Promise<string | null>;
  resetAccountPassword?: (userId: string, password: string) => Promise<boolean>;
  listAccountSessions?: (userId: string) => Promise<
    {
      id: string;
      userAgent: string | null;
      ipAddress: string | null;
      createdAt: string;
      expiresAt: string;
    }[]
  >;
  endAccountSessions?: (userId: string) => Promise<void>;
  endAccountSession?: (userId: string, sessionId: string) => Promise<void>;
  setAccountPhoto?: (
    userId: string,
    photo: { body: Uint8Array; contentType: string },
  ) => Promise<PictureFault | null>;
  setAccountAvatar?: (
    userId: string,
    changes: { avatar?: Avatar; colour?: ProfileColour },
  ) => Promise<boolean>;
  maintenance?: MaintenanceService;
  schedules?: JobScheduleService;
  presence?: PresenceService;
  subtitles: SubtitleService;
  segments: SegmentService;
  progress: WatchProgressService;
  downloads?: DownloadService;
  favourites: FavouriteService;
  hiding?: HiddenService;
  ratings: RatingService;
  shares?: ShareService;
  shareSessions?: ShareSessions;
  playbackSessions?: PlaybackSessions;
  profiles?: ProfileService;
  households?: HouseholdService;
  splashscreen?: SplashscreenStore;
  books?: BookService;
  music?: MusicServices;
  reencodes?: ReencodeService;
  onReencodeQueued?: () => void;
  promoteProfile?: (request: {
    profileId: string;
    email: string;
    password: string;
  }) => Promise<
    { kind: 'promoted'; profile: ViewerProfile } | { kind: 'taken' } | { kind: 'missing' }
  >;
  listUsers?: () => Promise<
    { id: string; name: string; email: string; role: string | null; createdAt: string }[]
  >;
  capabilities?: () => Promise<{
    ffmpegVersion: string;
    ffmpegSupported?: boolean;
    hardwareAccels: string[];
    concurrentRenders?: number;
    toneMapping?: 'zscale' | 'libplacebo' | 'unavailable';
    hardwareToneMaps?: string[];
    chains?: {
      accel: string;
      shape: 'preview' | 'sheet' | 'transcode';
      bitDepth: number;
      works: boolean;
      reason: string | null;
    }[];
  }>;
  monitor?: () => Promise<JsonValue>;
  stalledJobs?: () => (JobStall & { label: string })[];
  artworkUsage?: () => { count: number; bytes: number; atMs: number } | null;
  bookPageUsage?: () => { count: number; bytes: number; atMs: number } | null;
  libraryBytes?: () => Promise<number>;
  measureStorage?: () => Promise<StorageCount>;
  readImage?: (url: string) => Promise<{ body: ArrayBuffer; contentType: string } | null>;
  folderDisk?: FolderDisk;
  uploadDisk?: UploadDisk;
  isTranscoderReachable?: () => Promise<boolean>;
  transcoderAddress?: string;
  listRunningJobs?: () => RunningJob[];
  jobDefinitions?: readonly JobDefinition[];
  requests?: RequestsMonitor | null;
  requestsClient?: RequestsClient | null;
  cancelJob?: (jobId: string) => Promise<boolean>;
  controlQueue?: QueueControl | null;
  searchCatalogue?: (query: string, kind: 'tv' | 'movie') => Promise<CatalogueMatch[]>;
  describeForRequest?: (tmdbId: number, kind: VideoRequestKind) => Promise<RequestCatalogue | null>;
  describeMusicForRequest?: (
    musicBrainzId: string,
    kind: MusicRequestKind,
  ) => Promise<RequestCatalogue | null>;
  searchMusicCatalogue?: (query: string, kind: MusicRequestKind) => Promise<MusicCatalogueHit[]>;
  discovery?: Discovery;
  realtime?: RealtimePublisher;
  logs?: LogStore;
  jobHistory?: JobHistoryStore;
  resourceHistory?: ResourceHistoryStore;
  events?: EventBus;
  sayALinkWasWithdrawn?: (told: {
    accountId: string;
    title: string;
    byName: string;
  }) => Promise<void>;
};

/**
 * Builds the Valence HTTP application.
 */
const createApp = ({
  auth,
  settings,
  version: SERVER_VERSION = '0.0.0',
  trustedOrigins,
  countUsers,
  promoteToAdmin,
  library,
  playback,
  maintenance = createMemoryMaintenanceService(),
  schedules = createMemoryJobScheduleService(),
  presence = createPresenceService(),
  subtitles,
  segments,
  progress,
  downloads,
  favourites,
  hiding = createMemoryHiddenService(),
  ratings,
  shares,
  shareSessions,
  playbackSessions,
  profiles,
  households,
  splashscreen = createMemorySplashscreenStore(),
  books,
  music,
  reencodes,
  onReencodeQueued,
  promoteProfile,
  listUsers,
  capabilities,
  artworkUsage,
  bookPageUsage,
  libraryBytes,
  measureStorage,
  monitor,
  stalledJobs,
  readImage,
  isTranscoderReachable = () => Promise.resolve(false),
  folderDisk = createFolderDisk(),
  uploadDisk = createUploadDisk(),
  transcoderAddress = '',
  listRunningJobs = () => [],
  jobDefinitions = JOB_DEFINITIONS,
  requests = null,
  requestsClient = null,
  cancelJob = () => Promise.resolve(false),
  controlQueue = null,
  searchCatalogue = () => Promise.resolve([]),
  describeForRequest = () => Promise.resolve(null),
  describeMusicForRequest = () => Promise.resolve(null),
  searchMusicCatalogue = () => Promise.resolve([]),
  discovery = NO_DISCOVERY,
  permissions = createMemoryPermissionService(),
  history,
  apiKeys = createBetterAuthApiKeyService(auth),
  webhooks = createMemoryWebhookStore(),
  notifications = createMemoryNotificationStore(),
  readPushPublicKey = () => Promise.resolve(''),
  queueWebhookDelivery = () => Promise.resolve(),

  banAccount,
  unbanAccount,
  removeAccount,
  isAccountBanned,
  readBanReason,
  inviteAccount,
  editAccount,
  resetAccountPassword,
  listAccountSessions,
  endAccountSessions,
  endAccountSession,
  setAccountPhoto,
  setAccountAvatar,
  realtime,
  logs,
  jobHistory,
  resourceHistory,
  events,
  sayALinkWasWithdrawn,
}: CreateAppOptions) => {
  const app = new OpenAPIHono();

  /**
   * Says that somebody was given or lost a role, once the change has actually stuck.
   *
   * @param userId - Whose roles changed.
   * @param role - The role that moved.
   * @param change - Whether they gained it or lost it.
   */
  const sayRoleChanged = async (
    userId: string,
    role: string,
    change: 'given' | 'taken',
  ): Promise<void> => {
    if (events === undefined) {
      return;
    }

    const named = ((await listUsers?.()) ?? []).find((one) => one.id === userId);

    void events.publish({
      event: 'account.roleChanged',
      data: { accountId: userId, name: named?.name ?? 'Somebody', role, change },
    });
  };

  app.use('*', async (context, next) => {
    await next();

    context.res.headers.set('Referrer-Policy', 'no-referrer');
    context.res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  });

  app.use(
    '/api/*',
    allowCrossOriginClients({
      trustedOrigins: trustedOrigins ?? (async () => (await settings.read()).trustedOrigins),
    }),
  );

  app.use(
    '/api/*',
    createSessionGate({
      auth,
      showsFaces: async () => (await settings.read()).showsProfilesBeforeSignIn,
      ...(shares === undefined || shareSessions === undefined
        ? {}
        : {
            shareGate: createShareGate({
              shares,
              sessions: shareSessions,
              shareHoldingTab: (clientId) => presence.shareOf(clientId),
              itemOf: async (mediaId) => {
                const item = await library.getMedia(mediaId);

                return item === null
                  ? null
                  : { id: item.id, seriesId: await library.seriesOf(mediaId) };
              },
            }),
          }),
    }),
  );

  /**
   * Whether whoever is asking holds a particular permission.
   */
  const requires = async (headers: Headers, permission: Permission): Promise<boolean> => {
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return false;
    }

    const held = await permissions.resolve(session.user.id);

    if (headers.get('x-api-key') === null) {
      return held.has(permission);
    }

    const allowed = await apiKeys.restrictionFor(headers, session.session.id);

    return narrowToKey(held, allowed).has(permission);
  };

  /**
   * Who a request is for, as both the account it belongs to and the person watching.
   *
   * Everything that decides what may be seen asks this rather than asking for one or the other: the
   * account carries what an administrator enforced, the profile carries what the viewer chose for
   * themselves, and keeping them together is what stops the two being confused.
   *
   * @param headers - The request's headers.
   * @returns Who it is for, or nothing where nobody is signed in.
   */
  const viewerOf = (headers: Headers): Promise<Viewer | null> =>
    readViewer({ auth, permissions, ...(profiles === undefined ? {} : { profiles }) }, headers);

  /**
   * Whether the person asking may open a book, and — where a chapter is named — whether that chapter
   * is in it. A book's library being refused or hidden puts the book out of reach, and asking for a
   * chapter through a book it does not belong to is refused rather than served. A guest has already
   * been held to what was shared with them by the time this is asked.
   *
   * @param headers - The request's headers.
   * @param bookId - The book.
   * @param chapterId - A chapter in it, where the request names one.
   * @returns Whether to serve it.
   */
  const bookInReach = async (
    headers: Headers,
    bookId: string,
    chapterId?: string,
  ): Promise<boolean> =>
    books !== undefined && books.canReach(await viewerOf(headers), bookId, chapterId);

  /**
   * Whether an account was refused the library something sits in.
   *
   * The cheap question is asked first and is usually the only one. Every poster and backdrop on a
   * page arrives as a request of its own, so the common answer — nothing is refused — costs a single
   * indexed lookup. Who is an administrator is worked out only once something has actually been
   * refused, which is rare, rather than on each of the fifty images a library page draws.
   *
   * @param accountId - Whose account is asking.
   * @param subject - The item or programme in question.
   * @returns Whether to refuse it.
   */
  const isOutOfReach = async (accountId: string, subject: Subject): Promise<boolean> => {
    if (subject.kind === 'none') {
      return false;
    }

    const refused =
      subject.kind === 'item'
        ? await library.isOutOfReach(accountId, subject.mediaId)
        : await library.isSeriesOutOfReach(accountId, subject.seriesId);

    if (!refused) {
      return false;
    }

    return !(await permissions.resolve(accountId)).has(ADMINISTRATOR);
  };

  /**
   * Refuses anything a viewer's account may not reach, before the route that would answer it runs.
   *
   * This is the one gate every address naming an item passes through, which is the point: three
   * separate features want content kept out of sight, and a check written into each handler is a
   * check missing from the next handler somebody writes. Reading the subject from the address means
   * a route added later is covered on the day it is written.
   *
   * It asks only what the account may reach, never what the viewer has hidden. Hiding is a
   * preference and tidies a view; it was never meant to lock a door, and somebody following a link
   * to something they hid should still arrive at it. Refusing here would quietly turn hiding into
   * enforcement, which is the one thing both tickets behind this asked not to happen.
   *
   * The cheap question is asked first and is usually the only one. Every poster and backdrop on a
   * page comes through here as a request of its own, so the common answer — nothing is refused —
   * costs a single indexed lookup. Who is an administrator is worked out only once something has
   * actually been refused, which is rare, rather than on each of the fifty images a library page
   * draws.
   *
   * It answers as though the thing were not there, in the same words an item that never existed
   * gets, because being told something exists is most of what was being kept back.
   *
   * A request with nobody signed in is left alone. The session gate has already turned away anyone
   * who is neither signed in nor holding a live share link, so what arrives here without a session
   * is a share guest, and what a share reaches was settled when the link was made.
   *
   * @param context - The request.
   * @param next - The route that would answer it.
   * @returns A refusal, or whatever the route answers.
   */
  const refuseWhatIsOutOfReach: MiddlewareHandler = async (context, next) => {
    const subject = subjectOfRequest(context.req.path);

    if (subject.kind === 'none') {
      return next();
    }

    const session = await readSessionOnce(auth, context.req.raw.headers);

    if (session === null) {
      return next();
    }

    if (await isOutOfReach(session.user.id, subject)) {
      return context.json({ error: 'No such item.' }, 404);
    }

    return next();
  };

  app.use('/api/*', refuseWhatIsOutOfReach);

  app.all('/api/auth/admin/*', createBetterAuthAdminBlock());

  app.on(['GET', 'POST'], '/api/auth/*', (context) => auth.handler(context.req.raw));

  app.openapi(setupStatusRoute, async (context) => {
    const detectedOrigin = new URL(context.req.url).origin;

    return context.json(
      {
        isComplete: (await countUsers()) > 0,
        detectedOrigin,
        isSecureContext: detectedOrigin.startsWith('https://'),
        suggestedTrustedOrigins: suggestTrustedOrigins(detectedOrigin),
      },
      200,
    );
  });

  app.openapi(setupCompleteRoute, async (context) => {
    if ((await countUsers()) > 0) {
      return context.json({ error: 'Setup has already been completed.' }, 409);
    }

    const { admin, trustedOrigins, cookieSecure } = context.req.valid('json');

    const created = await auth.api.signUpEmail({
      body: { name: admin.name, email: admin.email, password: admin.password },
      asResponse: true,
    });

    if (!created.ok) {
      return context.json({ error: 'The administrator account could not be created.' }, 400);
    }

    const ownerAccountId = await promoteToAdmin(admin.email);

    const previous = await settings.read();

    await settings.write({
      trustedOrigins,
      cookieSecure,
      setupCompletedAt: new Date().toISOString(),
      ...(ownerAccountId === null ? {} : { ownerAccountId }),
    });

    return context.json(
      { isComplete: true as const, restartRequired: previous.cookieSecure !== cookieSecure },
      200,
    );
  });

  app.openapi(listLibrariesRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(await library.list(viewer), 200);
  });

  app.openapi(createLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.create'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { name, kind, path, flavour } = context.req.valid('json');

    const created = await library.create({
      name,
      kind,
      path,
      ...(flavour === undefined ? {} : { flavour }),
    });

    if (created === null) {
      return context.json({ error: 'That path is not a readable directory.' }, 400);
    }

    return context.json(created, 201);
  });

  app.openapi(listFoldersRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.create'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const found = await listFolders(folderDisk, context.req.valid('query').path);

    switch (found.kind) {
      case 'listed':
        return context.json(found.listing, 200);
      case 'relative':
        return context.json({ error: 'Give the whole path, starting from the root.' }, 400);
      case 'missing':
        return context.json({ error: 'There is no such folder.' }, 404);
      case 'unreadable':
        return context.json({ error: 'Valence is not allowed to read that folder.' }, 403);
    }
  });

  app.openapi(createFolderRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.create'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { path, name } = context.req.valid('json');
    const made = await createFolder(folderDisk, path, name);

    switch (made.kind) {
      case 'created':
        return context.json(made.folder, 201);
      case 'relative':
        return context.json({ error: 'Give the whole path, starting from the root.' }, 400);
      case 'badName':
        return context.json(
          { error: 'A folder’s name is a single name, with no slashes in it.' },
          400,
        );
      case 'exists':
        return context.json({ error: 'There is already something called that.' }, 409);
      case 'missing':
        return context.json({ error: 'There is no such folder to make it in.' }, 404);
      case 'readOnly':
        return context.json(
          {
            error:
              'That disk is read-only to Valence. Give it read-write access to make folders there.',
          },
          403,
        );
      case 'denied':
        return context.json({ error: 'Valence is not allowed to make a folder there.' }, 403);
    }
  });

  app.openapi(updateLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { defaultAudioLanguage, filesAtOnce, takesRequests, requestProfileId, requestPath } =
      context.req.valid('json');

    const updated = await library.update(context.req.valid('param').id, {
      defaultAudioLanguage,
      ...(filesAtOnce === undefined ? {} : { filesAtOnce }),
      ...(takesRequests === undefined ? {} : { takesRequests }),
      ...(requestProfileId === undefined ? {} : { requestProfileId }),
      ...(requestPath === undefined
        ? {}
        : { requestPath: requestPath === '' ? null : requestPath }),
    });

    if (updated === null) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.json(updated, 200);
  });

  app.openapi(listFacetsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(await library.listFacets(viewer), 200);
  });

  app.openapi(listItemsRoute, async (context) => {
    const { id } = context.req.valid('param');
    const { search, kind, genre, yearFrom, yearTo, minRating, ids, order, limit, offset } =
      context.req.valid('query');

    const { minYourStars } = context.req.valid('query');
    const askedBy = await readProfileId(context.req.raw.headers);
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const page = await library.listItems(viewer, id, {
      ...(search === undefined ? {} : { search }),
      ...(kind === undefined ? {} : { kind }),
      ...(genre === undefined ? {} : { genre }),
      ...(yearFrom === undefined ? {} : { yearFrom }),
      ...(yearTo === undefined ? {} : { yearTo }),
      ...(minRating === undefined ? {} : { minRating }),
      ...(ids === undefined ? {} : { ids: ids.split(',').filter((named) => named.trim() !== '') }),
      ...(order === undefined ? {} : { order }),
      ...(askedBy === null ? {} : { profileId: askedBy }),
      ...(minYourStars === undefined ? {} : { minYourStars }),
      limit: limit ?? DEFAULT_LIMIT,
      offset: offset ?? 0,
    });

    if (page === null) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.json(page, 200);
  });

  app.openapi(listShowsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const shows = await library.listShows(viewer, context.req.valid('param').id);

    if (shows === null) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.json({ shows }, 200);
  });

  app.openapi(getShowRoute, async (context) => {
    const { id, showId } = context.req.valid('param');
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const show = await library.getShow(viewer, id, showId);

    if (show === null) {
      return context.json({ error: 'No such series.' }, 404);
    }

    return context.json(show, 200);
  });

  app.openapi(comingUpRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ shows: await library.comingUp(viewer) }, 200);
  });

  app.openapi(getMediaRoute, async (context) => {
    const item = await library.getMedia(context.req.valid('param').id);

    if (item === null) {
      return context.json({ error: 'No such item.' }, 404);
    }

    return context.json(item, 200);
  });

  app.openapi(uploadMediaRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const target = (await library.list(viewer)).find(
      (entry) => entry.id === context.req.valid('param').id,
    );

    if (target === undefined) {
      return context.json({ error: 'No such library.' }, 404);
    }

    const relativePath = context.req.valid('query').path;
    const plan = planUpload(target.path, relativePath, target.kind);

    if (plan.kind === 'badPath') {
      return context.json(
        { error: 'A file goes at a plain path inside the library, with no dots or empty names.' },
        400,
      );
    }

    if (plan.kind === 'refused') {
      return context.json({ error: 'That is not something this library reads.' }, 415);
    }

    const body = context.req.raw.body;

    if (body === null) {
      return context.json({ error: 'No file was sent.' }, 400);
    }

    const written = await uploadDisk.write(plan.destination, body);

    switch (written.kind) {
      case 'written':
        return context.json({ path: relativePath, bytes: written.bytes }, 201);
      case 'exists':
        return context.json({ error: 'There is already a file called that.' }, 409);
      case 'readOnly':
        return context.json(
          {
            error:
              'That disk is read-only to Valence. Give it read-write access to upload media there.',
          },
          403,
        );
      case 'denied':
        return context.json({ error: 'Valence is not allowed to write there.' }, 403);
      case 'failed':
        return context.json({ error: 'The file could not be written.' }, 500);
    }
  });

  app.openapi(scanLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const asked = context.req.valid('query');

    const queued = await library.scan(
      context.req.valid('param').id,
      asked.force === 'true',
      asked.runId === undefined || asked.runOf === undefined
        ? undefined
        : { id: asked.runId, of: asked.runOf },
    );

    if (queued === null) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.json(queued, 202);
  });

  app.openapi(searchCatalogueRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { query, kind } = context.req.valid('query');

    return context.json({ matches: await searchCatalogue(query, kind) }, 200);
  });

  app.openapi(correctMatchRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: 'That is for administrators.' }, 404);
    }

    const { reference, kind } = context.req.valid('json');
    const read = readCatalogueReference(reference);

    if (read === null) {
      return context.json({ error: 'That does not look like a catalogue address or id.' }, 400);
    }

    const externalKind = read.kind ?? kind ?? null;

    if (externalKind === null) {
      return context.json(
        { error: 'Say whether that id is a series or a film — the same number is both.' },
        400,
      );
    }

    const corrected = await library.correctMatch(
      context.req.valid('param').id,
      { externalId: read.id, externalKind },
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    return corrected === null
      ? context.json({ error: 'No such item.' }, 404)
      : context.json(corrected, 200);
  });

  app.openapi(forgetCorrectionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: 'That is for administrators.' }, 404);
    }

    const forgotten = await library.forgetCorrection(context.req.valid('param').id);

    return forgotten === null
      ? context.json({ error: 'No such item.' }, 404)
      : context.json(forgotten, 200);
  });

  app.openapi(rebuildArtefactsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: 'That is for administrators.' }, 404);
    }

    const rebuilt = await library.rebuildArtefacts(context.req.valid('param').id);

    return rebuilt === null
      ? context.json({ error: 'No such item.' }, 404)
      : context.json(rebuilt, 200);
  });

  app.openapi(setPreviewMomentRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: 'That is for administrators.' }, 404);
    }

    const { atSeconds, durationSeconds } = context.req.valid('json');
    const outcome = await library.setPreviewMoment(
      context.req.valid('param').id,
      { atSeconds, durationSeconds: durationSeconds ?? null },
      (await readAccount(context.req.raw.headers))?.id ?? null,
    );

    if (outcome.kind === 'absent') {
      return context.json({ error: 'No such item.' }, 404);
    }

    if (outcome.kind === 'beyondTheEnd') {
      return context.json(
        {
          error: `That is past the end — the file runs ${outcome.durationSeconds.toString()} seconds.`,
        },
        400,
      );
    }

    return context.json(outcome.moment, 200);
  });

  app.openapi(clearPreviewMomentRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json({ error: 'That is for administrators.' }, 404);
    }

    const cleared = await library.clearPreviewMoment(context.req.valid('param').id);

    return cleared === null
      ? context.json({ error: 'No such item.' }, 404)
      : context.json(cleared, 200);
  });

  app.openapi(runningScansRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    return context.json(
      {
        scans: listRunningJobs().map((job) => ({
          jobId: job.jobId,
          kind: job.kind,
          libraryId: job.subject,
          phase: job.progress?.phase ?? null,
          processed: job.progress?.processed ?? null,
          total: job.progress?.total ?? null,
          item: job.progress?.item ?? null,
        })),
      },
      200,
    );
  });

  app.openapi(scanStateRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { jobId } = context.req.valid('param');
    const { state, phase, processed, total, item } = await library.readScanState(jobId);

    return context.json({ jobId, state, phase, processed, total, item }, 200);
  });

  app.openapi(resetLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.runDestructive'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const reset = await library.reset(context.req.valid('param').id);

    if (reset === null) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.json(reset, 202);
  });

  app.openapi(deleteLibraryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'library.delete'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    if (!(await library.remove(context.req.valid('param').id))) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(regeneratePreviewsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const queued = await library.regeneratePreviews(context.req.valid('param').id);

    if (queued === null) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.json(queued, 202);
  });

  app.openapi(healthRoute, async (context) => {
    const transcoderReachable = await isTranscoderReachable();

    return context.json(
      {
        status: transcoderReachable ? ('ok' as const) : ('degraded' as const),
        version: SERVER_VERSION,
        transcoderReachable,
      },
      200,
    );
  });

  app.openapi(explainRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const { deviceProfile, requestedQuality } = context.req.valid('json');

    const explanation = await playback.explain(mediaId, deviceProfile, requestedQuality);

    if (explanation === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    return context.json(explanation, 200);
  });

  app.openapi(startRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const {
      deviceProfile,
      clientId,
      startSeconds,
      audioStreamIndex,
      requestedQuality,
      subtitleStreamIndex,
    } = context.req.valid('json');

    const outcome = await playback.start(
      mediaId,
      deviceProfile,
      startSeconds ?? 0,
      audioStreamIndex,
      requestedQuality,
      clientId,
      subtitleStreamIndex,
    );

    if (outcome.kind === 'notFound') {
      return context.json({ error: 'No such media item.' }, 404);
    }

    if (outcome.kind === 'unsupported') {
      return context.json({ error: outcome.reason }, 422);
    }

    if (outcome.kind === 'failed') {
      return context.json({ error: outcome.reason }, 500);
    }

    const openedBy = getCookie(context, SHARE_COOKIE);

    if (openedBy !== undefined && shares !== undefined && shareSessions !== undefined) {
      const held = await shares.resolve(openedBy);

      if (held !== null) {
        shareSessions.claim(outcome.session.sessionId, held.id);
      }
    }

    const startedBy = await readProfileId(context.req.raw.headers);

    if (startedBy !== null) {
      playbackSessions?.claim(outcome.session.sessionId, startedBy);
    }

    const isTheirOwnDevice = await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId);

    if (clientId !== undefined && isTheirOwnDevice) {
      const item = await library.getMedia(mediaId);

      if (item !== null) {
        presence.startPlayback(clientId, {
          mediaId,
          mediaTitle: item.title,
          hasPoster: item.metadata.hasPoster,
          hasBackdrop: item.metadata.hasBackdrop,
          mode: outcome.session.delivery.kind === 'direct' ? 'direct' : 'transcode',
          reuse: outcome.session.reuse,
          transcoderSessionId:
            outcome.session.delivery.kind === 'hls' ? outcome.session.sessionId : null,
          plan: outcome.session.plan,
        });
      }
    }

    return context.json(outcome.session, 200);
  });

  app.openapi(sessionFileRoute, async (context) => {
    const { sessionId, name } = context.req.valid('param');

    if (!(await isTheSessionOfWhoeverIsAsking(context.req.raw.headers, sessionId))) {
      return context.json({ error: 'That session belongs to somebody else.' }, 403);
    }

    const file = await playback.readSessionFile(sessionId, name);

    if (file === null) {
      return context.json({ error: 'No such session or segment.' }, 404);
    }

    return context.body(file.body, 200, forwardedFileHeaders(file, neverKeep()));
  });

  app.openapi(directFileRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const range = context.req.header('range') ?? null;

    const file = await playback.readDirectFile(mediaId, range);

    if (file === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    return context.body(file.body, file.status === 206 ? 206 : 200, forwardedFileHeaders(file));
  });

  app.openapi(trickplayRoute, async (context) => {
    const { mediaId } = context.req.valid('param');

    try {
      const thumbnails = await playback.trickplay(mediaId);

      if (thumbnails === null) {
        return context.json({ error: 'No such media item.' }, 404);
      }

      return context.json(thumbnails, 200);
    } catch {
      return context.json({ error: 'The thumbnails could not be rendered.' }, 500);
    }
  });

  app.openapi(frameRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const { seconds, width } = context.req.valid('query');

    const frame = await playback.readFrame(mediaId, seconds, width);

    if (frame === null) {
      return context.json({ error: 'No frame there.' }, 404);
    }

    return context.body(frame, 200, {
      'content-type': 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable',
    });
  });

  app.get('/api/media/:mediaId/preview', async (context) => {
    const read = await playback
      .readPreview(context.req.param('mediaId'), context.req.header('range') ?? null)
      .catch((): PreviewRead => ({ kind: 'absent' }));

    if (read.kind === 'pending') {
      return context.json({ status: 'generating' }, 202, { 'cache-control': 'no-store' });
    }

    if (read.kind === 'absent') {
      return context.json({ error: 'No preview yet.' }, 404);
    }

    return context.body(
      read.file.body,
      read.file.status === 206 ? 206 : 200,
      forwardedFileHeaders(read.file, { 'cache-control': 'public, max-age=86400' }),
    );
  });

  app.openapi(trickplayFileRoute, async (context) => {
    const { trickplayId, name } = context.req.valid('param');

    const file = await playback.readTrickplayFile(trickplayId, name);

    if (file === null) {
      return context.json({ error: 'No such thumbnails.' }, 404);
    }

    return context.body(file.body, 200, { 'content-type': file.contentType });
  });

  /**
   * Which person on this account is watching.
   */
  const readProfileId = async (headers: Headers): Promise<string | null> => {
    const session = await readSessionOnce(auth, headers);
    const viewer = session?.user;

    if (viewer === undefined || profiles === undefined) {
      return null;
    }

    const named = headers.get(PROFILE_HEADER);

    if (named !== null && (await profiles.belongsTo(viewer.id, named))) {
      return named;
    }

    return (await profiles.ensureDefault(viewer.id, viewer.name)).id;
  };

  /**
   * Tells every tab on an account that its profiles have changed, so a rename or a new picture shows
   * on the other devices that person is signed in on rather than waiting for a reload.
   *
   * Told to everybody rather than to one account where the way in draws the household's faces,
   * because then a face is not private to the account that owns it: every other household holds it
   * in a cache keyed by when it last changed, and telling nobody leaves them all showing a face its
   * owner replaced until something else happens to make them ask again.
   *
   * @param accountId - Whose profiles changed.
   */
  const announceProfiles = async (accountId: string): Promise<void> => {
    realtime?.publish(
      'profile',
      { changed: true },
      (await settings.read()).showsProfilesBeforeSignIn
        ? { kind: 'everyone' }
        : { kind: 'accounts', accountIds: [accountId] },
    );
  };

  /**
   * Who owns this server, or nothing where no owner has been recorded.
   *
   * An install from before ownership existed has none until it is settled at startup, and the rules
   * fall back to rank alone rather than to trusting anybody in particular.
   *
   * @returns The owning account's identifier, or null.
   */
  const theOwner = async (): Promise<string | null> => {
    const { ownerAccountId } = await settings.read();

    return ownerAccountId === '' ? null : ownerAccountId;
  };

  /**
   * Who is signed in, for the routes that act on their own account.
   */
  const readAccount = async (headers: Headers) =>
    (await readSessionOnce(auth, headers))?.user ?? null;

  /**
   * Whether a device named in a request may be spoken for by whoever is asking.
   *
   * A client identifier is a value the caller chooses, so a route acting on one has to ask whose it
   * is. Presence holds the answer, and holds it from the account its socket was authenticated as
   * rather than from anything a client sent.
   *
   * A device nobody is holding is nobody's to take, so it passes: a tab whose socket has not
   * identified yet goes on working, and a guest holding a share link has no account to match in the
   * first place. What is refused is a device somebody else is holding.
   *
   * @param headers - The request's headers, for reading who is asking.
   * @param clientId - The device named, where one was named at all.
   * @returns Whether the request may act on that device.
   */
  /**
   * Whether a playback session named in a request may be read by whoever is asking.
   *
   * A session identifier is the only thing a manifest's addresses carry, so a route serving one has
   * to ask whose viewing it is. What it protects is the viewing rather than the film: every
   * signed-in account may already read any item, so this keeps somebody's session from being
   * watched over their shoulder rather than keeping the catalogue shut.
   *
   * A session nobody is holding is nobody's to take, so it passes — a session started before this
   * server knew to record who started it goes on working. So does a guest holding a share link,
   * whose own gate has already checked that this share started this session.
   *
   * @param headers - The request's headers, for reading whose face is asking.
   * @param sessionId - The session named.
   * @returns Whether the request may read it.
   */
  const isTheSessionOfWhoeverIsAsking = async (
    headers: Headers,
    sessionId: string,
  ): Promise<boolean> => {
    if (playbackSessions === undefined || !playbackSessions.isHeld(sessionId)) {
      return true;
    }

    const asking = await readProfileId(headers);

    return asking === null || playbackSessions.isClaimedBy(sessionId, asking);
  };

  const isTheDeviceOfWhoeverIsAsking = async (
    headers: Headers,
    clientId: string | undefined,
  ): Promise<boolean> => {
    const owner = clientId === undefined ? null : presence.ownerOf(clientId);

    if (owner === null) {
      return true;
    }

    return owner === (await readAccount(headers))?.id;
  };

  /**
   * Whoever is asking, if they may hold keys at all.
   */
  const readKeyHolder = async (headers: Headers) => {
    const account = await readAccount(headers);

    if (account === null) {
      return { account: null, refusal: 'anonymous' } as const;
    }

    return (await requires(headers, 'account.keys'))
      ? ({ account, refusal: null } as const)
      : ({ account: null, refusal: 'forbidden' } as const);
  };

  app.openapi(listApiKeysRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json({ error: 'Nobody is signed in.' }, 401)
        : context.json({ error: 'This account may not hold API keys.' }, 403);
    }

    return context.json({ keys: await apiKeys.list(context.req.raw.headers) }, 200);
  });

  app.openapi(createApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json({ error: 'Nobody is signed in.' }, 401)
        : context.json({ error: 'This account may not hold API keys.' }, 403);
    }

    const account = holder.account;

    const { name, expiresInDays, permissions: asked, rateLimit } = context.req.valid('json');

    const held = await permissions.resolve(account.id);
    const restricted = asked === null ? null : asked.filter((one) => held.has(one));

    const made = await apiKeys.create(account.id, {
      name,
      expiresInDays,
      permissions: restricted,
      rateLimit,
    });

    return context.json(made, 201);
  });

  app.openapi(updateApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json({ error: 'Nobody is signed in.' }, 401)
        : context.json({ error: 'This account may not hold API keys.' }, 403);
    }

    const changed = await apiKeys.setEnabled(
      context.req.raw.headers,
      context.req.valid('param').id,
      context.req.valid('json').enabled,
    );

    if (changed === null) {
      return context.json({ error: 'No such key on this account.' }, 404);
    }

    return context.json(changed, 200);
  });

  app.openapi(revokeApiKeyRoute, async (context) => {
    const holder = await readKeyHolder(context.req.raw.headers);

    if (holder.refusal !== null) {
      return holder.refusal === 'anonymous'
        ? context.json({ error: 'Nobody is signed in.' }, 401)
        : context.json({ error: 'This account may not hold API keys.' }, 403);
    }

    if (!(await apiKeys.revoke(context.req.raw.headers, context.req.valid('param').id))) {
      return context.json({ error: 'No such key on this account.' }, 404);
    }

    return context.body(null, 204);
  });

  /**
   * Whether this request may manage subscriptions, and why not if it may not.
   */
  const readWebhookKeeper = async (
    headers: Headers,
  ): Promise<'anonymous' | 'forbidden' | 'allowed'> => {
    const account = await readAccount(headers);

    if (account === null) {
      return 'anonymous';
    }

    return (await requires(headers, 'server.webhooks')) ? 'allowed' : 'forbidden';
  };

  const refuseWebhookKeeper = (keeper: 'anonymous' | 'forbidden') =>
    keeper === 'anonymous'
      ? ({ error: 'Nobody is signed in.', status: 401 } as const)
      : ({ error: 'This account may not manage webhooks.', status: 403 } as const);

  app.openapi(listWebhooksRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    return context.json({ webhooks: await webhooks.list() }, 200);
  });

  app.openapi(createWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const asked = context.req.valid('json');

    if (!isSafeWebhookUrl(asked.url)) {
      return context.json({ error: 'Valence will not send deliveries to that address.' }, 400);
    }

    const made = await webhooks.create(asked);

    return context.json({ ...made.subscription, secret: made.secret }, 201);
  });

  app.openapi(updateWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const asked = context.req.valid('json');

    if (asked.url !== undefined && !isSafeWebhookUrl(asked.url)) {
      return context.json({ error: 'Valence will not send deliveries to that address.' }, 400);
    }

    const changed = await webhooks.update(context.req.valid('param').id, asked);

    return changed === null
      ? context.json({ error: 'No such subscription.' }, 404)
      : context.json(changed, 200);
  });

  app.openapi(deleteWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    if (!(await webhooks.remove(context.req.valid('param').id))) {
      return context.json({ error: 'No such subscription.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(testWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const queued = await queueWebhookTest({
      subscriptions: webhooks,
      subscriptionId: context.req.valid('param').id,
      enqueue: queueWebhookDelivery,
    });

    return queued
      ? context.json({ queued }, 202)
      : context.json({ error: 'No such subscription, or it is turned off.' }, 404);
  });

  app.openapi(listWebhookDeliveriesRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const { id } = context.req.valid('param');

    const exists = (await webhooks.list()).some((webhook) => webhook.id === id);

    if (!exists) {
      return context.json({ error: 'No such subscription.' }, 404);
    }

    return context.json({ deliveries: await webhooks.listDeliveries(id, DELIVERY_PAGE) }, 200);
  });

  app.openapi(redeliverWebhookRoute, async (context) => {
    const keeper = await readWebhookKeeper(context.req.raw.headers);

    if (keeper !== 'allowed') {
      const refusal = refuseWebhookKeeper(keeper);

      return context.json({ error: refusal.error }, refusal.status);
    }

    const { id, deliveryId } = context.req.valid('param');

    const queued = await queueWebhookRedelivery({
      subscriptions: webhooks,
      subscriptionId: id,
      deliveryId,
      enqueue: queueWebhookDelivery,
    });

    return queued
      ? context.json({ queued }, 202)
      : context.json(
          { error: 'No such delivery, or the subscription is gone or turned off.' },
          404,
        );
  });

  app.openapi(listNotificationsRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(
      {
        notifications: await notifications.list(account.id, NOTIFICATION_PAGE),
        unread: await notifications.countUnread(account.id),
      },
      200,
    );
  });

  app.openapi(readNotificationsRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { id } = context.req.valid('json');

    await notifications.markRead(account.id, id);

    return context.json({ unread: await notifications.countUnread(account.id) }, 200);
  });

  app.openapi(clearNotificationsRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { id } = context.req.valid('json');

    await notifications.clear(account.id, id);

    return context.json({ unread: await notifications.countUnread(account.id) }, 200);
  });

  app.openapi(readNotificationPreferencesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const stored = await notifications.readPreferences(account.id);

    const chosen = new Map(stored.map((one) => [one.event, one]));

    const preferences = NOTIFICATION_EVENTS.map(
      (event) => chosen.get(event) ?? { event, ...DEFAULT_NOTIFICATION_PREFERENCE },
    );

    return context.json({ preferences, pushPublicKey: await readPushPublicKey() }, 200);
  });

  app.openapi(writeNotificationPreferenceRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await notifications.writePreference(account.id, context.req.valid('json'));

    return context.body(null, 204);
  });

  app.openapi(subscribeToPushRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await notifications.addPushEndpoint(account.id, context.req.valid('json'));

    return context.body(null, 204);
  });

  app.openapi(unsubscribeFromPushRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await notifications.removePushEndpoint(account.id, context.req.valid('json').endpoint);

    return context.body(null, 204);
  });

  app.openapi(listProfilesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await profiles.ensureDefault(account.id, account.name);

    return context.json({ profiles: await profiles.list(account.id) }, 200);
  });

  app.openapi(createProfileRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { name, colour, avatar } = context.req.valid('json');

    try {
      const created = await profiles.create(account.id, {
        name,
        colour,
        ...(avatar === undefined ? {} : { avatar }),
      });

      await announceProfiles(account.id);

      return context.json(created, 201);
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : 'That profile could not be added.' },
        409,
      );
    }
  });

  app.openapi(updateProfileRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { name, colour, avatar, askStillWatchingAfter, showsWhatIamWatching } =
      context.req.valid('json');

    const changed = await profiles.rename(account.id, context.req.valid('param').profileId, {
      name,
      colour,
      ...(avatar === undefined ? {} : { avatar }),
      ...(askStillWatchingAfter === undefined ? {} : { askStillWatchingAfter }),
      ...(showsWhatIamWatching === undefined ? {} : { showsWhatIamWatching }),
    });

    if (changed) {
      await announceProfiles(account.id);
    }

    return changed
      ? context.body(null, 204)
      : context.json({ error: 'No such profile on this account.' }, 404);
  });

  app.openapi(deleteProfileRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const removed = await profiles.remove(account.id, context.req.valid('param').profileId);

    if (removed) {
      await announceProfiles(account.id);
    }

    return removed
      ? context.body(null, 204)
      : context.json({ error: 'No such profile, or it is the only one left.' }, 404);
  });

  app.openapi(promoteProfileRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    if (profiles === undefined || promoteProfile === undefined) {
      return context.json({ error: 'No such profile.' }, 404);
    }

    const { profileId } = context.req.valid('param');
    const { email, password } = context.req.valid('json');

    const outcome = await promoteProfile({ profileId, email, password });

    if (outcome.kind === 'taken') {
      return context.json({ error: 'That address already has an account.' }, 409);
    }

    if (outcome.kind === 'missing') {
      return context.json({ error: 'No such profile.' }, 404);
    }

    return context.json(outcome.profile, 200);
  });

  app.openapi(readOnboardingRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const [household, isOnboarded] = await Promise.all([
      households.read(account.id, account.name),
      households.isOnboarded(account.id),
    ]);

    return context.json({ isOnboarded, household }, 200);
  });

  app.openapi(changeHouseholdRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await households.change(account.id, context.req.valid('json'));

    return context.json(await households.read(account.id, account.name), 200);
  });

  app.openapi(finishOnboardingRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await households.finishOnboarding(account.id);

    return context.body(null, 204);
  });

  app.get('/api/account/avatar', async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const picture = await households.readAvatar(account.id);

    if (picture === null) {
      return context.json({ error: 'That household has no picture.' }, 404);
    }

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control':
        context.req.query('v') === undefined
          ? 'private, max-age=60'
          : 'private, max-age=31536000, immutable',
    });
  });

  app.get('/api/admin/accounts/:userId/avatar', async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const picture = await households?.readAvatar(context.req.param('userId'));

    if (picture === undefined || picture === null) {
      return context.json({ error: 'That household has no picture.' }, 404);
    }

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control':
        context.req.query('v') === undefined
          ? 'private, max-age=60'
          : 'private, max-age=31536000, immutable',
    });
  });

  app.put('/api/account/photo', tooBigToRead(HOUSEHOLD_LIMITS), async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || households === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const wrong = await households.savePhoto(account.id, {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong, HOUSEHOLD_LIMITS);

      return context.json({ error: said.error }, said.status);
    }

    return context.body(null, 204);
  });

  app.get('/api/profiles/:profileId/avatar', async (context) => {
    const picture = await profiles?.readAvatar(context.req.param('profileId'));

    if (picture === undefined || picture === null) {
      return context.json({ error: 'That profile has no picture.' }, 404);
    }

    const isVersioned = context.req.query('v') !== undefined;

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control': isVersioned ? 'private, max-age=31536000, immutable' : 'private, max-age=60',
    });
  });

  app.get('/api/appearance', async (context) => {
    const { roundness } = await settings.read();

    return context.json({ roundness }, 200);
  });

  app.get('/api/profiles/everyone', async (context) => {
    const everyone = await profiles?.listEveryone();

    return context.json(
      { profiles: everyone ?? [], splashscreen: await splashscreen.address() },
      200,
    );
  });

  app.get('/api/splashscreen', async (context) => {
    const picture = await splashscreen.read();

    if (picture === null) {
      return context.json({ error: 'This server has no picture behind the way in.' }, 404);
    }

    const isVersioned = context.req.query('v') !== undefined;

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control': isVersioned ? 'private, max-age=31536000, immutable' : 'private, max-age=60',
    });
  });

  app.put('/api/admin/splashscreen', tooBigToRead(SPLASHSCREEN_LIMITS), async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const wrong = await splashscreen.save({
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong, SPLASHSCREEN_LIMITS);

      return context.json({ error: said.error }, said.status);
    }

    return context.json({ splashscreen: await splashscreen.address() }, 200);
  });

  app.delete('/api/admin/splashscreen', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    return context.json({ removed: await splashscreen.remove() }, 200);
  });

  app.post('/api/profiles/:profileId/sign-in', async (context) => {
    if (profiles === undefined) {
      return context.json({ error: 'No such profile.' }, 404);
    }

    const body = await context.req.text().catch(() => '');
    const parsed = SignInBodySchema.safeParse(JsonValueSchema.parse(JSON.parse(body || 'null')));

    if (!parsed.success) {
      return context.json({ error: 'A password is required.' }, 400);
    }

    const email = await profiles.findSignInEmail(context.req.param('profileId'));

    if (email === null) {
      return context.json({ error: 'No such profile.' }, 404);
    }

    const forwarded = new Headers(context.req.raw.headers);

    forwarded.set('content-type', 'application/json');
    forwarded.delete('content-length');

    return auth.handler(
      new Request(new URL('/api/auth/sign-in/email', context.req.url), {
        method: 'POST',
        headers: forwarded,
        body: JSON.stringify({ email, password: parsed.data.password }),
      }),
    );
  });

  app.get('/api/profiles/avatars/:style', (context) => {
    const style = context.req.param('style');
    const seed = context.req.query('seed') ?? 'valence';

    if (!isAvatarStyle(style)) {
      return context.json({ error: 'No such style.' }, 404);
    }

    return context.body(drawAvatar(style, seed), 200, {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=86400',
    });
  });

  app.put('/api/profiles/:profileId/photo', tooBigToRead(), async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || profiles === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const wrong = await profiles.savePhoto(account.id, context.req.param('profileId'), {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong);

      return context.json({ error: said.error }, said.status);
    }

    await announceProfiles(account.id);

    return context.body(null, 204);
  });

  app.openapi(adminLogsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.logs'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    if (logs === undefined) {
      return context.json({ records: [], total: 0 }, 200);
    }

    return context.json(await logs.read(context.req.valid('json')), 200);
  });

  app.openapi(adminMeasureStorageRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.monitor'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const measured = await measureStorage?.();

    return context.json(
      {
        cache: measured?.cache ?? null,
        artwork: measured?.artwork ?? null,
        bookPages: measured?.bookPages ?? null,
        libraryBytes: measured?.libraryBytes ?? 0,
      },
      200,
    );
  });

  app.openapi(adminOverviewRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.monitor'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const [users, current, libraries, transcoderCapabilities, isReachable] = await Promise.all([
      listUsers?.() ?? Promise.resolve([]),
      settings.read(),
      library.list(asTheServer),
      within(capabilities?.().catch(() => null) ?? Promise.resolve(null), null),
      within(isTranscoderReachable(), false),
    ]);

    return context.json(
      {
        users,
        settings: {
          hasCatalogueKey: current.catalogueApiKey !== '',
          hasAudioDbKey: current.audioDbKey !== '',
          hasOmdbKey: current.omdbKey !== '',
          hardwareAccel: current.hardwareAccel,
          previewQuality: current.previewQuality,
          certificationRegion: current.certificationRegion,
          showsProfilesBeforeSignIn: current.showsProfilesBeforeSignIn,
          fetchesCatalogueTrailers: current.fetchesCatalogueTrailers,
          fetchesMusicDetails: current.fetchesMusicDetails,
          requestReleaseTypes: current.requestReleaseTypes,
          roundness: current.roundness,
          splashscreen: await splashscreen.address(),
          trustedOrigins: current.trustedOrigins,
          cookieSecure: current.cookieSecure,
        },
        transcoder: {
          isReachable,
          address: transcoderAddress,
          ffmpegVersion: transcoderCapabilities?.ffmpegVersion ?? null,
          ffmpegSupported: transcoderCapabilities?.ffmpegSupported ?? true,
          hardwareAccels: transcoderCapabilities?.hardwareAccels ?? [],
          chains: transcoderCapabilities?.chains ?? [],
          concurrentRenders: transcoderCapabilities?.concurrentRenders ?? 0,
          toneMapping: transcoderCapabilities?.toneMapping ?? 'unavailable',
          hardwareToneMaps: transcoderCapabilities?.hardwareToneMaps ?? [],
        },
        library: {
          libraryCount: libraries.length,
          itemCount: libraries.reduce((total, entry) => total + entry.itemCount, 0),
          bytes: await (libraryBytes?.() ?? Promise.resolve(0)),
        },
        artwork: artworkUsage?.() ?? null,
        bookPages: bookPageUsage?.() ?? null,
        jobs: { stalled: stalledJobs?.() ?? [] },
      },
      200,
    );
  });

  app.openapi(adminSettingsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const patch = context.req.valid('json');
    const before = await settings.read();

    const updated = await settings.write({
      ...(patch.catalogueApiKey === undefined ? {} : { catalogueApiKey: patch.catalogueApiKey }),
      ...(patch.audioDbKey === undefined ? {} : { audioDbKey: patch.audioDbKey }),
      ...(patch.omdbKey === undefined ? {} : { omdbKey: patch.omdbKey }),
      ...(patch.hardwareAccel === undefined ? {} : { hardwareAccel: patch.hardwareAccel }),
      ...(patch.previewQuality === undefined ? {} : { previewQuality: patch.previewQuality }),
      ...(patch.certificationRegion === undefined
        ? {}
        : { certificationRegion: patch.certificationRegion.toUpperCase() }),
      ...(patch.showsProfilesBeforeSignIn === undefined
        ? {}
        : { showsProfilesBeforeSignIn: patch.showsProfilesBeforeSignIn }),
      ...(patch.fetchesCatalogueTrailers === undefined
        ? {}
        : { fetchesCatalogueTrailers: patch.fetchesCatalogueTrailers }),
      ...(patch.fetchesMusicDetails === undefined
        ? {}
        : { fetchesMusicDetails: patch.fetchesMusicDetails }),
      ...(patch.requestReleaseTypes === undefined
        ? {}
        : { requestReleaseTypes: patch.requestReleaseTypes }),
      ...(patch.roundness === undefined ? {} : { roundness: patch.roundness }),
    });

    if (updated.certificationRegion !== before.certificationRegion) {
      await maintenance.run(READ_CERTIFICATES_AGAIN_JOB);
    }

    if (updated.previewQuality !== before.previewQuality) {
      const libraries = await library.list(asTheServer);

      await Promise.all(
        libraries
          .filter((entry) => entry.kind !== 'books')
          .map((entry) => library.remakePreviews(entry.id)),
      );
    }

    return context.json(
      {
        hasCatalogueKey: updated.catalogueApiKey !== '',
        hasAudioDbKey: updated.audioDbKey !== '',
        hasOmdbKey: updated.omdbKey !== '',
        trustedOrigins: updated.trustedOrigins,
        cookieSecure: updated.cookieSecure,
        hardwareAccel: updated.hardwareAccel,
        previewQuality: updated.previewQuality,
        certificationRegion: updated.certificationRegion,
        showsProfilesBeforeSignIn: updated.showsProfilesBeforeSignIn,
        fetchesCatalogueTrailers: updated.fetchesCatalogueTrailers,
        fetchesMusicDetails: updated.fetchesMusicDetails,
        requestReleaseTypes: updated.requestReleaseTypes,
        roundness: updated.roundness,
        splashscreen: await splashscreen.address(),
      },
      200,
    );
  });

  app.openapi(adminSessionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.view'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const listeningOn = async (clientId: string) => {
      const nowPlaying = music?.devices.playingOn(clientId) ?? null;

      if (music === undefined || nowPlaying === null) {
        return null;
      }

      return listeningFor(
        nowPlaying,
        await music.library.readTrackFile(asTheServer, nowPlaying.trackId),
      );
    };

    return context.json(
      await Promise.all(
        presence.list().map(async (entry) => ({
          clientId: entry.clientId,
          accountId: entry.accountId,
          profileId: entry.profileId,
          profileName: entry.profileName,
          isGuest: entry.viaShare !== null,
          guestOf: entry.guestOf,
          deviceLabel: entry.deviceLabel,
          connectedAt: entry.connectedAt,
          playback: entry.playback,
          listening: await listeningOn(entry.clientId),
        })),
      ),
      200,
    );
  });

  app.openapi(adminStopSessionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.stop'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { clientId } = context.req.valid('param');

    if (music?.devices.order(clientId, { kind: 'stop' }) === true) {
      return context.body(null, 204);
    }

    const transcoderSessionId = presence.list().find((entry) => entry.clientId === clientId)
      ?.playback?.transcoderSessionId;

    if (transcoderSessionId !== null && transcoderSessionId !== undefined) {
      await playback.stop(transcoderSessionId, clientId);
    }

    if (!presence.stop(clientId, 'This stream was stopped by an admin.')) {
      return context.json({ error: 'That tab is not open.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(adminPauseSessionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.pause'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { clientId } = context.req.valid('param');
    const entry = presence.list().find((candidate) => candidate.clientId === clientId);

    if (entry === undefined) {
      return context.json({ error: 'That tab is not open.' }, 404);
    }

    if (
      !presence.pause(clientId, 'This stream was paused by an admin.') &&
      music?.devices.order(clientId, { kind: 'pause' }) !== true
    ) {
      return context.json({ error: 'That tab is not watching anything.' }, 409);
    }

    return context.body(null, 204);
  });

  app.openapi(adminMessageSessionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.message'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { clientId } = context.req.valid('param');

    if (!presence.message(clientId, context.req.valid('json').text)) {
      return context.json({ error: 'That tab is not open.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(adminResumeSessionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'streaming.pause'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { clientId } = context.req.valid('param');
    const isListening = music?.devices.order(clientId, { kind: 'resume' }) === true;

    if (!presence.resume(clientId) && !isListening) {
      return context.json({ error: 'That tab is not open.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(adminJobDefinitionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    return context.json({ definitions: [...jobDefinitions] }, 200);
  });

  app.openapi(adminRunJobRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { kind } = context.req.valid('param');
    const { libraryId, force, parts } = context.req.valid('json');

    const definition = jobDefinitions.find((job) => job.kind === kind);

    if (
      definition?.destructive === true &&
      !(await requires(context.req.raw.headers, 'jobs.runDestructive'))
    ) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    if (definition !== undefined && !definition.needsLibrary) {
      const asked = await maintenance.run(kind);

      return asked.jobId === null
        ? context.json({ error: 'Nothing is running that under any id.' }, 404)
        : context.json({ jobId: asked.jobId, state: asked.state }, 202);
    }

    if (libraryId === undefined) {
      return context.json({ error: 'That job needs a library.' }, 404);
    }

    if (definition?.takesParts === true && parts === undefined) {
      return context.json({ error: 'Say which parts of the library to clear.' }, 400);
    }

    const libraryRunners: Record<string, () => Promise<{ jobId: string; state: string } | null>> = {
      [SCAN_LIBRARY_JOB]: () => library.scan(libraryId, force ?? false),
      [REGENERATE_PREVIEWS_JOB]: () => library.regeneratePreviews(libraryId),
      [REGENERATE_TRICKPLAY_JOB]: () => library.regenerateTrickplay(libraryId),
      [FETCH_LOGOS_JOB]: () => library.fetchLogos(libraryId),
      [DETECT_SEGMENTS_JOB]: () => library.detectSegments(libraryId),
      [RESET_LIBRARY_JOB]: () => library.reset(libraryId),
      [CLEAR_LIBRARY_PARTS_JOB]: () => library.clearParts(libraryId, parts ?? []),
    };

    const runner = libraryRunners[kind];

    if (runner === undefined) {
      return context.json({ error: 'No such job kind.' }, 404);
    }

    const queued = await runner();

    if (queued === null) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.json(queued, 202);
  });

  app.openapi(adminCancelJobRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { jobId } = context.req.valid('param');

    return (await cancelJob(jobId))
      ? context.json({ jobId }, 202)
      : context.json({ error: 'Nothing is running under that id.' }, 404);
  });

  app.openapi(adminQueueConcurrencyRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { concurrency } = context.req.valid('json');

    try {
      await controlQueue?.setConcurrency(concurrency);
    } catch {
      return context.json({ error: 'The media service could not be reached.' }, 502);
    }

    return context.json({ concurrency }, 200);
  });

  app.openapi(adminQueuePauseRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    try {
      await controlQueue?.pause();
    } catch {
      return context.json({ error: 'The media service could not be reached.' }, 502);
    }

    return context.json({ isPaused: true as const }, 200);
  });

  app.openapi(adminQueueResumeRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    try {
      await controlQueue?.resume();
    } catch {
      return context.json({ error: 'The media service could not be reached.' }, 502);
    }

    return context.json({ isPaused: false as const }, 200);
  });

  app.openapi(adminQueueRunNowRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { jobId } = context.req.valid('param');

    try {
      return (await controlQueue?.runNow(jobId)) === true
        ? context.json({ jobId }, 202)
        : context.json({ error: 'No such job is waiting.' }, 404);
    } catch {
      return context.json({ error: 'The media service could not be reached.' }, 502);
    }
  });

  app.openapi(adminJobHistoryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    if (jobHistory === undefined) {
      return context.json({ records: [], total: 0 }, 200);
    }

    const asked = context.req.valid('query');

    return context.json(
      await jobHistory.read({
        kind: asked.kind ?? null,
        status: asked.status ?? null,
        search: asked.search ?? '',
        sinceMs: asked.sinceMs ?? null,
        limit: asked.limit ?? 200,
      }),
      200,
    );
  });

  app.openapi(adminJobHistoryIssuesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.run'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    if (jobHistory === undefined) {
      return context.json([], 200);
    }

    const { jobRunId } = context.req.valid('param');

    return context.json(await jobHistory.readIssues(jobRunId), 200);
  });

  app.openapi(adminJobSchedulesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.schedule'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    return context.json(
      { schedules: await schedules.list(), timezone: await schedules.timezone() },
      200,
    );
  });

  app.openapi(adminAddJobTriggerRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.schedule'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { kind } = context.req.valid('param');
    const { trigger } = context.req.valid('json');
    const added = await schedules.add(kind, trigger);

    if (added === null) {
      return context.json({ error: 'No such job kind.' }, 404);
    }

    return context.json(added, 201);
  });

  app.openapi(adminRemoveJobTriggerRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'jobs.schedule'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { kind, triggerId } = context.req.valid('param');

    if (!(await schedules.remove(kind, triggerId))) {
      return context.json({ error: 'No such trigger.' }, 404);
    }

    return context.body(null, 204);
  });

  /**
   * Who is asking, and what they may do — resolved once for the role routes, which need both their
   * permissions and their rank.
   */
  const readActor = async (headers: Headers) => {
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return null;
    }

    const held = await permissions.rolesFor(session.user.id);

    return {
      id: session.user.id,
      permissions: await permissions.resolve(session.user.id),
      highestPosition: held.length === 0 ? null : Math.max(...held.map((role) => role.position)),
    };
  };

  /**
   * Whether an account is at or above the actor's own rank, and so not theirs to change.
   *
   * Rank alone, where banning and removing also refuse somebody acting on their own account.
   * Changing what you hold yourself is a legitimate thing to do, and what stops the last
   * administrator undoing themselves is whether the change would strand the server rather than
   * whose account it is.
   *
   * @param actor - Who is asking, and how senior they are.
   * @param targetId - Whose account is being changed.
   * @param targetRoles - The roles that account holds.
   * @returns Whether to refuse.
   */
  const outranks = (
    actor: NonNullable<Awaited<ReturnType<typeof readActor>>>,
    targetId: string,
    targetRoles: readonly { position: number }[],
    ownerId: string | null,
  ): boolean =>
    checkAccountAction({
      actorId: actor.id,
      ownerId,
      actorHighestPosition: actor.highestPosition,
      targetId,
      targetHighestPosition:
        targetRoles.length === 0 ? null : Math.max(...targetRoles.map((role) => role.position)),
    }) === 'outranked';

  /**
   * Whether taking something away would leave the server with nobody able to administer it.
   */
  const wouldStrandTheServer = async (apply: () => Promise<void>, undo: () => Promise<void>) => {
    const before = await permissions.countAdministrators();

    await apply();

    if (before === 0 || (await permissions.countAdministrators()) > 0) {
      return false;
    }

    await undo();

    return true;
  };

  app.openapi(listPermissionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.roles'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    return context.json(
      {
        permissions: PERMISSIONS.filter(
          (permission) => requests !== null || !permission.startsWith('requests.'),
        ),
      },
      200,
    );
  });

  app.openapi(listRolesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.roles'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    return context.json({ roles: await permissions.listRoles() }, 200);
  });

  app.openapi(createRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const body = context.req.valid('json');
    const refusal = checkRoleChange({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      actorPermissions: actor.permissions,
      targetPosition: body.position,
      granting: body.permissions,
    });

    if (refusal !== null) {
      return context.json({ error: describeRefusal(refusal) }, 403);
    }

    return context.json(await permissions.createRole({ ...body, color: body.color ?? null }), 201);
  });

  app.openapi(updateRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { id } = context.req.valid('param');
    const body = context.req.valid('json');
    const existing = (await permissions.listRoles()).find((role) => role.id === id);

    if (existing === undefined) {
      return context.json({ error: 'No such role.' }, 404);
    }

    const refusal = checkRoleChange({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      actorPermissions: actor.permissions,
      targetPosition: Math.max(existing.position, body.position ?? existing.position),
      granting: body.permissions ?? [],
    });

    if (refusal !== null) {
      return context.json({ error: describeRefusal(refusal) }, 403);
    }

    const before = existing.permissions;
    const patch = {
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.position === undefined ? {} : { position: body.position }),
      ...(body.permissions === undefined ? {} : { permissions: body.permissions }),
      ...(body.color === undefined ? {} : { color: body.color }),
    };

    const holding: { updated: Role | null } = { updated: null };

    const stranded = await wouldStrandTheServer(
      async () => {
        holding.updated = await permissions.updateRole(id, patch);
      },
      async () => {
        await permissions.updateRole(id, { permissions: before });
      },
    );

    if (stranded) {
      return context.json(
        { error: 'That would leave nobody able to administer this server.' },
        400,
      );
    }

    if (holding.updated === null) {
      return context.json({ error: 'No such role.' }, 404);
    }

    return context.json(holding.updated, 200);
  });

  app.openapi(deleteRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { id } = context.req.valid('param');
    const existing = (await permissions.listRoles()).find((role) => role.id === id);

    if (existing === undefined) {
      return context.json({ error: 'No such role.' }, 404);
    }

    const refusal = checkRoleChange({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      actorPermissions: actor.permissions,
      targetPosition: existing.position,
    });

    if (refusal !== null) {
      return context.json({ error: describeRefusal(refusal) }, 403);
    }

    if (existing.permissions.includes('administrator')) {
      return context.json(
        {
          error:
            'A role granting administrator cannot be deleted. Change what it grants, or move its holders first.',
        },
        400,
      );
    }

    await permissions.deleteRole(id);

    return context.body(null, 204);
  });

  app.openapi(listAccountRolesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.roles'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');

    return context.json(
      {
        roles: await permissions.rolesFor(userId),
        overrides: await permissions.overridesFor(userId),
        effective: [...(await permissions.resolve(userId))],
      },
      200,
    );
  });

  app.openapi(assignRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId, roleId } = context.req.valid('param');
    const role = (await permissions.listRoles()).find((candidate) => candidate.id === roleId);

    if (role === undefined) {
      return context.json({ error: 'No such role.' }, 404);
    }

    const refusal = checkRoleChange({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      actorPermissions: actor.permissions,
      targetPosition: role.position,
      granting: role.permissions,
    });

    if (refusal !== null) {
      return context.json({ error: describeRefusal(refusal) }, 403);
    }

    await permissions.assignRole(userId, roleId);
    await sayRoleChanged(userId, role.name, 'given');

    return context.body(null, 204);
  });

  app.openapi(removeRoleRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId, roleId } = context.req.valid('param');
    const role = (await permissions.listRoles()).find((candidate) => candidate.id === roleId);

    if (role !== undefined) {
      const refusal = checkRoleChange({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        actorPermissions: actor.permissions,
        targetPosition: role.position,
      });

      if (refusal !== null) {
        return context.json({ error: describeRefusal(refusal) }, 403);
      }
    }

    const stranded = await wouldStrandTheServer(
      async () => {
        await permissions.removeRole(userId, roleId);
      },
      async () => {
        await permissions.assignRole(userId, roleId);
      },
    );

    if (stranded) {
      return context.json(
        { error: 'That would leave nobody able to administer this server.' },
        400,
      );
    }

    await sayRoleChanged(userId, role?.name ?? 'a role', 'taken');

    return context.body(null, 204);
  });

  /**
   * Whether this actor may decide what another account sees.
   *
   * The same two questions the rest of the accounts panel asks: holding the permission, and not
   * acting on somebody at or above your own rank. Without the second, a manager could quietly take
   * the library away from an administrator.
   *
   * @param headers - The request's headers.
   * @param userId - Whose access is being changed.
   * @returns Why they may not, or nothing where they may.
   */
  const mayDecideAccess = async (headers: Headers, userId: string): Promise<string | null> => {
    const actor = await readActor(headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return 'That is for administrators.';
    }

    if (outranks(actor, userId, await permissions.rolesFor(userId), await theOwner())) {
      return describeAccountRefusal('outranked');
    }

    return null;
  };

  app.openapi(readLibraryAccessRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    const [shelves, refused, ceilings] = await Promise.all([
      library.list(asTheServer),
      library.refusedLibraries(userId),
      library.ceilingsFor(userId),
    ]);

    return context.json(
      {
        libraries: shelves.map((shelf) => {
          const ceiling = ceilings.find((one) => one.libraryId === shelf.id);

          return {
            id: shelf.id,
            name: shelf.name,
            mayView: !refused.includes(shelf.id),
            maximumAge: ceiling?.maximumAge ?? null,
            allowsUnrated: ceiling?.allowsUnrated ?? false,
          };
        }),
      },
      200,
    );
  });

  app.openapi(allowLibraryRoute, async (context) => {
    const { userId, libraryId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    if ((await library.list(asTheServer)).every((shelf) => shelf.id !== libraryId)) {
      return context.json({ error: 'No such library.' }, 404);
    }

    await library.allowLibrary(userId, libraryId);

    return context.body(null, 204);
  });

  app.openapi(refuseLibraryRoute, async (context) => {
    const { userId, libraryId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    if ((await library.list(asTheServer)).every((shelf) => shelf.id !== libraryId)) {
      return context.json({ error: 'No such library.' }, 404);
    }

    await library.refuseLibrary(userId, libraryId);

    return context.body(null, 204);
  });

  app.openapi(setCeilingRoute, async (context) => {
    const { userId, libraryId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    if ((await library.list(asTheServer)).every((shelf) => shelf.id !== libraryId)) {
      return context.json({ error: 'No such library.' }, 404);
    }

    const { maximumAge, allowsUnrated } = context.req.valid('json');

    await library.setCeiling(userId, { libraryId, maximumAge, allowsUnrated });

    return context.body(null, 204);
  });

  app.openapi(clearCeilingRoute, async (context) => {
    const { userId, libraryId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    await library.clearCeiling(userId, libraryId);

    return context.body(null, 204);
  });

  app.openapi(readExceptionsRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    return context.json({ exceptions: await library.exceptionsFor(userId) }, 200);
  });

  app.openapi(readExceptionsOnRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { kind, subjectId } = context.req.valid('param');

    return context.json({ accounts: await library.exceptionsOn({ kind, subjectId }) }, 200);
  });

  app.openapi(setExceptionRoute, async (context) => {
    const { userId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    const { kind, subjectId, effect } = context.req.valid('json');
    const actor = await readAccount(context.req.raw.headers);

    if (!(await library.setException(userId, { kind, subjectId }, effect, actor?.id ?? null))) {
      return context.json({ error: 'No such thing to make an exception of.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(clearExceptionRoute, async (context) => {
    const { userId, kind, subjectId } = context.req.valid('param');
    const refusal = await mayDecideAccess(context.req.raw.headers, userId);

    if (refusal !== null) {
      return context.json({ error: refusal }, 403);
    }

    await library.clearException(userId, { kind, subjectId });

    return context.body(null, 204);
  });

  app.openapi(setOverrideRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');
    const grant = context.req.valid('json');

    if (outranks(actor, userId, await permissions.rolesFor(userId), await theOwner())) {
      return context.json({ error: describeAccountRefusal('outranked') }, 403);
    }

    if (grant.effect === 'allow' && !actor.permissions.has(grant.permission)) {
      return context.json({ error: describeRefusal('escalation') }, 403);
    }

    const previous = (await permissions.overridesFor(userId)).find(
      (existing) => existing.permission === grant.permission,
    );

    const stranded = await wouldStrandTheServer(
      async () => {
        await permissions.setOverride(userId, grant);
      },
      async () => {
        if (previous === undefined) {
          await permissions.clearOverride(userId, grant.permission);

          return;
        }

        await permissions.setOverride(userId, previous);
      },
    );

    if (stranded) {
      return context.json(
        { error: 'That would leave nobody able to administer this server.' },
        400,
      );
    }

    return context.body(null, 204);
  });

  app.openapi(clearOverrideRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.roles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId, permission } = context.req.valid('param');
    const target = await permissions.rolesFor(userId);

    if (outranks(actor, userId, target, await theOwner())) {
      return context.json({ error: describeAccountRefusal('outranked') }, 403);
    }

    const previous = (await permissions.overridesFor(userId)).find(
      (existing) => existing.permission === permission,
    );

    if (previous?.effect === 'deny' && !actor.permissions.has(permission)) {
      return context.json({ error: describeRefusal('escalation') }, 403);
    }

    const stranded = await wouldStrandTheServer(
      async () => {
        await permissions.clearOverride(userId, permission);
      },
      async () => {
        if (previous !== undefined) {
          await permissions.setOverride(userId, previous);
        }
      },
    );

    if (stranded) {
      return context.json(
        { error: 'That would leave nobody able to administer this server.' },
        400,
      );
    }

    return context.body(null, 204);
  });

  app.openapi(listAccountsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.manage'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const listed = (await listUsers?.()) ?? [];

    const accounts = await Promise.all(
      listed.map(async (account) => {
        const held = await permissions.rolesFor(account.id);
        const resolved = await permissions.resolve(account.id);

        return {
          id: account.id,
          name: account.name,
          email: account.email,
          createdAt: account.createdAt,
          isBanned: (await isAccountBanned?.(account.id)) ?? false,
          banReason: (await readBanReason?.(account.id)) ?? null,
          position: held.length === 0 ? null : Math.max(...held.map((role) => role.position)),
          isAdministrator: resolved.has('administrator'),
          face: (await households?.read(account.id, account.name)) ?? null,
          profile: ((await profiles?.list(account.id)) ?? [])[0] ?? null,
          roles: held.map((role) => role.name),
        };
      }),
    );

    return context.json({ accounts }, 200);
  });

  app.openapi(banAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.ban')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');
    const { reason } = context.req.valid('json');
    const target = await permissions.rolesFor(userId);

    const refusal = checkAccountAction({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      targetId: userId,
      targetHighestPosition:
        target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
    });

    if (refusal !== null) {
      return context.json({ error: describeAccountRefusal(refusal) }, 403);
    }

    if ((await permissions.resolve(userId)).has('administrator')) {
      const administrators = await permissions.countAdministrators();

      if (administrators <= 1) {
        return context.json(
          { error: 'That would leave nobody able to administer this server.' },
          400,
        );
      }
    }

    if (!(await banAccount?.(userId, reason))) {
      return context.json({ error: 'No such account.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(unbanAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.ban')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');
    const target = await permissions.rolesFor(userId);

    const refusal = checkAccountAction({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      targetId: userId,
      targetHighestPosition:
        target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
    });

    if (refusal !== null) {
      return context.json({ error: describeAccountRefusal(refusal) }, 403);
    }

    if (!(await unbanAccount?.(userId))) {
      return context.json({ error: 'No such account.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(removeAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');
    const target = await permissions.rolesFor(userId);

    const refusal = checkAccountAction({
      actorId: actor.id,
      ownerId: await theOwner(),
      actorHighestPosition: actor.highestPosition,
      targetId: userId,
      targetHighestPosition:
        target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
    });

    if (refusal !== null) {
      return context.json({ error: describeAccountRefusal(refusal) }, 403);
    }

    if ((await permissions.resolve(userId)).has('administrator')) {
      const administrators = await permissions.countAdministrators();

      if (administrators <= 1) {
        return context.json(
          { error: 'That would leave nobody able to administer this server.' },
          400,
        );
      }
    }

    if (!(await removeAccount?.(userId))) {
      return context.json({ error: 'No such account.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(inviteAccountRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.invite'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const invited = await inviteAccount?.(context.req.valid('json'));

    if (invited === undefined || invited === null) {
      return context.json({ error: 'That address is already in use.' }, 400);
    }

    return context.json(
      {
        id: invited.id,
        name: invited.name,
        email: invited.email,
        createdAt: invited.createdAt,
        isBanned: false,
        banReason: null,
        position: null,
        isAdministrator: false,
        face: null,
        roles: [],
      },
      201,
    );
  });

  app.openapi(editAccountRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.manage')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    const body = context.req.valid('json');
    const changed = await editAccount?.(userId, {
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.email === undefined ? {} : { email: body.email }),
    });

    if (changed === undefined || changed === 'missing') {
      return context.json({ error: 'No such account.' }, 404);
    }

    if (changed === 'taken') {
      return context.json({ error: 'That address is already in use.' }, 400);
    }

    return context.body(null, 204);
  });

  app.openapi(resetAccountPasswordRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.security')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    const { password } = context.req.valid('json');
    const changed = await resetAccountPassword?.(userId, password);

    if (changed === undefined || !changed) {
      return context.json({ error: 'No such account.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(listAccountSessionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.security'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');
    const held = (await listAccountSessions?.(userId)) ?? [];

    return context.json(
      {
        sessions: held.map((one) => ({
          id: one.id,
          name: describeDevice(one.userAgent),
          address: one.ipAddress,
          signedInAt: one.createdAt,
          expiresAt: one.expiresAt,
        })),
      },
      200,
    );
  });

  app.openapi(endAccountSessionsRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.security')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    await endAccountSessions?.(userId);

    return context.body(null, 204);
  });

  app.openapi(endAccountSessionRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.security')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId, sessionId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    await endAccountSession?.(userId, sessionId);

    return context.body(null, 204);
  });

  app.openapi(setAccountAvatarRoute, async (context) => {
    const actor = await readActor(context.req.raw.headers);

    if (actor === null || !actor.permissions.has('account.profiles')) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const { userId } = context.req.valid('param');

    if (actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    const body = context.req.valid('json');
    const changed = await setAccountAvatar?.(userId, {
      ...(body.avatar === undefined ? {} : { avatar: body.avatar }),
      ...(body.colour === undefined ? {} : { colour: body.colour }),
    });

    if (changed === undefined || !changed) {
      return context.json({ error: 'No such account.' }, 404);
    }

    await announceProfiles(userId);

    return context.body(null, 204);
  });

  app.put('/api/admin/accounts/:userId/photo', tooBigToRead(), async (context) => {
    if (!(await requires(context.req.raw.headers, 'account.profiles'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const actor = await readActor(context.req.raw.headers);
    const userId = context.req.param('userId');

    if (actor !== null && actor.id !== userId) {
      const target = await permissions.rolesFor(userId);

      const refusal = checkAccountAction({
        actorId: actor.id,
        ownerId: await theOwner(),
        actorHighestPosition: actor.highestPosition,
        targetId: userId,
        targetHighestPosition:
          target.length === 0 ? null : Math.max(...target.map((role) => role.position)),
      });

      if (refusal !== null) {
        return context.json({ error: describeAccountRefusal(refusal) }, 403);
      }
    }

    const wrong = await setAccountPhoto?.(userId, {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== undefined && wrong !== null) {
      const said = describePictureFault(wrong);

      return context.json({ error: said.error }, said.status);
    }

    await announceProfiles(userId);

    return context.body(null, 204);
  });

  app.openapi(requestsAvailabilityRoute, async (context) => {
    if ((await readSessionOnce(auth, context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ isEnabled: requests !== null }, 200);
  });

  /**
   * What requesting is doing just now, read afresh alongside the overview the monitor keeps: what
   * waits on somebody, what is being fetched and how fast, and which download clients answer.
   *
   * @returns The overview, with the work in it.
   */
  const requestsOverview = async (): Promise<RequestsOverview | null> => {
    const latest = requests?.overview();

    if (latest === undefined) {
      return null;
    }

    if (requestsClient === null || !latest.isReachable) {
      return latest;
    }

    const [listed, queued] = await Promise.all([
      requestsClient.listRequests(),
      requestsClient.downloads(),
    ]);

    return {
      ...latest,
      work: workOf(
        listed.kind === 'answered' ? listed.value : [],
        queued.kind === 'answered' ? queued.value : null,
        new Date().toISOString().slice(0, DATE_LENGTH),
      ),
    };
  };

  app.openapi(adminRequestsOverviewRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'requests.manage'))) {
      return context.json({ error: 'That is for whoever sets up requesting.' }, 403);
    }

    const overview = await requestsOverview();

    return overview === null
      ? context.json({ error: 'Requesting is off.' }, 404)
      : context.json(overview, 200);
  });

  app.openapi(adminCheckRequestsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'requests.manage'))) {
      return context.json({ error: 'That is for whoever sets up requesting.' }, 403);
    }

    if (requests === null) {
      return context.json({ error: 'Requesting is off.' }, 404);
    }

    await requests.check();

    const overview = await requestsOverview();

    return overview === null
      ? context.json({ error: 'Requesting is off.' }, 404)
      : context.json(overview, 200);
  });

  const NOT_YOURS = { error: 'That is for whoever sets up requesting.' };

  const DATE_LENGTH = 10;

  /**
   * Asks the requests service again how it is, after an indexer changed, so that a warning about
   * one that was removed, turned back on or mended goes at once rather than at the next check.
   */
  const recheckRequests = async (): Promise<void> => {
    await requests?.check();
  };

  const REQUESTING_OFF = { error: 'Requesting is off.' };

  /**
   * Whether somebody may reach through to the requests service, and the client to do it with.
   *
   * @param headers - Who is asking.
   * @returns The client, or why not.
   */
  const reachRequests = async (
    headers: Headers,
    allowed: readonly Permission[] = ['requests.manage'],
  ): Promise<RequestsClient | 'refused' | 'off'> => {
    for (const permission of allowed) {
      if (await requires(headers, permission)) {
        return requestsClient ?? 'off';
      }
    }

    return 'refused';
  };

  /**
   * Asks the requests service something on somebody's behalf, and says in one shape what came of
   * it: the answer, or the refusal and the status that fits it — not theirs to ask, requesting off,
   * the service refusing the question, or the service not heard at all.
   *
   * @param headers - Who is asking.
   * @param ask - What to ask the service.
   * @param allowed - The permissions, any one of which lets them ask.
   * @returns The answer, or why not.
   */
  const throughRequests = async <Value>(
    headers: Headers,
    ask: (client: RequestsClient) => Promise<RequestsAnswer<Value>>,
    allowed: readonly Permission[] = ['requests.manage'],
  ): Promise<
    | { kind: 'answered'; value: Value }
    | { kind: 'refused'; status: 400 | 403 | 404 | 502; error: string }
  > => {
    const client = await reachRequests(headers, allowed);

    if (client === 'refused') {
      return { kind: 'refused', status: 403, ...NOT_YOURS };
    }

    if (client === 'off') {
      return { kind: 'refused', status: 404, ...REQUESTING_OFF };
    }

    const answer = await ask(client);

    if (answer.kind === 'silent') {
      return { kind: 'refused', status: 502, error: answer.reason };
    }

    return answer.kind === 'refused'
      ? { kind: 'refused', status: answer.status, error: answer.error }
      : answer;
  };

  const APPROVERS: readonly Permission[] = ['requests.approve', 'requests.manage'];

  const ASKERS: readonly Permission[] = ['requests.ask', 'requests.askMusic'];

  const SEES_EVERY_REQUEST: readonly Permission[] = [
    'requests.viewAll',
    'requests.approve',
    'requests.manage',
  ];

  /**
   * Says a request's news to anything subscribed, where anything could be.
   *
   * @param payload - What happened.
   */
  const sayOfRequest = (payload: WebhookOccurrence): void => {
    void events?.publish(payload);
  };

  app.openapi(listMediaRequestsRoute, async (context) => {
    const { headers } = context.req.raw;
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(headers, (client) => client.listRequests(), [
      ...ASKERS,
      ...SEES_EVERY_REQUEST,
    ]);

    if (answer.kind !== 'answered') {
      return context.json({ error: answer.error }, answer.status);
    }

    const seesAll = (
      await Promise.all(SEES_EVERY_REQUEST.map((permission) => requires(headers, permission)))
    ).some(Boolean);

    return context.json(
      seesAll
        ? answer.value
        : answer.value.filter((request) => request.requestedBy.id === session?.user.id),
      200,
    );
  });

  type Drafted =
    { kind: 'drafted'; draft: MediaRequestDraft } | { kind: 'refused'; status: 400; error: string };

  const catalogueFor = (asked: Parameters<typeof catalogueForRequest>[1]) =>
    catalogueForRequest({ describeForRequest, describeMusicForRequest }, asked);

  /**
   * What the requests service is told of something asked for: the catalogue's facts, the library
   * it will be filed into — of films, series or music, as it is — who asked and whether that makes
   * it approved.
   *
   * @param headers - Who is asking.
   * @param asked - What they asked for.
   * @returns The request to make, or why it cannot be.
   */
  /**
   * The release types a music request watches when nobody said, which whoever set the server up
   * chose.
   *
   * @returns The types.
   */
  const defaultReleaseTypes = async (): Promise<ReleaseType[]> =>
    (await settings.read()).requestReleaseTypes;

  const draftFor = async (headers: Headers, asked: MediaRequestAsk): Promise<Drafted> => {
    const session = await readSessionOnce(auth, headers);
    const catalogue = await catalogueFor(asked);
    const libraryKind = libraryKindOf(asked.kind);
    const libraries = (await library.list(asTheServer)).filter(
      (entry) => entry.kind === libraryKind && entry.takesRequests,
    );
    const chosen =
      asked.libraryId === undefined
        ? libraries[0]
        : libraries.find((entry) => entry.id === asked.libraryId);

    if (catalogue === null) {
      return {
        kind: 'refused',
        status: 400,
        error: 'The catalogue does not know that, or cannot be asked just now.',
      };
    }

    if (chosen === undefined || session === null) {
      return {
        kind: 'refused',
        status: 400,
        error: `There is no library of ${LIBRARY_KIND_WORDS[libraryKind]} to put it in.`,
      };
    }

    return {
      kind: 'drafted',
      draft: {
        kind: asked.kind,
        tmdbId: asked.tmdbId ?? null,
        musicBrainzId: asked.musicBrainzId ?? null,
        seasons: asked.seasons,
        releaseTypes:
          asked.releaseTypes ?? (isMusicRequest(asked.kind) ? await defaultReleaseTypes() : null),
        profileId: asked.profileId ?? chosen.requestProfileId,
        isPickedByHand: asked.isPickedByHand,
        libraryId: chosen.id,
        libraryPath: chosen.requestPath ?? chosen.path,
        requestedBy: { id: session.user.id, name: session.user.name },
        isApproved: await requires(headers, 'requests.autoApprove'),
        catalogue,
      },
    };
  };

  app.openapi(askForMediaRoute, async (context) => {
    const { headers } = context.req.raw;
    const asked = context.req.valid('json');
    const isByHand = asked.isPickedByHand || asked.release !== undefined;

    if (isByHand && !(await requires(headers, 'requests.manage'))) {
      return context.json({ error: 'Picking a release is for whoever manages requesting.' }, 403);
    }

    const drafted = await draftFor(headers, asked);
    const answer = await throughRequests(
      headers,
      (client) =>
        drafted.kind === 'refused' ? Promise.resolve(drafted) : client.addRequest(drafted.draft),
      [isMusicRequest(asked.kind) ? 'requests.askMusic' : 'requests.ask'],
    );

    if (answer.kind !== 'answered') {
      return context.json({ error: answer.error }, answer.status);
    }

    const { request, isNew } = answer.value;
    const isApproved = drafted.kind === 'drafted' && drafted.draft.isApproved;

    if (isNew) {
      sayOfRequest({
        event: 'requests.made',
        data: { title: request.title, kind: request.kind, requestedBy: request.requestedBy.name },
      });
    }

    if (isApproved && (isNew || request.approval === 'approved')) {
      sayOfRequest({
        event: 'requests.approved',
        data: { title: request.title, approvedBy: null },
      });
    }

    if (asked.release === undefined || requestsClient === null) {
      return context.json(request, isNew ? 201 : 200);
    }

    const picked = await requestsClient.pickRelease(request.id, asked.release);

    if (picked.kind !== 'answered') {
      return context.json(
        {
          error: `It was asked for, but that release could not be fetched: ${picked.kind === 'silent' ? picked.reason : picked.error}`,
        },
        400,
      );
    }

    return context.json(picked.value, isNew ? 201 : 200);
  });

  app.openapi(draftReleasesRoute, async (context) => {
    const { headers } = context.req.raw;
    const drafted = await draftFor(headers, context.req.valid('json'));
    const answer = await throughRequests(headers, (client) =>
      drafted.kind === 'refused'
        ? Promise.resolve(drafted)
        : client.releasesForDraft(drafted.draft),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(seriesSeasonsRoute, async (context) => {
    const { headers } = context.req.raw;
    const may = (
      await Promise.all(
        ['requests.ask' as const, ...APPROVERS].map((permission) => requires(headers, permission)),
      )
    ).some(Boolean);

    if (!may) {
      return context.json(NOT_YOURS, 403);
    }

    const catalogue = await describeForRequest(context.req.valid('param').tmdbId, 'series');

    return catalogue === null
      ? context.json({ error: 'The catalogue does not know that series, or cannot be asked.' }, 404)
      : context.json(seasonsOf(catalogue.episodes), 200);
  });

  app.openapi(musicCatalogueRoute, async (context) => {
    const { headers } = context.req.raw;
    const may = (
      await Promise.all(
        ['requests.askMusic' as const, ...APPROVERS].map((permission) =>
          requires(headers, permission),
        ),
      )
    ).some(Boolean);

    if (!may) {
      return context.json(NOT_YOURS, 403);
    }

    const { query, kind } = context.req.valid('query');

    return context.json(await searchMusicCatalogue(query, kind), 200);
  });

  /**
   * What somebody may ask for: films and series, music, both or neither.
   *
   * @param headers - Who is asking.
   * @returns Whether they may ask for each.
   */
  const whatMayBeAsked = async (headers: Headers) => {
    const [video, music] = await Promise.all([
      requires(headers, 'requests.ask'),
      requires(headers, 'requests.askMusic'),
    ]);

    return { video, music };
  };

  /**
   * Every request anybody has made, for saying what has been asked for already — or none where the
   * requests service cannot say.
   *
   * @returns The requests.
   */
  const everyRequest = async () => {
    const answer = await requestsClient?.listRequests();

    return answer?.kind === 'answered' ? answer.value : [];
  };

  app.openapi(discoverRoute, async (context) => {
    if (requestsClient === null) {
      return context.json(REQUESTING_OFF, 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!may.video && !may.music) {
      return context.json(NOT_YOURS, 403);
    }

    const [discovered, requested] = await Promise.all([
      discoverShelves(discovery, may),
      everyRequest(),
    ]);

    return context.json(
      {
        shelves: await Promise.all(
          discovered.shelves.map(async (shelf) => ({
            ...shelf,
            titles: await standTitles(shelf.titles, discovery.lookup, requested),
          })),
        ),
        studios: discovered.studios,
      },
      200,
    );
  });

  app.openapi(catalogueBrowseRoute, async (context) => {
    const { kind, list, studio, page, genre, yearFrom, yearTo, minRating } =
      context.req.valid('query');

    if (requestsClient === null) {
      return context.json(REQUESTING_OFF, 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!may.video) {
      return context.json(NOT_YOURS, 403);
    }

    const browsed = await discovery.browse({
      list,
      kind: kind === 'film' ? 'movie' : 'tv',
      page,
      studio: studio ?? null,
      filters: {
        ...(genre === undefined ? {} : { genre }),
        ...(yearFrom === undefined ? {} : { yearFrom }),
        ...(yearTo === undefined ? {} : { yearTo }),
        ...(minRating === undefined ? {} : { minRating }),
      },
    });

    const titles = browsed.matches.map((match) => ({
      kind,
      id: match.externalId,
      title: match.title,
      subtitle: null,
      year: match.year,
      overview: match.overview,
      posterUrl: match.posterUrl,
    }));

    return context.json(
      {
        titles: await standTitles(titles, discovery.lookup, await everyRequest()),
        page,
        hasMore: browsed.hasMore,
      },
      200,
    );
  });

  app.openapi(catalogueGenresRoute, async (context) => {
    if (requestsClient === null) {
      return context.json(REQUESTING_OFF, 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!may.video) {
      return context.json(NOT_YOURS, 403);
    }

    return context.json(
      await discovery.genres(context.req.valid('query').kind === 'film' ? 'movie' : 'tv'),
      200,
    );
  });

  app.openapi(catalogueSearchRoute, async (context) => {
    const { query, kind } = context.req.valid('query');

    if (requestsClient === null) {
      return context.json(REQUESTING_OFF, 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!(isMusicRequest(kind) ? may.music : may.video)) {
      return context.json(NOT_YOURS, 403);
    }

    const found: UnstoodTitle[] = isMusicRequest(kind)
      ? (await searchMusicCatalogue(query, kind)).map((hit) => ({
          kind: hit.kind,
          id: hit.musicBrainzId,
          title: hit.title,
          subtitle: hit.artist ?? hit.disambiguation,
          year: hit.year,
          overview: null,
          posterUrl: hit.coverUrl,
        }))
      : (await searchCatalogue(query, kind === 'film' ? 'movie' : 'tv')).map((match) => ({
          kind,
          id: match.externalId,
          title: match.title,
          subtitle: null,
          year: match.year,
          overview: match.overview,
          posterUrl: match.posterUrl,
        }));

    return context.json(await standTitles(found, discovery.lookup, await everyRequest()), 200);
  });

  app.openapi(catalogueTitleRoute, async (context) => {
    const { kind, id } = context.req.valid('param');

    if (requestsClient === null) {
      return context.json(REQUESTING_OFF, 404);
    }

    const may = await whatMayBeAsked(context.req.raw.headers);

    if (!(isMusicRequest(kind) ? may.music : may.video)) {
      return context.json(NOT_YOURS, 403);
    }

    const described = await describeCatalogueTitle(discovery, kind, id);

    if (described === null) {
      return context.json(
        { error: 'The catalogue does not know that, or cannot be asked just now.' },
        404,
      );
    }

    const [stood] = await standTitles([described], discovery.lookup, await everyRequest());

    return context.json({ ...described, standing: stood?.standing ?? NOT_STOOD }, 200);
  });

  app.openapi(requestProgressRoute, async (context) => {
    const { headers } = context.req.raw;
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(
      headers,
      async (client) => {
        const listed = await client.listRequests();

        if (listed.kind !== 'answered') {
          return listed;
        }

        const queue = await client.downloads();

        return {
          kind: 'answered' as const,
          value: progressOf(
            listed.value.filter((request) => request.requestedBy.id === session?.user.id),
            queue.kind === 'answered' ? queue.value.downloads : [],
          ),
        };
      },
      [...ASKERS, ...SEES_EVERY_REQUEST],
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(searchMissingRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.searchMissing(),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(changeMediaRequestRoute, async (context) => {
    const { id } = context.req.valid('param');
    const change = context.req.valid('json');
    const answer = await throughRequests(
      context.req.raw.headers,
      async (client) => {
        if (change.seasons === undefined && change.releaseTypes === undefined) {
          return client.changeRequest(id, { change });
        }

        const found = await client.findRequest(id);

        if (found.kind !== 'answered') {
          return found;
        }

        return client.changeRequest(id, { change, catalogue: await catalogueFor(found.value) });
      },
      APPROVERS,
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(removeMediaRequestRoute, async (context) => {
    const { headers } = context.req.raw;
    const { id } = context.req.valid('param');
    const isDeletingDownloads = context.req.valid('query').deleteDownloads === 'true';
    const isManager = await requires(headers, 'requests.manage');
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(
      headers,
      async (client) => {
        if (isManager) {
          return client.removeRequest(id, isDeletingDownloads);
        }

        const found = await client.findRequest(id);

        if (found.kind !== 'answered') {
          return found;
        }

        if (found.value.requestedBy.id !== session?.user.id) {
          return { kind: 'refused', status: 404, error: 'There is no such request.' };
        }

        return found.value.state === 'filed' || found.value.state === 'available'
          ? {
              kind: 'refused',
              status: 400,
              error: 'It is in the library already, so there is nothing left to cancel.',
            }
          : client.removeRequest(id, true);
      },
      ['requests.manage', ...ASKERS],
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(approveMediaRequestRoute, async (context) => {
    const { headers } = context.req.raw;
    const session = await readSessionOnce(auth, headers);
    const answer = await throughRequests(
      headers,
      (client) => client.approveRequest(context.req.valid('param').id),
      APPROVERS,
    );

    if (answer.kind !== 'answered') {
      return context.json({ error: answer.error }, answer.status);
    }

    sayOfRequest({
      event: 'requests.approved',
      data: { title: answer.value.title, approvedBy: session?.user.name ?? null },
    });

    return context.json(answer.value, 200);
  });

  app.openapi(refuseMediaRequestRoute, async (context) => {
    const { reason } = context.req.valid('json');
    const answer = await throughRequests(
      context.req.raw.headers,
      (client) => client.refuseRequest(context.req.valid('param').id, reason),
      APPROVERS,
    );

    if (answer.kind !== 'answered') {
      return context.json({ error: answer.error }, answer.status);
    }

    sayOfRequest({
      event: 'requests.refused',
      data: { title: answer.value.title, reason: answer.value.refusedBecause },
    });

    return context.json(answer.value, 200);
  });

  app.openapi(retryMediaRequestRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.retryRequest(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(mediaRequestLogRoute, async (context) => {
    const answer = await throughRequests(
      context.req.raw.headers,
      (client) => client.requestLog(context.req.valid('param').id),
      APPROVERS,
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(mediaRequestBlocklistRoute, async (context) => {
    const answer = await throughRequests(
      context.req.raw.headers,
      (client) => client.requestBlocklist(context.req.valid('param').id),
      APPROVERS,
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(liftMediaBlockRoute, async (context) => {
    const { id, blockId } = context.req.valid('param');
    const answer = await throughRequests(
      context.req.raw.headers,
      (client) => client.liftBlock(id, blockId),
      APPROVERS,
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(decideMediaRequestsRoute, async (context) => {
    const { headers } = context.req.raw;
    const mayDecide = await Promise.all(
      APPROVERS.map((permission) => requires(headers, permission)),
    );

    if (!mayDecide.includes(true)) {
      return context.json(NOT_YOURS, 403);
    }

    if (requestsClient === null) {
      return context.json(REQUESTING_OFF, 404);
    }

    const { ids, decision, reason } = context.req.valid('json');
    const decided: MediaRequest[] = [];
    const refused: { id: string; problem: string }[] = [];

    for (const id of ids) {
      const answer = await throughRequests(
        context.req.raw.headers,
        (client) =>
          decision === 'approve' ? client.approveRequest(id) : client.refuseRequest(id, reason),
        APPROVERS,
      );

      if (answer.kind === 'answered') {
        decided.push(answer.value);
      } else {
        refused.push({ id, problem: answer.error });
      }
    }

    if (decided.length === 0 && refused.length > 0) {
      return context.json({ error: refused[0]?.problem ?? 'Nothing could be decided.' }, 502);
    }

    return context.json({ decided, refused }, 200);
  });

  app.openapi(mediaRequestReleasesRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.requestReleases(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(pickMediaReleaseRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.pickRelease(context.req.valid('param').id, context.req.valid('json').release),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(listQualityProfilesRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.listProfiles(),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(addQualityProfileRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.addProfile(context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 201)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(changeQualityProfileRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.changeProfile(context.req.valid('param').id, context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(removeQualityProfileRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.removeProfile(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(listDownloadClientsRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) => client.listClients());

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(addDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.addClient(context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 201)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(tryDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.tryClient(context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(changeDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.changeClient(context.req.valid('param').id, context.req.valid('json')),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(removeDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.removeClient(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(testDownloadClientRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.testClient(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(tryDownloadClientChangeRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.tryClient(context.req.valid('json'), context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(readDownloadQueueRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) => client.downloads());

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(sendReleaseRoute, async (context) => {
    const sending = context.req.valid('json');
    const fileable =
      sending.libraryKind === 'movies' || sending.libraryKind === 'shows'
        ? (await library.list(asTheServer)).filter((entry) => entry.kind === sending.libraryKind)
        : [];
    const into =
      sending.libraryId === undefined
        ? fileable[0]
        : fileable.find((entry) => entry.id === sending.libraryId);
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.sendRelease({
        ...sending,
        library: into === undefined ? null : { id: into.id, path: into.path },
      }),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 201)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(fileQueuedDownloadRoute, async (context) => {
    const { libraryId } = context.req.valid('json');
    const into = (await library.list(asTheServer)).find(
      (entry) => entry.id === libraryId && (entry.kind === 'movies' || entry.kind === 'shows'),
    );
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      into === undefined
        ? Promise.resolve({
            kind: 'refused' as const,
            status: 400 as const,
            error: 'That is not a library of films or series.',
          })
        : client.fileDownload(context.req.valid('param').id, { id: into.id, path: into.path }),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(pauseQueuedDownloadRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.pauseDownload(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(resumeQueuedDownloadRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.resumeDownload(context.req.valid('param').id),
    );

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(removeQueuedDownloadRoute, async (context) => {
    const answer = await throughRequests(context.req.raw.headers, (client) =>
      client.removeDownload(
        context.req.valid('param').id,
        context.req.valid('query').deleteData === 'true',
      ),
    );

    return answer.kind === 'answered'
      ? context.body(null, 204)
      : context.json({ error: answer.error }, answer.status);
  });

  app.openapi(listIndexersRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.listIndexers();

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.kind === 'silent' ? answer.reason : answer.error }, 502);
  });

  app.openapi(addIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.addIndexer(context.req.valid('json'));

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return context.json({ error: answer.error }, 400);
    }

    await recheckRequests();

    return context.json(answer.value, 201);
  });

  app.openapi(tryIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.tryIndexer(context.req.valid('json'));

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    return answer.kind === 'refused'
      ? context.json({ error: answer.error }, 400)
      : context.json(answer.value, 200);
  });

  app.openapi(changeIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.changeIndexer(
      context.req.valid('param').id,
      context.req.valid('json'),
    );

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return answer.status === 404
        ? context.json({ error: answer.error }, 404)
        : context.json({ error: answer.error }, 400);
    }

    await recheckRequests();

    return context.json(answer.value, 200);
  });

  app.openapi(removeIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.removeIndexer(context.req.valid('param').id);

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return context.json({ error: answer.error }, 404);
    }

    await recheckRequests();

    return context.body(null, 204);
  });

  app.openapi(testIndexerRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.testIndexer(context.req.valid('param').id);

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return context.json({ error: answer.error }, 404);
    }

    await recheckRequests();

    return context.json(answer.value, 200);
  });

  app.openapi(tryIndexerChangeRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.tryIndexer(
      context.req.valid('json'),
      context.req.valid('param').id,
    );

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    return answer.kind === 'refused'
      ? context.json({ error: answer.error }, 400)
      : context.json(answer.value, 200);
  });

  app.openapi(listDefinitionsRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.catalogue();

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.kind === 'silent' ? answer.reason : answer.error }, 502);
  });

  app.openapi(refreshDefinitionsRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.refreshCatalogue();

    return answer.kind === 'answered'
      ? context.json(answer.value, 200)
      : context.json({ error: answer.kind === 'silent' ? answer.reason : answer.error }, 502);
  });

  app.openapi(readDefinitionRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.definition(context.req.valid('param').id);

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    return answer.kind === 'refused'
      ? context.json({ error: answer.error }, 404)
      : context.json(answer.value, 200);
  });

  app.post('/api/admin/requests/indexers/:id/download', async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const asked = ReleaseDownloadRequestSchema.safeParse(
      await context.req.json().catch(() => null),
    );

    if (!asked.success) {
      return context.json({ error: 'Say which release to fetch.' }, 400);
    }

    const answer = await client.download(context.req.param('id'), asked.data.url);

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    if (answer.kind === 'refused') {
      return context.json({ error: answer.error }, answer.status);
    }

    if (answer.value.kind === 'magnet') {
      return context.json({ magnet: answer.value.url }, 200);
    }

    const isNzb = answer.value.contentType.includes('nzb');

    return context.body(answer.value.bytes.slice(), 200, {
      'content-type': answer.value.contentType,
      'content-disposition': `attachment; filename="release.${isNzb ? 'nzb' : 'torrent'}"`,
    });
  });

  app.openapi(searchReleasesRoute, async (context) => {
    const client = await reachRequests(context.req.raw.headers);

    if (client === 'refused') {
      return context.json(NOT_YOURS, 403);
    }

    if (client === 'off') {
      return context.json(REQUESTING_OFF, 404);
    }

    const answer = await client.search(context.req.valid('json'));

    if (answer.kind === 'silent') {
      return context.json({ error: answer.reason }, 502);
    }

    return answer.kind === 'refused'
      ? context.json({ error: answer.error }, 400)
      : context.json(answer.value, 200);
  });

  app.openapi(listMyPermissionsRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const resolved = await permissions.resolve(session.user.id);

    const held =
      headers.get('x-api-key') === null
        ? resolved
        : narrowToKey(resolved, await apiKeys.restrictionFor(headers, session.session.id));

    return context.json({ permissions: [...held], isAdministrator: held.has(ADMINISTRATOR) }, 200);
  });

  app.openapi(listDevicesRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const held = await auth.api.listSessions({ headers }).catch(() => []);

    return context.json(
      {
        devices: held.map((one) => ({
          id: one.id,
          name: describeDevice(one.userAgent),
          address: one.ipAddress ?? null,
          signedInAt: one.createdAt.toISOString(),
          expiresAt: one.expiresAt.toISOString(),
          isCurrent: one.token === session.session.token,
        })),
      },
      200,
    );
  });

  app.openapi(endDeviceRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const held = await auth.api.listSessions({ headers }).catch(() => []);
    const asked = held.find((one) => one.id === context.req.valid('param').id);

    if (asked !== undefined) {
      await auth.api
        .revokeSession({ headers, body: { token: asked.token } })
        .catch(() => undefined);
    }

    return context.body(null, 204);
  });

  app.openapi(endOtherDevicesRoute, async (context) => {
    const headers = context.req.raw.headers;
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await auth.api.revokeOtherSessions({ headers }).catch(() => undefined);

    return context.body(null, 204);
  });

  app.get('/api/admin/monitor', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.monitor'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    const reading = await monitor?.().catch(() => null);

    if (reading === null || reading === undefined) {
      return context.json({ error: 'The media service did not answer.' }, 503);
    }

    return new Response(JSON.stringify(reading), {
      headers: { 'content-type': 'application/json' },
    });
  });

  app.openapi(adminMonitorHistoryRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.monitor'))) {
      return context.json({ error: 'That is for administrators.' }, 403);
    }

    if (resourceHistory === undefined) {
      return context.json({ records: [] }, 200);
    }

    const { range } = context.req.valid('query');

    return context.json({ records: await resourceHistory.read(range ?? '24h') }, 200);
  });

  app.openapi(listProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ progress: await progress.list(profileId) }, 200);
  });

  app.openapi(recordProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { mediaId } = context.req.valid('param');

    const item = await library.getMedia(mediaId);

    if (item === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    if ((item.extraKind ?? null) !== null) {
      return context.body(null, 204);
    }

    const report = context.req.valid('json');

    const before = await progress.read(profileId, mediaId);
    const at = new Date();

    const secondsWatched =
      before === null
        ? 0
        : watchedBetween(
            {
              positionSeconds: before.positionSeconds,
              atMs: Date.parse(before.updatedAt),
              isPlaying: true,
            },
            { positionSeconds: report.positionSeconds, atMs: at.getTime(), isPlaying: true },
          );

    await progress.record(profileId, { mediaId, ...report });

    if (history !== undefined) {
      await history.record(profileId, mediaId, {
        at,
        secondsWatched,
        isFinished: report.isFinished,
      });
    }

    return context.body(null, 204);
  });

  app.openapi(forgetProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await progress.forget(profileId, context.req.valid('param').mediaId);

    return context.body(null, 204);
  });

  app.openapi(listHistoryRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    const viewer = await viewerOf(context.req.raw.headers);

    if (profileId === null || viewer === null || history === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { limit, offset } = context.req.valid('query');

    return context.json(
      {
        viewings: await history.list(viewer, profileId, {
          ...(limit === undefined ? {} : { limit }),
          ...(offset === undefined ? {} : { offset }),
        }),
      },
      200,
    );
  });

  app.openapi(forgetViewingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || history === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    if (!(await history.forget(profileId, context.req.valid('param').id))) {
      return context.json({ error: 'No such viewing for this profile.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(forgetHistoryRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || history === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ forgotten: await history.forgetAll(profileId) }, 200);
  });

  app.openapi(readPersonRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const found = await library.readPerson(context.req.valid('param').personId);

    if (found === null) {
      return context.json({ error: 'The catalogue knows nobody by that identifier.' }, 404);
    }

    return context.json(found, 200);
  });

  app.openapi(readPersonCreditsRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const held = await library.findByPerson(viewer, context.req.valid('param').personId);

    return context.json(splitPersonCredits(held), 200);
  });

  if (downloads !== undefined) {
    app.openapi(offerDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const offer = await downloads.offer(
        context.req.valid('param').mediaId,
        context.req.valid('json').deviceProfile,
      );

      return offer === null
        ? context.json({ error: 'No such media item.' }, 404)
        : context.json(offer, 200);
    });

    app.openapi(askForDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const { quality, audioLanguages } = context.req.valid('json');

      const asked = await downloads.ask(
        profileId,
        context.req.valid('param').mediaId,
        quality,
        audioLanguages ?? [],
      );

      return asked === null
        ? context.json({ error: 'No such media item.' }, 404)
        : context.json(asked, 200);
    });

    app.openapi(offerSeriesRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const offer = await downloads.offerSeries(
        context.req.valid('param').seriesId,
        context.req.valid('json').deviceProfile,
      );

      return offer === null
        ? context.json({ error: 'No such programme.' }, 404)
        : context.json(offer, 200);
    });

    app.openapi(askForSeriesRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const { quality, audioLanguages } = context.req.valid('json');

      const queued = await downloads.askForSeries(
        profileId,
        context.req.valid('param').seriesId,
        quality,
        audioLanguages ?? [],
      );

      return context.json({ downloads: queued }, 200);
    });

    app.openapi(pauseDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      await downloads.pause(profileId, context.req.valid('param').id);

      return context.body(null, 204);
    });

    app.openapi(resumeDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      await downloads.resume(profileId, context.req.valid('param').id);

      return context.body(null, 204);
    });

    app.openapi(listDownloadsRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      return context.json({ downloads: await downloads.refresh(profileId) }, 200);
    });

    app.openapi(forgetDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      await downloads.forget(profileId, context.req.valid('param').id);

      return context.body(null, 204);
    });

    app.openapi(listHoldingsRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      return context.json({ holdings: await downloads.held(profileId) }, 200);
    });

    app.openapi(holdDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const clientId = context.req.header('x-valence-client') ?? profileId;

      await downloads.hold(
        profileId,
        clientId,
        context.req.valid('param').mediaId,
        context.req.valid('json').quality,
      );

      return context.body(null, 204);
    });

    app.openapi(releaseDownloadRoute, async (context) => {
      const profileId = await readProfileId(context.req.raw.headers);

      if (profileId === null) {
        return context.json({ error: 'Nobody is signed in.' }, 401);
      }

      const { mediaId, quality } = context.req.valid('param');
      const clientId = context.req.header('x-valence-client') ?? profileId;

      await downloads.release(profileId, clientId, mediaId, quality);

      return context.body(null, 204);
    });
  }

  app.openapi(listFavouritesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(
      {
        favourites: await favourites.list(profileId),
        books: await favourites.listBooks(profileId),
      },
      200,
    );
  });

  app.openapi(listHiddenRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ hidden: await hiding.list(profileId) }, 200);
  });

  app.openapi(hideMediaRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { mediaId } = context.req.valid('param');

    if (!(await hiding.hide(profileId, { kind: 'item', subjectId: mediaId }))) {
      return context.json({ error: 'No such item.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(showMediaRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await hiding.show(profileId, { kind: 'item', subjectId: context.req.valid('param').mediaId });

    return context.body(null, 204);
  });

  app.openapi(hideSeriesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { seriesId } = context.req.valid('param');

    if (!(await hiding.hide(profileId, { kind: 'series', subjectId: seriesId }))) {
      return context.json({ error: 'No such programme.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(showSeriesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await hiding.show(profileId, {
      kind: 'series',
      subjectId: context.req.valid('param').seriesId,
    });

    return context.body(null, 204);
  });

  app.openapi(hideLibraryRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null || viewer.kind !== 'account' || viewer.profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { libraryId } = context.req.valid('param');

    const refused = await library.isLibraryOutOfReach(viewer.accountId, libraryId);

    if (refused && !viewer.isAdministrator) {
      return context.json({ error: 'No such library.' }, 404);
    }

    if (!(await hiding.hide(viewer.profileId, { kind: 'library', subjectId: libraryId }))) {
      return context.json({ error: 'No such library.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(showLibraryRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await hiding.show(profileId, {
      kind: 'library',
      subjectId: context.req.valid('param').libraryId,
    });

    return context.body(null, 204);
  });

  app.openapi(keepFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { mediaId } = context.req.valid('param');
    const isTrack =
      music !== undefined && (await music.library.listTracks(asTheServer, [mediaId])).length > 0;

    if (!isTrack && (await library.getMedia(mediaId)) === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    await favourites.keep(profileId, mediaId);

    return context.body(null, 204);
  });

  app.openapi(dropFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await favourites.drop(profileId, context.req.valid('param').mediaId);

    return context.body(null, 204);
  });

  app.openapi(keepBookFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { bookId } = context.req.valid('param');

    if (!(await bookInReach(context.req.raw.headers, bookId))) {
      return context.json({ error: 'No such book.' }, 404);
    }

    await favourites.keepBook(profileId, bookId);

    return context.body(null, 204);
  });

  app.openapi(dropBookFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await favourites.dropBook(profileId, context.req.valid('param').bookId);

    return context.body(null, 204);
  });

  app.openapi(createShareRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    if (!(await requires(context.req.raw.headers, 'sharing.link'))) {
      return context.json({ error: 'This account may not share.' }, 403);
    }

    const asked = context.req.valid('json');

    if (asked.kind === 'book') {
      const made =
        asked.bookId === undefined || !(await bookInReach(context.req.raw.headers, asked.bookId))
          ? null
          : await shares.create(account.id, asked);

      return made === null
        ? context.json({ error: 'There is nothing here to share.' }, 404)
        : context.json(made, 201);
    }

    const subjectId = asked.kind === 'item' ? asked.mediaId : asked.seriesId;

    const wanted: Subject =
      subjectId === undefined
        ? { kind: 'none' }
        : asked.kind === 'item'
          ? { kind: 'item', mediaId: subjectId }
          : { kind: 'series', seriesId: subjectId };

    if (await isOutOfReach(account.id, wanted)) {
      return context.json({ error: 'There is nothing here to share.' }, 404);
    }

    const made = await shares.create(account.id, asked);

    if (made === null) {
      return context.json({ error: 'There is nothing here to share.' }, 404);
    }

    return context.json(made, 201);
  });

  app.openapi(listSharesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ shares: await shares.list(account.id) }, 200);
  });

  app.openapi(listEverybodysSharesRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    if (!(await requires(context.req.raw.headers, 'sharing.manage'))) {
      return context.json({ error: 'This account may not look at everybody’s links.' }, 403);
    }

    return context.json({ shares: await shares.listEverybody() }, 200);
  });

  app.openapi(revokeAnybodysShareRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    if (!(await requires(context.req.raw.headers, 'sharing.manage'))) {
      return context.json({ error: 'This account may not withdraw somebody else’s link.' }, 403);
    }

    const withdrawn = await shares.revokeAnybody(context.req.valid('param').shareId);

    if (withdrawn === null) {
      return context.json({ error: 'No such link.' }, 404);
    }

    if (withdrawn.createdBy !== account.id) {
      await sayALinkWasWithdrawn?.({
        accountId: withdrawn.createdBy,
        title: withdrawn.title,
        byName: account.name,
      });
    }

    return context.body(null, 204);
  });

  app.openapi(revokeShareRoute, async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null || shares === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const withdrawn = await shares.revoke(account.id, context.req.valid('param').shareId);

    if (!withdrawn) {
      return context.json({ error: 'No such link.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(openShareRoute, async (context) => {
    if (shares === undefined) {
      return context.json({ error: 'This link does not work.' }, 404);
    }

    const { token } = context.req.valid('param');
    const found = await shares.resolve(token);

    if (found === null) {
      return context.json({ error: 'This link does not work.' }, 404);
    }

    const held = getCookie(context, SHARE_JOINER);
    const joiner = held ?? randomUUID();

    const standing = {
      expiresAt: found.expiresAt,
      viewCap: found.viewCap,
      views: found.views,
      revokedAt: found.revokedAt,
      isReturning: held !== undefined && (await shares.hasJoined(found.id, held)),
    };

    if (!isShareLive(standing, new Date())) {
      return context.json(
        {
          error: whyShareEnded(standing, new Date()) ?? 'This link no longer works.',
          ended: howShareEnded(standing, new Date()) ?? 'withdrawn',
        },
        410,
      );
    }

    await shares.join(found.id, joiner);

    const keptFor = rememberGuestFor(found.expiresAt, new Date(), GUEST_REMEMBERED_FOR_SECONDS);
    const kept = { path: '/', httpOnly: true, sameSite: 'Lax', maxAge: keptFor } as const;

    setCookie(context, SHARE_JOINER, joiner, kept);
    setCookie(context, SHARE_COOKIE, token, kept);

    if (found.kind === 'book') {
      const shared =
        books === undefined || found.bookId === null ? null : await books.read(found.bookId);

      return context.json(
        { kind: found.kind, title: found.title, items: [], book: shared?.book ?? null },
        200,
      );
    }

    const items = await library.itemsForShare({
      kind: found.kind === 'series' ? 'series' : 'item',
      mediaId: found.mediaId,
      seriesId: found.seriesId,
    });

    return context.json({ kind: found.kind, title: found.title, items, book: null }, 200);
  });

  app.openapi(listRatingsRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json({ ratings: await ratings.list(profileId) }, 200);
  });

  app.openapi(rateMediaRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { mediaId } = context.req.valid('param');

    if ((await library.getMedia(mediaId)) === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    await ratings.set(profileId, { mediaId }, context.req.valid('json').stars);

    return context.body(null, 204);
  });

  app.openapi(clearMediaRatingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await ratings.clear(profileId, { mediaId: context.req.valid('param').mediaId });

    return context.body(null, 204);
  });

  app.openapi(readMediaHouseholdRatingRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { mediaId } = context.req.valid('param');

    if ((await library.getMedia(mediaId)) === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    return context.json(await ratings.household({ mediaId }), 200);
  });

  app.openapi(rateSeriesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { seriesId } = context.req.valid('param');

    if ((await library.getSeries(seriesId)) === null) {
      return context.json({ error: 'No such programme.' }, 404);
    }

    await ratings.set(profileId, { seriesId }, context.req.valid('json').stars);

    return context.body(null, 204);
  });

  app.openapi(clearSeriesRatingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await ratings.clear(profileId, { seriesId: context.req.valid('param').seriesId });

    return context.body(null, 204);
  });

  app.openapi(readSeriesHouseholdRatingRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { seriesId } = context.req.valid('param');

    if ((await library.getSeries(seriesId)) === null) {
      return context.json({ error: 'No such programme.' }, 404);
    }

    return context.json(await ratings.household({ seriesId }), 200);
  });

  app.openapi(rateBookRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { bookId } = context.req.valid('param');

    if (!(await bookInReach(context.req.raw.headers, bookId))) {
      return context.json({ error: 'No such book.' }, 404);
    }

    await ratings.set(profileId, { bookId }, context.req.valid('json').stars);

    return context.body(null, 204);
  });

  app.openapi(clearBookRatingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await ratings.clear(profileId, { bookId: context.req.valid('param').bookId });

    return context.body(null, 204);
  });

  app.openapi(readBookHouseholdRatingRoute, async (context) => {
    if ((await readProfileId(context.req.raw.headers)) === null) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { bookId } = context.req.valid('param');

    if (!(await bookInReach(context.req.raw.headers, bookId))) {
      return context.json({ error: 'No such book.' }, 404);
    }

    return context.json(await ratings.household({ bookId }), 200);
  });

  app.openapi(listSegmentsRoute, async (context) => {
    const { mediaId } = context.req.valid('param');

    if ((await library.getMedia(mediaId)) === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    return context.json({ segments: await segments.list(mediaId) }, 200);
  });

  if (music !== undefined) {
    registerMusicRoutes(app, { viewerOf, music, requires });
  }

  if (reencodes !== undefined) {
    registerReencodeRoutes(app, {
      reencodes,
      requires,
      accountOf: async (headers) => (await readAccount(headers))?.id ?? null,
      ...(onReencodeQueued === undefined ? {} : { onQueued: onReencodeQueued }),
    });
  }

  app.openapi(findBooksRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { search, ids, limit } = context.req.valid('query');

    return context.json(
      {
        books: await books.find(viewer, {
          limit,
          ...(search === undefined ? {} : { search }),
          ...(ids === undefined ? {} : { ids }),
        }),
      },
      200,
    );
  });

  app.openapi(listReadingRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);
    const profileId = await readProfileId(context.req.raw.headers);

    if (viewer === null || profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(
      { readings: await books.listReading(viewer, profileId, context.req.valid('query').limit) },
      200,
    );
  });

  app.openapi(forgetReadingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await books.forgetReading(profileId);

    return context.body(null, 204);
  });

  app.openapi(forgetBookReadingRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    await books.forgetReading(profileId, context.req.valid('param').bookId);

    return context.body(null, 204);
  });

  app.openapi(listBooksRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    return context.json(
      { books: await books.find(viewer, { libraryId: context.req.valid('param').libraryId }) },
      200,
    );
  });

  app.openapi(readBookRoute, async (context) => {
    const { bookId } = context.req.valid('param');
    const found =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId))
        ? null
        : await books.read(bookId);

    return found === null
      ? context.json({ error: 'No such book.' }, 404)
      : context.json(found, 200);
  });

  app.openapi(readBookCoverRoute, async (context) => {
    const { bookId } = context.req.valid('param');
    const cover =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId))
        ? null
        : await books.readCover(bookId);

    if (cover === null) {
      return context.json({ error: 'No cover for that book.' }, 404);
    }

    return context.body(cover.bytes.slice().buffer, 200, {
      'content-type': cover.contentType,
      'cache-control': 'public, max-age=604800, immutable',
    });
  });

  app.openapi(readBookPageRoute, async (context) => {
    const { bookId, chapterId, page } = context.req.valid('param');
    const { width } = context.req.valid('query');
    const read =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId, chapterId))
        ? null
        : await books.readPage(chapterId, page, width);

    if (read === null) {
      return context.json({ error: 'No such page.' }, 404);
    }

    return context.body(read.bytes.slice().buffer, 200, {
      'content-type': read.contentType,
      'cache-control': 'private, max-age=604800, immutable',
    });
  });

  app.openapi(readBookContentsRoute, async (context) => {
    const { bookId, chapterId } = context.req.valid('param');
    const contents =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId, chapterId))
        ? null
        : await books.readContents(chapterId);

    return contents === null
      ? context.json({ error: 'That is not a book that reflows.' }, 404)
      : context.json(contents, 200);
  });

  app.openapi(readBookDocumentRoute, async (context) => {
    const { bookId, chapterId } = context.req.valid('param');
    const document =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId, chapterId))
        ? null
        : await books.readDocument(
            chapterId,
            context.req.valid('query').part,
            (href) =>
              `/api/books/${bookId}/chapters/${chapterId}/resource?href=${encodeURIComponent(href)}`,
          );

    if (document === null) {
      return context.json({ error: 'No such part of that book.' }, 404);
    }

    return context.body(document, 200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, max-age=3600',
    });
  });

  app.openapi(readBookResourceRoute, async (context) => {
    const { bookId, chapterId } = context.req.valid('param');
    const read =
      books === undefined || !(await bookInReach(context.req.raw.headers, bookId, chapterId))
        ? null
        : await books.readResource(chapterId, context.req.valid('query').href);

    if (read === null) {
      return context.json({ error: 'That is not in this book.' }, 404);
    }

    return context.body(read.bytes.slice().buffer, 200, {
      'content-type': read.contentType,
      'cache-control': 'private, max-age=604800, immutable',
    });
  });

  app.openapi(saveReadingProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);
    const { bookId, chapterId } = context.req.valid('param');

    if (profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 404);
    }

    if (!(await bookInReach(context.req.raw.headers, bookId, chapterId))) {
      return context.json({ error: 'No such chapter.' }, 404);
    }

    const saved = await books.saveProgress(profileId, chapterId, context.req.valid('json'));

    return saved ? context.body(null, 204) : context.json({ error: 'No such chapter.' }, 404);
  });

  app.openapi(readReadingProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null || books === undefined) {
      return context.json({ error: 'Nobody is signed in.' }, 401);
    }

    const { bookId } = context.req.valid('param');

    return context.json(
      {
        progress: (await bookInReach(context.req.raw.headers, bookId))
          ? await books.readProgress(profileId, bookId)
          : [],
      },
      200,
    );
  });

  app.openapi(mediaImageRoute, async (context) => {
    const { mediaId, kind } = context.req.valid('param');

    const url = await library.readArtworkUrl(mediaId, kind);

    if (url === null || readImage === undefined) {
      return context.json({ error: 'No artwork for that item.' }, 404);
    }

    const image = await readImage(url);

    if (image === null) {
      return context.json({ error: 'That artwork could not be read.' }, 404);
    }

    return context.body(image.body, 200, {
      'content-type': image.contentType,
      'cache-control': 'public, max-age=604800, immutable',
    });
  });

  app.openapi(listSubtitlesRoute, async (context) => {
    const tracks = await subtitles.list(context.req.valid('param').mediaId);

    if (tracks === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    return context.json({ tracks }, 200);
  });

  app.openapi(readSubtitleRoute, async (context) => {
    const { mediaId, trackId } = context.req.valid('param');
    const { from } = context.req.valid('query');

    const track = await subtitles.read(mediaId, trackId);

    if (track === null) {
      return context.json({ error: 'No such track.' }, 404);
    }

    return context.body(shiftWebVtt(track, from), 200, {
      'content-type': 'text/vtt; charset=utf-8',
    });
  });

  app.openapi(readSubtitleCuesRoute, async (context) => {
    const { mediaId, trackId } = context.req.valid('param');
    const { from } = context.req.valid('query');

    const cues = await subtitles.readCues(mediaId, trackId);

    if (cues === null) {
      return context.json({ error: 'That track carries no styling of its own.' }, 404);
    }

    return context.json({ cues: shiftSubtitleCues(cues, from) }, 200);
  });

  app.openapi(stopRoute, async (context) => {
    const { sessionId } = context.req.valid('param');
    const { clientId } = context.req.valid('query');

    if (!(await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId))) {
      return context.json({ error: 'That is not your device.' }, 403);
    }

    const stopped = await playback.stop(sessionId, clientId);

    const letGoBy = getCookie(context, SHARE_COOKIE);

    if (letGoBy !== undefined && shares !== undefined && shareSessions !== undefined) {
      const held = await shares.resolve(letGoBy);

      if (held !== null) {
        shareSessions.release(sessionId, held.id);
      }
    }

    const letGoByProfile = await readProfileId(context.req.raw.headers);

    if (letGoByProfile !== null) {
      playbackSessions?.release(sessionId, letGoByProfile);
    }

    if (!stopped) {
      return context.json({ error: 'No such session.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(heartbeatRoute, async (context) => {
    const { sessionId } = context.req.valid('param');
    const { clientId } = context.req.valid('query');
    const { isPlaying } = context.req.valid('json');

    if (!(await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId))) {
      return context.json({ error: 'That is not your device.' }, 403);
    }

    const known = await playback.heartbeat(sessionId, isPlaying);

    if (!known) {
      return context.json({ error: 'No such session.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(presenceHeartbeatRoute, async (context) => {
    const { clientId } = context.req.valid('param');
    const { isPlaying, health } = context.req.valid('json');

    if (!(await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId))) {
      return context.json({ error: 'That is not your device.' }, 403);
    }

    presence.heartbeatPlayback(clientId, isPlaying, health);

    return context.body(null, 204);
  });

  app.openapi(presenceStopWatchingRoute, async (context) => {
    const { clientId } = context.req.valid('param');

    if (!(await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId))) {
      return context.json({ error: 'That is not your device.' }, 403);
    }

    presence.stopPlayback(clientId);

    return context.body(null, 204);
  });

  app.doc('/api/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Valence API',
      version: SERVER_VERSION,
      description: 'Self-hosted streaming platform API.',
    },
  });

  app.get(
    '/api/reference',
    apiReference({ spec: { url: '/api/openapi.json' }, pageTitle: 'Valence API' }),
  );

  return app;
};

export type { CreateAppOptions };

export { createApp };
