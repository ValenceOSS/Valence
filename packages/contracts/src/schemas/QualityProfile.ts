import { z } from 'zod';
import {
  MusicQualitySchema,
  ParsedReleaseSchema,
  ReleaseSourceSchema,
  ResolutionSchema,
} from './ParsedRelease';

const PROFILE_KINDS = ['video', 'music'] as const;

const ProfileKindSchema = z.enum(PROFILE_KINDS);

const WordsSchema = z.array(z.string().trim().min(1).max(100)).max(50);

const QualityProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: ProfileKindSchema,
  resolutions: z.array(ResolutionSchema),
  sources: z.array(ReleaseSourceSchema),
  musicQualities: z.array(MusicQualitySchema),
  smallestMb: z.number().nonnegative().nullable(),
  largestMb: z.number().positive().nullable(),
  preferredWords: z.array(z.string()),
  requiredWords: z.array(z.string()),
  bannedWords: z.array(z.string()),
  isUpgrading: z.boolean(),
  upgradeUntilResolution: ResolutionSchema.nullable(),
  upgradeUntilSource: ReleaseSourceSchema.nullable(),
  upgradeUntilMusicQuality: MusicQualitySchema.nullable(),
  libraryIds: z.array(z.string()),
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
  preferredWords: WordsSchema.default([]),
  requiredWords: WordsSchema.default([]),
  bannedWords: WordsSchema.default([]),
  isUpgrading: z.boolean().default(false),
  upgradeUntilResolution: ResolutionSchema.nullable().default(null),
  upgradeUntilSource: ReleaseSourceSchema.nullable().default(null),
  upgradeUntilMusicQuality: MusicQualitySchema.nullable().default(null),
  libraryIds: z.array(z.string().min(1)).max(100).default([]),
});

const QualityProfileChangeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  kind: ProfileKindSchema.optional(),
  resolutions: z.array(ResolutionSchema).max(10).optional(),
  sources: z.array(ReleaseSourceSchema).max(10).optional(),
  musicQualities: z.array(MusicQualitySchema).max(10).optional(),
  smallestMb: z.number().nonnegative().nullable().optional(),
  largestMb: z.number().positive().nullable().optional(),
  preferredWords: WordsSchema.optional(),
  requiredWords: WordsSchema.optional(),
  bannedWords: WordsSchema.optional(),
  isUpgrading: z.boolean().optional(),
  upgradeUntilResolution: ResolutionSchema.nullable().optional(),
  upgradeUntilSource: ReleaseSourceSchema.nullable().optional(),
  upgradeUntilMusicQuality: MusicQualitySchema.nullable().optional(),
  libraryIds: z.array(z.string().min(1)).max(100).optional(),
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
type QualityProfile = z.infer<typeof QualityProfileSchema>;
type QualityProfileDraft = z.input<typeof QualityProfileDraftSchema>;
type QualityProfileChange = z.input<typeof QualityProfileChangeSchema>;
type Judgement = z.infer<typeof JudgementSchema>;

export type { Judgement, ProfileKind, QualityProfile, QualityProfileChange, QualityProfileDraft };

export {
  PROFILE_KINDS,
  JudgementSchema,
  ProfileKindSchema,
  QualityProfileChangeSchema,
  QualityProfileDraftSchema,
  QualityProfileSchema,
};
