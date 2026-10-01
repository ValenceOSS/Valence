import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { QualityStepIdSchema } from './QualityStep';

const REENCODE_MODES = ['replace', 'keep', 'audioOnly'] as const;

const ReencodeModeSchema = z.enum(REENCODE_MODES);

const REENCODE_STATES = [
  'queued',
  'encoding',
  'verifying',
  'awaitingReview',
  'finished',
  'rejected',
  'failed',
  'cancelled',
] as const;

const ReencodeStateSchema = z.enum(REENCODE_STATES);

const REENCODES_STILL_TO_BE_WRITTEN = ['queued', 'encoding', 'verifying'] as const;

const REENCODES_UNDER_WAY = [...REENCODES_STILL_TO_BE_WRITTEN, 'awaitingReview'] as const;

const REENCODE_CODECS = ['h264', 'hevc', 'av1'] as const;

const ReencodeCodecSchema = z.enum(REENCODE_CODECS);

const REENCODE_AUDIO_CHOICES = ['keep', 'compress'] as const;

const ReencodeAudioSchema = z.enum(REENCODE_AUDIO_CHOICES);

const REENCODE_CONTAINERS = ['mp4', 'mkv'] as const;

const ReencodeContainerSchema = z.enum(REENCODE_CONTAINERS);

const REENCODE_PLACEMENTS = ['hidden', 'beside'] as const;

const ReencodePlacementSchema = z.enum(REENCODE_PLACEMENTS);

const REENCODE_ORIGINS = ['admin', 'preTranscode'] as const;

const ReencodeOriginSchema = z.enum(REENCODE_ORIGINS);

const REENCODE_MAX_BITRATE_KBPS = { min: 100, max: 200000 } as const;

const REENCODE_REFUSALS = [
  'NotFound',
  'NoVideo',
  'AlreadyAsSmall',
  'FolderIsReadOnly',
  'BeingWatched',
  'AlreadyUnderWay',
  'SubtitlesWouldNotSurvive',
  'NotEnoughRoom',
  'TooManyAwaitingReview',
  'NameIsTaken',
  'AlreadyKept',
] as const;

const ReencodeRefusalCodeSchema = z.enum(REENCODE_REFUSALS);

const ReencodeRefusalSchema = z.object({
  code: ReencodeRefusalCodeSchema,
  detail: SaidSchema,
});

const ReencodeSettingsSchema = z.object({
  mode: ReencodeModeSchema,
  quality: QualityStepIdSchema.nullable(),
  videoCodec: ReencodeCodecSchema.nullable(),
  audio: ReencodeAudioSchema,
  container: ReencodeContainerSchema.optional(),
  maxBitrateKbps: z
    .number()
    .int()
    .min(REENCODE_MAX_BITRATE_KBPS.min)
    .max(REENCODE_MAX_BITRATE_KBPS.max)
    .optional(),
  placement: ReencodePlacementSchema.optional(),
});

const ReencodeRequestSchema = ReencodeSettingsSchema.extend({
  mediaIds: z.array(z.string().uuid()).min(1).max(500),
});

const ReencodeCandidateSchema = z.object({
  mediaId: z.string().uuid(),
  title: z.string(),
  seriesTitle: z.string().nullable(),
  libraryId: z.string().uuid(),
  sizeBytes: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  videoCodec: z.string(),
  videoRange: z.string(),
  estimatedBytes: z.number().nonnegative().nullable(),
  refusal: ReencodeRefusalSchema.nullable(),
});

const ReencodeEstimateSchema = z.object({
  candidates: z.array(ReencodeCandidateSchema),
  nowBytes: z.number().nonnegative(),
  afterBytes: z.number().nonnegative(),
  freeBytes: z.number().nonnegative().nullable(),
  committedBytes: z.number().nonnegative(),
  awaitingReview: z.number().int().nonnegative(),
  awaitingReviewCap: z.number().int().positive(),
});

const ReencodeSchema = ReencodeSettingsSchema.extend({
  id: z.string().uuid(),
  mediaId: z.string().uuid(),
  libraryId: z.string().uuid(),
  title: z.string(),
  seriesTitle: z.string().nullable(),
  state: ReencodeStateSchema,
  origin: ReencodeOriginSchema.default('admin'),
  durationSeconds: z.number().positive(),
  originalSizeBytes: z.number().nonnegative(),
  estimatedBytes: z.number().nonnegative().nullable(),
  producedBytes: z.number().nonnegative().nullable(),
  progress: z.number().min(0).max(1),
  bytesPerSecond: z.number().int().nonnegative().nullable(),
  failure: SaidSchema.nullable(),
  hasSample: z.boolean().default(false),
  askedAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  encodedAt: z.string().datetime().nullable(),
  reviewedAt: z.string().datetime().nullable(),
});

const ReencodeListSchema = z.object({ reencodes: z.array(ReencodeSchema) });

const ReencodeStartedSchema = z.object({
  started: z.array(ReencodeSchema),
  refused: z.array(z.object({ mediaId: z.string().uuid(), refusal: ReencodeRefusalSchema })),
});

const REVIEWABLE_SIDES = ['original', 'encode'] as const;

const ReviewSideSchema = z.enum(REVIEWABLE_SIDES);

type ReencodeMode = z.infer<typeof ReencodeModeSchema>;
type ReencodeState = z.infer<typeof ReencodeStateSchema>;
type ReencodeCodec = z.infer<typeof ReencodeCodecSchema>;
type ReencodeContainer = z.infer<typeof ReencodeContainerSchema>;
type ReencodePlacement = z.infer<typeof ReencodePlacementSchema>;
type ReencodeOrigin = z.infer<typeof ReencodeOriginSchema>;
type ReencodeRefusal = z.infer<typeof ReencodeRefusalSchema>;
type ReencodeSettings = z.infer<typeof ReencodeSettingsSchema>;
type ReencodeCandidate = z.infer<typeof ReencodeCandidateSchema>;
type ReencodeEstimate = z.infer<typeof ReencodeEstimateSchema>;
type Reencode = z.infer<typeof ReencodeSchema>;
type ReencodeStarted = z.infer<typeof ReencodeStartedSchema>;
type ReviewSide = z.infer<typeof ReviewSideSchema>;

export type {
  Reencode,
  ReencodeCandidate,
  ReencodeCodec,
  ReencodeContainer,
  ReencodeEstimate,
  ReencodeMode,
  ReencodeOrigin,
  ReencodePlacement,
  ReencodeRefusal,
  ReencodeSettings,
  ReencodeStarted,
  ReencodeState,
  ReviewSide,
};

export {
  REENCODES_STILL_TO_BE_WRITTEN,
  REENCODES_UNDER_WAY,
  REENCODE_AUDIO_CHOICES,
  REENCODE_CODECS,
  REENCODE_CONTAINERS,
  REENCODE_MAX_BITRATE_KBPS,
  REENCODE_MODES,
  REENCODE_ORIGINS,
  REENCODE_PLACEMENTS,
  REENCODE_REFUSALS,
  REENCODE_STATES,
  REVIEWABLE_SIDES,
  ReencodeAudioSchema,
  ReencodeCandidateSchema,
  ReencodeCodecSchema,
  ReencodeContainerSchema,
  ReencodeEstimateSchema,
  ReencodeListSchema,
  ReencodeModeSchema,
  ReencodeOriginSchema,
  ReencodePlacementSchema,
  ReencodeRefusalCodeSchema,
  ReencodeRefusalSchema,
  ReencodeRequestSchema,
  ReencodeSchema,
  ReencodeSettingsSchema,
  ReencodeStartedSchema,
  ReencodeStateSchema,
  ReviewSideSchema,
};
