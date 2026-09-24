import type {
  QueueControl,
  TranscoderStreamedFile,
} from '@ValenceServer/transcoder/TranscoderClient';
import type { RunningJob } from '@ValenceServer/jobs/JobQueue';
import type { CatalogueMatch } from '@ValenceServer/library/MetadataProvider';
import type { ValenceAuth } from '@ValenceServer/auth/Auth';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { SubtitleService } from '@ValenceServer/subtitles/SubtitleService';
import type { SegmentService } from '@ValenceServer/segments/SegmentService';
import type { WatchProgressService } from '@ValenceServer/progress/WatchProgressService';
import type { DownloadService } from '@ValenceServer/downloads/DownloadService';
import type { FavouriteService } from '@ValenceServer/favourites/FavouriteService';
import type { HiddenService } from '@ValenceServer/hiding/HiddenService';
import type { RatingService } from '@ValenceServer/ratings/RatingService';
import type { ShareService } from '@ValenceServer/sharing/ShareService';
import type { ShareSessions } from '@ValenceServer/sharing/createShareSessions';
import type { PlaybackSessions } from '@ValenceServer/playback/createPlaybackSessions';
import type { PlaybackService } from '@ValenceServer/playback/PlaybackService';
import type { PresenceService } from '@ValenceServer/presence/PresenceService';
import type { UploadSessions } from '@ValenceServer/uploads/UploadSession';
import type { UploadDisk } from '@ValenceServer/uploads/UploadDisk';
import type { FolderDisk } from '@ValenceServer/folders/FolderDisk';
import type { HouseholdService } from '@ValenceServer/household/HouseholdService';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { SplashscreenStore } from '@ValenceServer/splashscreen/SplashscreenStore';
import type { JobDefinition } from '@ValenceServer/jobs/jobDefinitions';
import type { RequestsClient } from '@ValenceServer/requests/createRequestsClient';
import type { RequestsMonitor } from '@ValenceServer/requests/createRequestsMonitor';
import type { MaintenanceService } from '@ValenceServer/maintenance/MaintenanceService';
import type { JobScheduleService } from '@ValenceServer/jobs/JobScheduleService';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { JobStall } from '@ValenceServer/jobs/createJobHealthWatch';
import type { ProfileService } from '@ValenceServer/profiles/ProfileService';
import type { BookService } from '@ValenceServer/books/createDatabaseBookService';
import type { Avatar, ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { NotificationStore } from '@ValenceServer/notifications/NotificationStore';
import type { PermissionService } from '@ValenceServer/auth/PermissionService';
import type { ApiKeyService } from '@ValenceServer/auth/ApiKeyService';
import type { WebhookStore } from '@ValenceServer/webhooks/WebhookStore';
import type { RealtimePublisher } from '@ValenceServer/realtime/RealtimePublisher';
import type { EventBus } from '@ValenceServer/events/EventBus';
import type {
  MusicCatalogueHit,
  MusicRequestKind,
  RequestCatalogue,
  VideoRequestKind,
} from '@ValenceContracts/schemas/MediaRequest';
import type { Discovery } from '@ValenceServer/requests/catalogue/Discovery';
import type { LogStore } from '@ValenceServer/logging/Logger';
import type { JobHistoryStore } from '@ValenceServer/jobs/createJobHistoryStore';
import type { ResourceHistoryStore } from '@ValenceServer/logging/createResourceHistoryStore';
import type { HistoryService } from '@ValenceServer/history/HistoryService';
import type { VideoDevices } from '@ValenceServer/video/createVideoDevices';
import type { MusicServices } from '@ValenceServer/music/MusicServices';
import type { ReencodeService } from '@ValenceServer/reencode/ReencodeService';

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
  streamBookFile?: (path: string, range: string | null) => Promise<TranscoderStreamedFile | null>;
  music?: MusicServices;
  videoDevices?: VideoDevices;
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
  uploadSessions?: UploadSessions;
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
  describeBookForRequest?: (openLibraryId: number) => Promise<RequestCatalogue | null>;
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

export type { ArtefactCount, CreateAppOptions, StorageCount };
