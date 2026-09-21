import { z } from 'zod';
import {
  MusicQualitySchema,
  ParsedReleaseSchema,
  ReleaseSourceSchema,
  ResolutionSchema,
} from './ParsedRelease';
import type { ReleaseSource, Resolution } from './ParsedRelease';

const PROFILE_KINDS = ['video', 'music'] as const;

const ProfileKindSchema = z.enum(PROFILE_KINDS);

const RELEASE_WAITS = ['digital', 'physical'] as const;

const ReleaseWaitSchema = z.enum(RELEASE_WAITS);

const VIDEO_QUALITIES = [
  { source: 'remux', resolution: '2160p' },
  { source: 'bluray', resolution: '2160p' },
  { source: 'webdl', resolution: '2160p' },
  { source: 'webrip', resolution: '2160p' },
  { source: 'hdtv', resolution: '2160p' },
  { source: 'remux', resolution: '1080p' },
  { source: 'bluray', resolution: '1080p' },
  { source: 'webdl', resolution: '1080p' },
  { source: 'webrip', resolution: '1080p' },
  { source: 'hdtv', resolution: '1080p' },
  { source: 'bluray', resolution: '720p' },
  { source: 'webdl', resolution: '720p' },
  { source: 'webrip', resolution: '720p' },
  { source: 'hdtv', resolution: '720p' },
  { source: 'bluray', resolution: '576p' },
  { source: 'dvd', resolution: '576p' },
  { source: 'bluray', resolution: '480p' },
  { source: 'webdl', resolution: '480p' },
  { source: 'webrip', resolution: '480p' },
  { source: 'hdtv', resolution: '480p' },
  { source: 'dvd', resolution: '480p' },
] as const satisfies readonly { source: ReleaseSource; resolution: Resolution }[];

const QualitySizeSchema = z.object({
  source: ReleaseSourceSchema,
  resolution: ResolutionSchema,
  minMb: z.number().nonnegative().nullable(),
  maxMb: z.number().positive().nullable(),
});

const RECOMMENDED_QUALITY_SIZES: readonly z.infer<typeof QualitySizeSchema>[] = [
  { source: 'remux', resolution: '2160p', minMb: 11244, maxMb: null },
  { source: 'bluray', resolution: '2160p', minMb: 5676, maxMb: null },
  { source: 'webdl', resolution: '2160p', minMb: 1500, maxMb: null },
  { source: 'webrip', resolution: '2160p', minMb: 1500, maxMb: null },
  { source: 'hdtv', resolution: '2160p', minMb: 1500, maxMb: null },
  { source: 'remux', resolution: '1080p', minMb: 4146, maxMb: null },
  { source: 'bluray', resolution: '1080p', minMb: 3024, maxMb: null },
  { source: 'webdl', resolution: '1080p', minMb: 750, maxMb: null },
  { source: 'webrip', resolution: '1080p', minMb: 750, maxMb: null },
  { source: 'hdtv', resolution: '1080p', minMb: 900, maxMb: null },
  { source: 'bluray', resolution: '720p', minMb: 1026, maxMb: null },
  { source: 'webdl', resolution: '720p', minMb: 600, maxMb: null },
  { source: 'webrip', resolution: '720p', minMb: 600, maxMb: null },
  { source: 'hdtv', resolution: '720p', minMb: 600, maxMb: null },
];

const WordsSchema = z.array(z.string().trim().min(1).max(100)).max(50);

const HoldersSchema = z.array(z.string().min(1)).max(200);

const QualityProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: ProfileKindSchema,
  resolutions: z.array(ResolutionSchema),
  sources: z.array(ReleaseSourceSchema),
  musicQualities: z.array(MusicQualitySchema),
  smallestMb: z.number().nonnegative().nullable(),
  largestMb: z.number().positive().nullable(),
  sizes: z.array(QualitySizeSchema),
  preferredWords: z.array(z.string()),
  requiredWords: z.array(z.string()),
  bannedWords: z.array(z.string()),
  isUpgrading: z.boolean(),
  releaseWait: ReleaseWaitSchema,
  upgradeUntilResolution: ResolutionSchema.nullable(),
  upgradeUntilSource: ReleaseSourceSchema.nullable(),
  upgradeUntilMusicQuality: MusicQualitySchema.nullable(),
  libraryIds: z.array(z.string()),
  preferredLanguage: z.string().nullable(),
  isDefault: z.boolean(),
  roleIds: z.array(z.string()),
  accountIds: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const QualityProfileDraftSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: ProfileKindSchema,
  resolutions: z.array(ResolutionSchema).max(10).default(['1080p', '720p']),
  sources: z
    .array(ReleaseSourceSchema)
    .max(10)
    .default(['remux', 'bluray', 'webdl', 'webrip', 'hdtv']),
  musicQualities: z.array(MusicQualitySchema).max(10).default(['flac', 'mp3-320', 'mp3-v0']),
  smallestMb: z.number().nonnegative().nullable().default(null),
  largestMb: z.number().positive().nullable().default(null),
  sizes: z
    .array(QualitySizeSchema)
    .max(60)
    .default([...RECOMMENDED_QUALITY_SIZES]),
  preferredWords: WordsSchema.default([]),
  requiredWords: WordsSchema.default([]),
  bannedWords: WordsSchema.default([]),
  isUpgrading: z.boolean().default(false),
  releaseWait: ReleaseWaitSchema.default('digital'),
  upgradeUntilResolution: ResolutionSchema.nullable().default(null),
  upgradeUntilSource: ReleaseSourceSchema.nullable().default(null),
  upgradeUntilMusicQuality: MusicQualitySchema.nullable().default(null),
  libraryIds: z.array(z.string().min(1)).max(100).default([]),
  preferredLanguage: z.string().min(2).max(8).nullable().default(null),
  isDefault: z.boolean().default(false),
  roleIds: HoldersSchema.default([]),
  accountIds: HoldersSchema.default([]),
});

const QualityProfileChangeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  kind: ProfileKindSchema.optional(),
  resolutions: z.array(ResolutionSchema).max(10).optional(),
  sources: z.array(ReleaseSourceSchema).max(10).optional(),
  musicQualities: z.array(MusicQualitySchema).max(10).optional(),
  smallestMb: z.number().nonnegative().nullable().optional(),
  largestMb: z.number().positive().nullable().optional(),
  sizes: z.array(QualitySizeSchema).max(60).optional(),
  preferredWords: WordsSchema.optional(),
  requiredWords: WordsSchema.optional(),
  bannedWords: WordsSchema.optional(),
  isUpgrading: z.boolean().optional(),
  releaseWait: ReleaseWaitSchema.optional(),
  upgradeUntilResolution: ResolutionSchema.nullable().optional(),
  upgradeUntilSource: ReleaseSourceSchema.nullable().optional(),
  upgradeUntilMusicQuality: MusicQualitySchema.nullable().optional(),
  libraryIds: z.array(z.string().min(1)).max(100).optional(),
  preferredLanguage: z.string().min(2).max(8).nullable().optional(),
  isDefault: z.boolean().optional(),
  roleIds: HoldersSchema.optional(),
  accountIds: HoldersSchema.optional(),
});

const ProfileChoiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: ProfileKindSchema,
});

const ProfilesOnOfferSchema = z.object({
  choices: z.array(ProfileChoiceSchema),
  forcedId: z.string().uuid().nullable(),
});

const JudgementSchema = z.object({
  releaseId: z.string(),
  parsed: ParsedReleaseSchema,
  score: z.number(),
  isRejected: z.boolean(),
  rejections: z.array(z.string()),
  reasons: z.array(z.string()),
});

type ProfileKind = (typeof PROFILE_KINDS)[number];
type ReleaseWait = (typeof RELEASE_WAITS)[number];
type ProfileChoice = z.infer<typeof ProfileChoiceSchema>;
type ProfilesOnOffer = z.infer<typeof ProfilesOnOfferSchema>;
type QualitySize = z.infer<typeof QualitySizeSchema>;
type QualityProfile = z.infer<typeof QualityProfileSchema>;
type QualityProfileDraft = z.input<typeof QualityProfileDraftSchema>;
type QualityProfileChange = z.input<typeof QualityProfileChangeSchema>;
type Judgement = z.infer<typeof JudgementSchema>;

export type {
  Judgement,
  ProfileChoice,
  ProfileKind,
  ProfilesOnOffer,
  QualityProfile,
  QualityProfileChange,
  QualityProfileDraft,
  QualitySize,
  ReleaseWait,
};

export {
  PROFILE_KINDS,
  RECOMMENDED_QUALITY_SIZES,
  RELEASE_WAITS,
  VIDEO_QUALITIES,
  JudgementSchema,
  ProfileChoiceSchema,
  ProfileKindSchema,
  ProfilesOnOfferSchema,
  QualityProfileChangeSchema,
  QualityProfileDraftSchema,
  QualityProfileSchema,
  QualitySizeSchema,
  ReleaseWaitSchema,
};
