import { z } from 'zod';
import { ReleaseSchema } from './Indexer';

const MEDIA_REQUEST_KINDS = ['film', 'series'] as const;

const MediaRequestKindSchema = z.enum(MEDIA_REQUEST_KINDS);

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

const RELEASE_WAITS = ['digital', 'physical'] as const;

const ReleaseWaitSchema = z.enum(RELEASE_WAITS);

const CalendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const CatalogueEpisodeSchema = z.object({
  season: z.number().int().nonnegative(),
  episode: z.number().int().nonnegative(),
  title: z.string(),
  airDate: CalendarDateSchema.nullable(),
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
});

const RequesterSchema = z.object({ id: z.string().min(1), name: z.string() });

const SeasonsSchema = z.array(z.number().int().nonnegative()).max(200).nullable();

const MediaRequestAskSchema = z.object({
  kind: MediaRequestKindSchema,
  tmdbId: z.number().int().positive(),
  seasons: SeasonsSchema.default(null),
  libraryId: z.string().uuid().optional(),
  waitFor: ReleaseWaitSchema.default('digital'),
});

const MediaRequestDraftSchema = z.object({
  kind: MediaRequestKindSchema,
  tmdbId: z.number().int().positive(),
  libraryId: z.string().min(1),
  libraryPath: z.string().min(1),
  seasons: SeasonsSchema.default(null),
  waitFor: ReleaseWaitSchema.default('digital'),
  requestedBy: RequesterSchema,
  isApproved: z.boolean(),
  catalogue: RequestCatalogueSchema,
});

const RequestItemSchema = z.object({
  id: z.string().uuid(),
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
  lastSearchedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});

const MediaRequestSchema = z.object({
  id: z.string().uuid(),
  kind: MediaRequestKindSchema,
  tmdbId: z.number().int().positive(),
  title: z.string(),
  year: z.number().int().nullable(),
  overview: z.string().nullable(),
  posterUrl: z.string().nullable(),
  libraryId: z.string(),
  state: MediaRequestStateSchema,
  problem: z.string().nullable(),
  approval: RequestApprovalSchema,
  refusedBecause: z.string().nullable(),
  requestedBy: RequesterSchema,
  seasons: SeasonsSchema,
  waitFor: ReleaseWaitSchema,
  releaseDate: CalendarDateSchema.nullable(),
  items: z.array(RequestItemSchema),
  mediaId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const MediaRequestChangeSchema = z.object({
  seasons: SeasonsSchema.optional(),
  waitFor: ReleaseWaitSchema.optional(),
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
  tmdbId: z.number().int().positive(),
  libraryId: z.string(),
});

const MissingSearchSchema = z.object({
  searched: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
});

type MediaRequestKind = (typeof MEDIA_REQUEST_KINDS)[number];
type RequestItemState = (typeof REQUEST_ITEM_STATES)[number];
type MediaRequestState = (typeof MEDIA_REQUEST_STATES)[number];
type RequestApproval = (typeof REQUEST_APPROVALS)[number];
type ReleaseWait = (typeof RELEASE_WAITS)[number];
type CatalogueEpisode = z.infer<typeof CatalogueEpisodeSchema>;
type RequestCatalogue = z.infer<typeof RequestCatalogueSchema>;
type RequestCatalogueDraft = z.input<typeof RequestCatalogueSchema>;
type Requester = z.infer<typeof RequesterSchema>;
type MediaRequestAsk = z.input<typeof MediaRequestAskSchema>;
type MediaRequestDraft = z.input<typeof MediaRequestDraftSchema>;
type RequestItem = z.infer<typeof RequestItemSchema>;
type MediaRequest = z.infer<typeof MediaRequestSchema>;
type MediaRequestChange = z.infer<typeof MediaRequestChangeSchema>;
type MediaRequestRefusal = z.input<typeof MediaRequestRefusalSchema>;
type MediaRequestRevision = z.input<typeof MediaRequestRevisionSchema>;
type MediaRequestAdded = z.infer<typeof MediaRequestAddedSchema>;
type MediaRequestPick = z.infer<typeof MediaRequestPickSchema>;
type RequestCatalogueUpdate = z.input<typeof RequestCatalogueUpdateSchema>;
type MediaRequestArrival = z.infer<typeof MediaRequestArrivalSchema>;
type FollowedRequest = z.infer<typeof FollowedRequestSchema>;
type MissingSearch = z.infer<typeof MissingSearchSchema>;

export type {
  CatalogueEpisode,
  FollowedRequest,
  MediaRequest,
  MediaRequestArrival,
  MediaRequestAdded,
  MediaRequestAsk,
  MediaRequestChange,
  MediaRequestDraft,
  MediaRequestKind,
  MediaRequestPick,
  MediaRequestRefusal,
  MediaRequestRevision,
  MediaRequestState,
  MissingSearch,
  ReleaseWait,
  RequestApproval,
  RequestCatalogue,
  RequestCatalogueDraft,
  RequestCatalogueUpdate,
  Requester,
  RequestItem,
  RequestItemState,
};

export {
  MEDIA_REQUEST_KINDS,
  MEDIA_REQUEST_STATES,
  RELEASE_WAITS,
  REQUEST_APPROVALS,
  REQUEST_ITEM_STATES,
  CalendarDateSchema,
  CatalogueEpisodeSchema,
  FollowedRequestSchema,
  MediaRequestAddedSchema,
  MediaRequestArrivalSchema,
  MediaRequestAskSchema,
  MediaRequestChangeSchema,
  MediaRequestDraftSchema,
  MediaRequestKindSchema,
  MediaRequestPickSchema,
  MediaRequestRefusalSchema,
  MediaRequestRevisionSchema,
  MediaRequestSchema,
  MediaRequestStateSchema,
  MissingSearchSchema,
  ReleaseWaitSchema,
  RequestApprovalSchema,
  RequestCatalogueSchema,
  RequestCatalogueUpdateSchema,
  RequestItemSchema,
  RequestItemStateSchema,
  RequesterSchema,
};
