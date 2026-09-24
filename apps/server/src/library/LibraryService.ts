import type {
  Library,
  LibraryFacets,
  MediaDetail,
  MediaSummary,
  PreviewMoment,
} from '@ValenceContracts/schemas/Library';
import type { ComingUp, ShowDetail, ShowSummary } from '@ValenceContracts/schemas/Show';
import type { Person } from '@ValenceContracts/schemas/Person';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import type { MediaFileDeletion } from '@ValenceServer/library/deleteMediaFile';

type MediaDeletion = MediaFileDeletion | { kind: 'absent' };

type SeriesDeletion =
  { kind: 'deleted'; files: number } | Exclude<MediaDeletion, { kind: 'deleted' }>;

type ListItemsOptions = {
  search?: string;
  kind?: 'films' | 'shows';
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  ids?: string[];
  seriesId?: string;
  order?: 'title' | 'newest' | 'yourRating';
  profileId?: string;
  minYourStars?: number;
  limit: number;
  offset: number;
};

type AgeCeiling = {
  libraryId: string;
  maximumAge: number;
  allowsUnrated: boolean;
};

type AgeSubject = {
  kind: 'item' | 'series';
  subjectId: string;
};

type AgeExceptionEntry = AgeSubject & {
  title: string;
  effect: 'allow' | 'deny';
};

type ShowService = {
  listShows: (viewer: Viewer, libraryId: string) => Promise<ShowSummary[] | null>;
  comingUp: (viewer: Viewer) => Promise<ComingUp['shows']>;
  getShow: (viewer: Viewer, libraryId: string, showId: string) => Promise<ShowDetail | null>;
};

type CreateLibraryInput = {
  name: string;
  kind: Library['kind'];
  flavour?: string | null;
  path: string;
};

type UpdateLibraryInput = {
  defaultAudioLanguage: string | null;
  filesAtOnce?: number | null;
  takesRequests?: boolean;
  requestProfileId?: string | null;
  requestPath?: string | null;
};

type Correction = {
  corrected: number;
  jobId: string | null;
};

type PreviewMomentOutcome =
  | { kind: 'set'; moment: PreviewMoment }
  | { kind: 'absent' }
  | { kind: 'beyondTheEnd'; durationSeconds: number };

type LibraryService = ShowService & {
  list: (viewer: Viewer) => Promise<Library[]>;
  create: (input: CreateLibraryInput) => Promise<Library | null>;
  update: (libraryId: string, input: UpdateLibraryInput) => Promise<Library | null>;
  listItems: (
    viewer: Viewer,
    libraryId: string,
    options: ListItemsOptions,
  ) => Promise<{ items: MediaSummary[]; total: number } | null>;
  listFacets: (viewer: Viewer) => Promise<LibraryFacets>;
  isOutOfReach: (accountId: string, mediaId: string) => Promise<boolean>;
  isSeriesOutOfReach: (accountId: string, seriesId: string) => Promise<boolean>;
  isLibraryOutOfReach: (accountId: string, libraryId: string) => Promise<boolean>;
  refusedLibraries: (accountId: string) => Promise<string[]>;
  allowLibrary: (accountId: string, libraryId: string) => Promise<void>;
  refuseLibrary: (accountId: string, libraryId: string) => Promise<void>;
  ceilingsFor: (accountId: string) => Promise<AgeCeiling[]>;
  setCeiling: (accountId: string, ceiling: AgeCeiling) => Promise<void>;
  clearCeiling: (accountId: string, libraryId: string) => Promise<void>;
  exceptionsFor: (accountId: string) => Promise<AgeExceptionEntry[]>;
  setException: (
    accountId: string,
    subject: AgeSubject,
    effect: 'allow' | 'deny',
    grantedBy: string | null,
  ) => Promise<boolean>;
  clearException: (accountId: string, subject: AgeSubject) => Promise<boolean>;
  exceptionsOn: (subject: AgeSubject) => Promise<{ accountId: string; effect: 'allow' | 'deny' }[]>;
  getMedia: (id: string) => Promise<MediaDetail | null>;
  getSeries: (seriesId: string) => Promise<{ id: string; title: string } | null>;
  seriesOf: (mediaId: string) => Promise<string | null>;
  findByPerson: (viewer: Viewer, personId: number) => Promise<MediaSummary[]>;
  itemsForShare: (scope: {
    kind: 'item' | 'series';
    mediaId: string | null;
    seriesId: string | null;
  }) => Promise<MediaSummary[]>;
  readPerson: (personId: number) => Promise<Person | null>;
  scan: (
    libraryId: string,
    force?: boolean,
    run?: { id: string; of: number },
  ) => Promise<{ jobId: string; state: string } | null>;
  reset: (libraryId: string) => Promise<{ jobId: string; state: string } | null>;
  remove: (libraryId: string) => Promise<boolean>;
  deleteMedia: (mediaId: string) => Promise<MediaDeletion>;
  deleteSeries: (seriesId: string) => Promise<SeriesDeletion>;
  correctMatch: (
    mediaId: string,
    reference: { externalId: string; externalKind: 'tv' | 'movie' },
    by: string | null,
  ) => Promise<Correction | null>;
  forgetCorrection: (mediaId: string) => Promise<Correction | null>;
  rebuildArtefacts: (mediaId: string) => Promise<{ preview: boolean; trickplay: boolean } | null>;
  setPreviewMoment: (
    mediaId: string,
    moment: PreviewMoment,
    by: string | null,
  ) => Promise<PreviewMomentOutcome>;
  clearPreviewMoment: (mediaId: string) => Promise<{ cleared: boolean } | null>;
  regeneratePreviews: (libraryId: string) => Promise<{ jobId: string; state: string } | null>;
  remakePreviews: (libraryId: string) => Promise<{ jobId: string; state: string } | null>;
  clearParts: (
    libraryId: string,
    parts: LibraryPart[],
  ) => Promise<{ jobId: string; state: string } | null>;
  regenerateTrickplay: (libraryId: string) => Promise<{ jobId: string; state: string } | null>;
  fetchLogos: (libraryId: string) => Promise<{ jobId: string; state: string } | null>;
  detectSegments: (libraryId: string) => Promise<{ jobId: string; state: string } | null>;
  readScanState: (jobId: string) => Promise<{
    state: string;
    phase: string | null;
    processed: number | null;
    total: number | null;
    item: string | null;
  }>;
  readArtworkUrl: (mediaId: string, kind: 'poster' | 'backdrop' | 'logo') => Promise<string | null>;
};

const DEFAULT_LIMIT = 60;

export type {
  AgeCeiling,
  AgeExceptionEntry,
  AgeSubject,
  Correction,
  CreateLibraryInput,
  LibraryService,
  ListItemsOptions,
  MediaDeletion,
  SeriesDeletion,
  PreviewMomentOutcome,
  UpdateLibraryInput,
};

export { DEFAULT_LIMIT };
