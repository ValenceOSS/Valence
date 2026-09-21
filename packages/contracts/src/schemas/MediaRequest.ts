import { z } from 'zod';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { ReleaseSchema } from './Indexer';

const MEDIA_REQUEST_KINDS = ['film', 'series', 'artist', 'album', 'book'] as const;

const MediaRequestKindSchema = z.enum(MEDIA_REQUEST_KINDS);

const MUSIC_REQUEST_KINDS = ['artist', 'album'] as const;

const BOOK_REQUEST_KINDS = ['book'] as const;

const OpenLibraryIdSchema = z.number().int().positive();

const RELEASE_TYPES = ['album', 'ep', 'single', 'live', 'compilation'] as const;

const ReleaseTypeSchema = z.enum(RELEASE_TYPES);

const ReleaseTypesSchema = z.array(ReleaseTypeSchema).min(1).max(RELEASE_TYPES.length);

const MusicBrainzIdSchema = z.string().uuid();

const REQUEST_ITEM_STATES = [
  'waiting',
  'wanted',
  'searching',
  'chosen',
  'downloading',
  'filing',
  'filed',
  'available',
  'failed',
] as const;

const RequestItemStateSchema = z.enum(REQUEST_ITEM_STATES);

const MEDIA_REQUEST_STATES = ['awaitingApproval', 'refused', ...REQUEST_ITEM_STATES] as const;

const MediaRequestStateSchema = z.enum(MEDIA_REQUEST_STATES);

const REQUEST_APPROVALS = ['awaiting', 'approved', 'refused'] as const;

const RequestApprovalSchema = z.enum(REQUEST_APPROVALS);

const CalendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const CatalogueEpisodeSchema = z.object({
  season: z.number().int().nonnegative(),
  episode: z.number().int().nonnegative(),
  title: z.string(),
  airDate: CalendarDateSchema.nullable(),
});

const CatalogueAlbumSchema = z.object({
  id: MusicBrainzIdSchema,
  title: z.string(),
  type: ReleaseTypeSchema.nullable(),
  firstReleased: CalendarDateSchema.nullable(),
});

const RequestCatalogueSchema = z.object({
  title: z.string().min(1),
  year: z.number().int().nullable(),
  aliases: z.array(z.string().min(1)).max(50).default([]),
  overview: z.string().nullable().default(null),
  posterUrl: z.string().nullable().default(null),
  runtimeMinutes: z.number().int().positive().nullable().default(null),
  releaseDates: z
    .object({
      theatrical: CalendarDateSchema.nullable(),
      digital: CalendarDateSchema.nullable(),
      physical: CalendarDateSchema.nullable(),
    })
    .default({ theatrical: null, digital: null, physical: null }),
  episodes: z.array(CatalogueEpisodeSchema).max(5000).default([]),
  isEnded: z.boolean().default(false),
  artist: z.string().nullable().default(null),
  albums: z.array(CatalogueAlbumSchema).max(2000).default([]),
});

const RequesterSchema = z.object({ id: z.string().min(1), name: z.string() });

const SeasonsSchema = z.array(z.number().int().nonnegative()).max(200).nullable();

/**
 * Says where a request lacks the id its kind is found by: a TMDB id for a film or a series, a
 * MusicBrainz id for an artist or an album, an Open Library id for a book.
 *
 * @param asked - The request.
 * @param context - Where to say so.
 */
const needsItsId = (
  asked: {
    kind: MediaRequestKind;
    tmdbId?: number | null | undefined;
    musicBrainzId?: string | null | undefined;
    openLibraryId?: number | null | undefined;
  },
  context: z.RefinementCtx,
): void => {
  const isBook = isBookRequest(asked.kind);
  const isMusic = isMusicRequest(asked.kind);
  const id = isBook ? asked.openLibraryId : isMusic ? asked.musicBrainzId : asked.tmdbId;

  if (id === undefined || id === null) {
    context.addIssue({
      code: 'custom',
      path: [isBook ? 'openLibraryId' : isMusic ? 'musicBrainzId' : 'tmdbId'],
      message: isBook
        ? 'A book is asked for by its Open Library id.'
        : isMusic
          ? 'Music is asked for by its MusicBrainz id.'
          : 'A film or series is asked for by its TMDB id.',
    });
  }
};

const MediaRequestAskSchema = z
  .object({
    kind: MediaRequestKindSchema,
    tmdbId: z.number().int().positive().optional(),
    musicBrainzId: MusicBrainzIdSchema.optional(),
    openLibraryId: OpenLibraryIdSchema.optional(),
    seasons: SeasonsSchema.default(null),
    releaseTypes: ReleaseTypesSchema.optional(),
    libraryId: z.string().uuid().optional(),
    profileId: z.string().uuid().optional(),
    isPickedByHand: z.boolean().default(false),
    release: ReleaseSchema.optional(),
  })
  .superRefine(needsItsId);

const MediaRequestDraftSchema = z
  .object({
    kind: MediaRequestKindSchema,
    tmdbId: z.number().int().positive().nullable().default(null),
    musicBrainzId: MusicBrainzIdSchema.nullable().default(null),
    openLibraryId: OpenLibraryIdSchema.nullable().default(null),
    libraryId: z.string().min(1),
    libraryPath: z.string().min(1),
    libraryLanguage: z.string().min(2).max(8).nullable().default(null),
    profileId: z.string().uuid().nullable().default(null),
    isPickedByHand: z.boolean().default(false),
    seasons: SeasonsSchema.default(null),
    releaseTypes: ReleaseTypesSchema.nullable().default(null),
    requestedBy: RequesterSchema,
    isApproved: z.boolean(),
    catalogue: RequestCatalogueSchema,
  })
  .superRefine(needsItsId);

const RequestItemSchema = z.object({
  id: z.string().uuid(),
  musicBrainzId: MusicBrainzIdSchema.nullable(),
  season: z.number().int().nonnegative().nullable(),
  episode: z.number().int().nonnegative().nullable(),
  title: z.string(),
  airDate: CalendarDateSchema.nullable(),
  state: RequestItemStateSchema,
  problem: z.string().nullable(),
  releaseTitle: z.string().nullable(),
  downloadId: z.string().uuid().nullable(),
  filePath: z.string().nullable(),
  score: z.number().nullable(),
  downloadedBytes: z.number().nonnegative().nullable(),
  downloadSeconds: z.number().nonnegative().nullable(),
  lastSearchedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});

const MediaRequestSchema = z.object({
  id: z.string().uuid(),
  kind: MediaRequestKindSchema,
  tmdbId: z.number().int().positive().nullable(),
  musicBrainzId: MusicBrainzIdSchema.nullable(),
  openLibraryId: OpenLibraryIdSchema.nullable(),
  title: z.string(),
  artistName: z.string().nullable(),
  year: z.number().int().nullable(),
  overview: z.string().nullable(),
  posterUrl: z.string().nullable(),
  libraryId: z.string(),
  profileId: z.string().nullable(),
  profileName: z.string().nullable(),
  isPickedByHand: z.boolean(),
  state: MediaRequestStateSchema,
  problem: z.string().nullable(),
  approval: RequestApprovalSchema,
  refusedBecause: z.string().nullable(),
  requestedBy: RequesterSchema,
  seasons: SeasonsSchema,
  releaseTypes: ReleaseTypesSchema.nullable(),
  releaseDate: CalendarDateSchema.nullable(),
  items: z.array(RequestItemSchema),
  mediaId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const MediaRequestChangeSchema = z.object({
  profileId: z.string().uuid().nullable().optional(),
  isPickedByHand: z.boolean().optional(),
  seasons: SeasonsSchema.optional(),
  releaseTypes: ReleaseTypesSchema.optional(),
  libraryId: z.string().min(1).optional(),
  libraryPath: z.string().min(1).optional(),
});

const MEDIA_REQUEST_DECISIONS = ['approve', 'refuse'] as const;

const MediaRequestDecisionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  decision: z.enum(MEDIA_REQUEST_DECISIONS),
  reason: z.string().trim().max(500).default(''),
});

const MediaRequestDecidedSchema = z.object({
  decided: z.array(MediaRequestSchema),
  refused: z.array(z.object({ id: z.string().uuid(), problem: z.string() })),
});

const BlockedReleaseSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  title: z.string(),
  indexerId: z.string().nullable(),
  reason: z.string(),
  at: z.string().datetime(),
});

const MediaRequestRevisionSchema = z.object({
  change: MediaRequestChangeSchema,
  catalogue: RequestCatalogueSchema.nullable().default(null),
});

const MediaRequestAddedSchema = z.object({ request: MediaRequestSchema, isNew: z.boolean() });

const MediaRequestRefusalSchema = z.object({
  reason: z.string().trim().max(500).default(''),
});

const MediaRequestPickSchema = z.object({ release: ReleaseSchema });

const RequestCatalogueUpdateSchema = z.object({
  catalogue: RequestCatalogueSchema,
  libraryPath: z.string().min(1).optional(),
});

const MediaRequestArrivalSchema = z.object({ mediaId: z.string().min(1) });

const FollowedRequestSchema = z.object({
  id: z.string().uuid(),
  kind: MediaRequestKindSchema,
  tmdbId: z.number().int().positive().nullable(),
  musicBrainzId: MusicBrainzIdSchema.nullable(),
  openLibraryId: OpenLibraryIdSchema.nullable(),
  libraryId: z.string(),
});

const SEASON_STANDINGS = ['askable', 'requested', 'partly', 'library'] as const;

const SeasonStandingSchema = z.enum(SEASON_STANDINGS);

const CatalogueSeasonSchema = z.object({
  season: z.number().int().nonnegative(),
  episodeCount: z.number().int().nonnegative(),
  firstAired: CalendarDateSchema.nullable(),
  standing: SeasonStandingSchema.default('askable'),
});

const MusicCatalogueHitSchema = z.object({
  kind: z.enum(MUSIC_REQUEST_KINDS),
  musicBrainzId: MusicBrainzIdSchema,
  title: z.string(),
  artist: z.string().nullable(),
  disambiguation: z.string().nullable(),
  type: ReleaseTypeSchema.nullable(),
  year: z.number().int().nullable(),
  coverUrl: z.string().nullable(),
});

const RequestLogEntrySchema = z.object({
  id: z.number().int().positive(),
  at: z.string().datetime(),
  message: z.string(),
});

const MissingSearchSchema = z.object({
  searched: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
});

type MediaRequestKind = (typeof MEDIA_REQUEST_KINDS)[number];
type MusicRequestKind = (typeof MUSIC_REQUEST_KINDS)[number];
type BookRequestKind = (typeof BOOK_REQUEST_KINDS)[number];
type VideoRequestKind = Exclude<MediaRequestKind, MusicRequestKind | BookRequestKind>;
type ReleaseType = (typeof RELEASE_TYPES)[number];
type CatalogueAlbum = z.infer<typeof CatalogueAlbumSchema>;
type MusicCatalogueHit = z.infer<typeof MusicCatalogueHitSchema>;
type RequestItemState = (typeof REQUEST_ITEM_STATES)[number];
type MediaRequestState = (typeof MEDIA_REQUEST_STATES)[number];
type CatalogueEpisode = z.infer<typeof CatalogueEpisodeSchema>;
type RequestCatalogue = z.infer<typeof RequestCatalogueSchema>;
type RequestCatalogueDraft = z.input<typeof RequestCatalogueSchema>;
type MediaRequestAsk = z.input<typeof MediaRequestAskSchema>;
type MediaRequestDraft = z.input<typeof MediaRequestDraftSchema>;
type RequestItem = z.infer<typeof RequestItemSchema>;
type MediaRequest = z.infer<typeof MediaRequestSchema>;
type MediaRequestChange = z.infer<typeof MediaRequestChangeSchema>;
type MediaRequestDecided = z.infer<typeof MediaRequestDecidedSchema>;
type BlockedRelease = z.infer<typeof BlockedReleaseSchema>;
type MediaRequestRevision = z.input<typeof MediaRequestRevisionSchema>;
type MediaRequestAdded = z.infer<typeof MediaRequestAddedSchema>;
type RequestCatalogueUpdate = z.input<typeof RequestCatalogueUpdateSchema>;
type FollowedRequest = z.infer<typeof FollowedRequestSchema>;
type MissingSearch = z.infer<typeof MissingSearchSchema>;
type RequestLogEntry = z.infer<typeof RequestLogEntrySchema>;
type CatalogueSeason = z.infer<typeof CatalogueSeasonSchema>;
type SeasonStanding = (typeof SEASON_STANDINGS)[number];

export type {
  BlockedRelease,
  BookRequestKind,
  CatalogueAlbum,
  CatalogueEpisode,
  CatalogueSeason,
  SeasonStanding,
  FollowedRequest,
  MediaRequest,
  MediaRequestAdded,
  MediaRequestAsk,
  MediaRequestChange,
  MediaRequestDecided,
  MediaRequestDraft,
  MediaRequestKind,
  MediaRequestRevision,
  MediaRequestState,
  MissingSearch,
  MusicCatalogueHit,
  MusicRequestKind,
  ReleaseType,
  RequestCatalogue,
  RequestCatalogueDraft,
  RequestCatalogueUpdate,
  RequestItem,
  RequestItemState,
  RequestLogEntry,
  VideoRequestKind,
};

export {
  BOOK_REQUEST_KINDS,
  MEDIA_REQUEST_KINDS,
  MEDIA_REQUEST_STATES,
  MUSIC_REQUEST_KINDS,
  RELEASE_TYPES,
  REQUEST_APPROVALS,
  MEDIA_REQUEST_DECISIONS,
  REQUEST_ITEM_STATES,
  BlockedReleaseSchema,
  CalendarDateSchema,
  CatalogueAlbumSchema,
  CatalogueEpisodeSchema,
  CatalogueSeasonSchema,
  SEASON_STANDINGS,
  SeasonStandingSchema,
  FollowedRequestSchema,
  MediaRequestAddedSchema,
  MediaRequestArrivalSchema,
  MediaRequestAskSchema,
  MediaRequestChangeSchema,
  MediaRequestDecidedSchema,
  MediaRequestDecisionSchema,
  MediaRequestDraftSchema,
  MediaRequestKindSchema,
  MediaRequestPickSchema,
  OpenLibraryIdSchema,
  MediaRequestRefusalSchema,
  MediaRequestRevisionSchema,
  MediaRequestSchema,
  MediaRequestStateSchema,
  MissingSearchSchema,
  MusicBrainzIdSchema,
  MusicCatalogueHitSchema,
  ReleaseTypeSchema,
  ReleaseTypesSchema,
  RequestApprovalSchema,
  RequestCatalogueSchema,
  RequestCatalogueUpdateSchema,
  RequestItemSchema,
  RequestItemStateSchema,
  RequestLogEntrySchema,
  RequesterSchema,
};
