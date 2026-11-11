import type { WordRule } from '@ValenceContracts/schemas/WordRule';
import type { EpisodeOrders } from '@ValenceContracts/schemas/EpisodeOrder';
import type {
  CatalogueSeasons,
  ChooseSeasonSource,
  SeasonSourceState,
} from '@ValenceContracts/schemas/SeasonSource';
import type { whatIsWrongWithThePicture } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import type { EntryFacts } from '@ValenceServer/files/describeLibraryEntries';
import type { HigherProfileAsks } from '@ValenceContracts/schemas/HigherProfileAsks';
import type { Fulfilment } from '@ValenceContracts/schemas/ArrApp';
import type { CatalogueArtwork } from '@ValenceServer/calendar/CatalogueArtwork';
import type { CatalogueTitleRef } from '@ValenceServer/calendar/CatalogueTitleRef';
import type { ArtworkChoices, ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { LeftOut } from '@ValenceContracts/schemas/LeftOut';
import type {
  ExtraKind,
  Library,
  LibraryFacets,
  MediaDetail,
  MediaSummary,
  PreviewMoment,
} from '@ValenceContracts/schemas/Library';
import type { ComingUp, ShowDetail, ShowSummary, UpNext } from '@ValenceContracts/schemas/Show';
import type { Person } from '@ValenceContracts/schemas/Person';
import type { PersonFound } from '@ValenceContracts/schemas/PersonFound';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import type { MediaFileDeletion } from '@ValenceServer/library/deleteMediaFile';
import type { MediaFileMove } from '@ValenceServer/library/moveMediaFile';
import type {
  PatternRenamePlan,
  PatternRenameResult,
} from '@ValenceContracts/schemas/PatternRename';
import type { CalendarEpisode } from '@ValenceServer/calendar/CalendarEpisode';

type MediaDeletion = MediaFileDeletion | { kind: 'absent' };

type MediaMove =
  | { kind: 'moved'; files: number; jobId: string | null }
  | { kind: 'absent' }
  | { kind: 'sameLibrary' }
  | { kind: 'wrongKind' }
  | (Exclude<MediaFileMove, { kind: 'moved' }> & { jobId?: string | null });

type SeriesDeletion =
  | { kind: 'deleted'; files: number }
  | Exclude<MediaDeletion, { kind: 'deleted' }>;

type ListItemsOptions = {
  search?: string;
  kind?: 'films' | 'shows';
  genre?: string;
  genres?: string[];
  decades?: number[];
  audio?: { languages: string[]; codecs: string[]; channels: number[] };
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  ids?: string[];
  seriesId?: string;
  order?: 'title' | 'newest' | 'rated' | 'yourRating';
  profileId?: string;
  minYourStars?: number;
  withVersions?: boolean;
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
  upNext: (viewer: Viewer) => Promise<UpNext['episodes']>;
  releaseCalendar: (viewer: Viewer, from: string, to: string) => Promise<CalendarEpisode[]>;
  airingStills: (catalogueIds: readonly string[]) => Promise<ReadonlyMap<string, string>>;
  catalogueArtwork: (
    titles: readonly CatalogueTitleRef[],
  ) => Promise<ReadonlyMap<string, CatalogueArtwork>>;
  getShow: (viewer: Viewer, libraryId: string, showId: string) => Promise<ShowDetail | null>;
};

type CreateLibraryInput = {
  name: string;
  kind: Library['kind'];
  flavour?: string | null;
  path: string;
};

type UpdateLibraryInput = {
  kind?: 'shows' | 'anime';
  defaultAudioLanguage: string | null;
  filesAtOnce?: number | null;
  takesRequests?: boolean;
  requestProfileId?: string | null;
  requestPath?: string | null;
  keepsShowsTogether?: boolean;
  metadataLanguage?: string | null;
  usesOriginalTitle?: boolean;
  writesNfo?: boolean;
  higherProfileAsks?: HigherProfileAsks;
  fulfilment?: Fulfilment | null;
};

type Correction = {
  corrected: number;
  jobId: string | null;
};

type LeavingOut =
  | { kind: 'left'; leftOut: LeftOut; jobId: string | null }
  | { kind: 'noLibrary' }
  | { kind: 'outside' };

type BringingBack = { leftOut: LeftOut; jobId: string | null };

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
  listItemsAcross: (
    viewer: Viewer,
    libraryIds: readonly string[],
    options: ListItemsOptions & { counted?: boolean },
  ) => Promise<{ items: MediaSummary[]; total: number }>;
  listFacets: (viewer: Viewer) => Promise<LibraryFacets>;
  isOutOfReach: (viewer: Viewer, mediaId: string) => Promise<boolean>;
  isSeriesOutOfReach: (viewer: Viewer, seriesId: string) => Promise<boolean>;
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
  findPeople: (viewer: Viewer, search: string, limit: number) => Promise<PersonFound[]>;
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
  moveMedia: (mediaIds: readonly string[], toLibraryId: string) => Promise<MediaMove>;
  mediaIdsAt: (paths: string[]) => Promise<Record<string, string>>;
  readEntryFacts: (
    libraryId: string,
    files: readonly string[],
    folders: readonly string[],
  ) => Promise<EntryFacts>;
  mediaPathsIn: (libraryId: string) => Promise<Record<string, string>>;
  correctMatch: (
    mediaId: string,
    reference: { externalId: string; externalKind: 'tv' | 'movie' },
    by: string | null,
  ) => Promise<Correction | null>;
  forgetCorrection: (mediaId: string) => Promise<Correction | null>;
  unmatch: (mediaId: string, by: string | null) => Promise<Correction | null>;
  refreshTitle: (
    mediaId: string,
    mode: 'details' | 'artwork' | 'files',
  ) => Promise<Correction | null>;
  listLeftOut: (libraryId: string) => Promise<LeftOut[] | null>;
  leaveOut: (
    libraryId: string,
    asked: { path: string; note: string | null },
    by: string | null,
  ) => Promise<LeavingOut>;
  bringBack: (libraryId: string, leftOutId: string) => Promise<BringingBack | null>;
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
    phase: Said | null;
    processed: number | null;
    total: number | null;
    item: string | null;
  }>;
  readArtworkUrl: (
    mediaId: string,
    kind: 'poster' | 'backdrop' | 'logo',
    isOfTitle?: boolean,
  ) => Promise<string | null>;
  readBarePosterUrl: (mediaId: string) => Promise<string | null>;
  readArtworkPart?: (
    mediaId: string,
    part: { season: number; episode: number | null },
  ) => Promise<ArtworkChoices | 'missing' | 'unmatched' | 'unavailable'>;
  chooseArtworkPart?: (
    mediaId: string,
    part: { season: number; episode: number | null },
    url: string | null,
    by: string | null,
  ) => Promise<{ jobId: string | null } | 'missing' | 'unmatched' | 'unavailable' | 'refused'>;
  readArtworkChoices: (
    mediaId: string,
  ) => Promise<ArtworkChoices | 'missing' | 'unmatched' | 'unavailable'>;
  chooseArtwork: (
    mediaId: string,
    kind: ArtworkKind,
    url: string | null,
    by: string | null,
  ) => Promise<{ jobId: string | null } | 'missing' | 'unmatched' | 'unavailable' | 'refused'>;
  uploadArtwork?: (
    mediaId: string,
    kind: ArtworkKind,
    artwork: { body: Uint8Array; contentType: string },
    by: string | null,
  ) => Promise<
    | { jobId: string | null }
    | 'missing'
    | 'unmatched'
    | 'unavailable'
    | 'refused'
    | { fault: NonNullable<Awaited<ReturnType<typeof whatIsWrongWithThePicture>>> }
  >;
  isOwnArtwork?: (mediaId: string, url: string) => Promise<boolean>;
  chooseExtra?: (
    mediaId: string,
    choice: { extraKind: ExtraKind | null; parentId: string | null; isForgotten?: boolean },
  ) => Promise<Correction | null>;
  readWordRules?: (libraryId: string) => Promise<WordRule[]>;
  saveWordRules?: (libraryId: string, rules: readonly WordRule[]) => Promise<WordRule[]>;
  pinEpisode?: (
    mediaId: string,
    pin: { seasonNumber: number; episodeNumber: number; episodeNumberEnd: number | null } | null,
  ) => Promise<Correction | null>;
  chooseEpisodeOrder?: (mediaId: string, order: string | null) => Promise<Correction | null>;
  readEpisodeOrders?: (mediaId: string) => Promise<EpisodeOrders | null>;
  readSeasonSource?: (mediaId: string) => Promise<SeasonSourceState>;
  chooseSeasonSource?: (
    mediaId: string,
    source: ChooseSeasonSource['source'],
  ) => Promise<Correction | 'noSuchSeason' | 'catalogueUnavailable' | null>;
  readCatalogueSeasons?: (externalId: string) => Promise<CatalogueSeasons | null>;
  chooseVersion?: (
    mediaId: string,
    choice: { label?: string | null; isStanding?: boolean },
  ) => Promise<boolean>;
  planPatternRenames?: (mediaIds: readonly string[]) => Promise<PatternRenamePlan>;
  renameToPattern?: (
    mediaIds: readonly string[],
    whenTaken: 'skip' | 'number',
  ) => Promise<PatternRenameResult>;
};

const DEFAULT_LIMIT = 60;

export type {
  AgeCeiling,
  AgeExceptionEntry,
  AgeSubject,
  BringingBack,
  Correction,
  CreateLibraryInput,
  LeavingOut,
  LibraryService,
  ListItemsOptions,
  MediaDeletion,
  MediaMove,
  SeriesDeletion,
  PreviewMomentOutcome,
  UpdateLibraryInput,
};

export { DEFAULT_LIMIT };
