import type { Said } from '@ValenceI18n/SaidSchema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  AccountWithoutPasswordOutcome,
  AccountWithoutPasswordRequest,
} from '@ValenceServer/accounts/createAccountWithoutPassword';
import type { SetupLinkService } from '@ValenceServer/accounts/setupLinks/SetupLinkService';
import type { CollectionService } from '@ValenceServer/collections/CollectionService';
import type { EmailService } from '@ValenceServer/email/EmailService';
import type { FavouriteService } from '@ValenceServer/favourites/FavouriteService';
import type { JobQueue } from '@ValenceServer/jobs/JobQueue';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { PlaylistService } from '@ValenceServer/playlists/PlaylistService';
import type { ProfileService } from '@ValenceServer/profiles/ProfileService';
import type { RatingService } from '@ValenceServer/ratings/RatingService';
import type { SegmentService } from '@ValenceServer/segments/SegmentService';
import type { RequestsReach } from '@ValenceContracts/schemas/MediaImport';
import type { ImportStore } from './createDatabaseImportStore';
import type { SourceFetch } from './createSourceCaller';
import type { SourceReader } from './SourceReader';
import type { StoredImportSource } from './ImportRecords';

type ImportServices = {
  db: AnyValenceDatabase;
  store: ImportStore;
  library: Pick<
    LibraryService,
    'list' | 'create' | 'scan' | 'refuseLibrary' | 'allowLibrary' | 'setCeiling'
  >;
  profiles: Pick<ProfileService, 'ensureDefault' | 'savePhoto'>;
  favourites: Pick<FavouriteService, 'keep'>;
  ratings: Pick<RatingService, 'set'>;
  playlists: Pick<PlaylistService, 'create' | 'read' | 'add' | 'drop' | 'update'>;
  segments: SegmentService;
  collections: Pick<CollectionService, 'create' | 'replaceEntries'> | null;
  createAccountWithoutPassword:
    ((request: AccountWithoutPasswordRequest) => Promise<AccountWithoutPasswordOutcome>) | null;
  setupLinks: Pick<SetupLinkService, 'issue'> | null;
  email: Pick<EmailService, 'isOn'> | null;
  grantAdministrator: (userId: string) => Promise<void>;
  banAccount: (userId: string, reason: string) => Promise<boolean>;
  tmdbOfTvdb: (tvdbId: number) => Promise<number | null>;
  regions: () => Promise<readonly string[]>;
  fetch: SourceFetch;
  readerFor?:
    ((source: StoredImportSource, regions: readonly string[]) => SourceReader) | undefined;
  jobs: Pick<JobQueue, 'enqueue' | 'reportProgress' | 'readProgress' | 'isCancelled' | 'cancel'>;
  recordIssue: (jobId: string, what: string, reason: Said) => void;
  requestsReach: () => RequestsReach;
  log: (message: string) => void;
};

export type { ImportServices };
