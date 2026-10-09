import { z } from 'zod';
import { SUBTITLE_SOURCES } from '@ValenceContracts/constants/SUBTITLE_SOURCES';

const SubtitleSourceSchema = z.enum(SUBTITLE_SOURCES);

const SubtitleSetupSchema = z.object({
  hasOpenSubtitlesKey: z.boolean(),
  openSubtitlesUsername: z.string(),
  hasOpenSubtitlesPassword: z.boolean(),
  hasSubdlKey: z.boolean(),
  languages: z.array(z.string()),
  isAutomatic: z.boolean(),
  filmMinimumScore: z.number().int(),
  episodeMinimumScore: z.number().int(),
});

const SubtitleSetupChangeSchema = z.object({
  openSubtitlesKey: z.string().trim().max(200).default(''),
  openSubtitlesUsername: z.string().trim().max(200),
  openSubtitlesPassword: z.string().max(1024).default(''),
  subdlKey: z.string().trim().max(200).default(''),
  languages: z.array(z.string().min(2).max(3)).max(20),
  isAutomatic: z.boolean().default(false),
  filmMinimumScore: z.number().int().min(0).max(100).default(60),
  episodeMinimumScore: z.number().int().min(0).max(100).default(50),
  forget: z.array(z.enum(['openSubtitlesKey', 'openSubtitlesPassword', 'subdlKey'])).default([]),
});

const SUBTITLE_REASONS = [
  'madeForThisFile',
  'sameRelease',
  'sameGroup',
  'sameSource',
  'sameResolution',
  'sameVideoCodec',
  'sameAudioCodec',
  'sameService',
  'sameEdition',
  'sameFrameRate',
  'differentFrameRate',
] as const;

const SubtitleReasonSchema = z.enum(SUBTITLE_REASONS);

const FoundSubtitleSchema = z.object({
  source: SubtitleSourceSchema,
  id: z.string().min(1),
  name: z.string(),
  language: z.string(),
  isExactMatch: z.boolean(),
  isHearingImpaired: z.boolean(),
  isMachineTranslated: z.boolean().default(false),
  frameRate: z.number().positive().nullable().default(null),
  downloads: z.number().int().nonnegative().nullable(),
  score: z.number().int().min(0).max(100).default(0),
  reasons: z.array(SubtitleReasonSchema).default([]),
});

const FoundSubtitlesSchema = z.object({
  subtitles: z.array(FoundSubtitleSchema),
  isSetUp: z.boolean(),
});

const SubtitleChoiceSchema = z.object({
  source: SubtitleSourceSchema,
  id: z.string().min(1),
  language: z.string().min(2).max(3),
});

const FetchedSubtitleSchema = z.object({ name: z.string() });

type FetchedSubtitle = z.infer<typeof FetchedSubtitleSchema>;
type FoundSubtitle = z.infer<typeof FoundSubtitleSchema>;
type FoundSubtitles = z.infer<typeof FoundSubtitlesSchema>;
type SubtitleChoice = z.infer<typeof SubtitleChoiceSchema>;
type SubtitleSetup = z.infer<typeof SubtitleSetupSchema>;
type SubtitleSetupChange = z.input<typeof SubtitleSetupChangeSchema>;
type SubtitleSource = z.infer<typeof SubtitleSourceSchema>;
type SubtitleReason = z.infer<typeof SubtitleReasonSchema>;

export type {
  FetchedSubtitle,
  FoundSubtitle,
  FoundSubtitles,
  SubtitleChoice,
  SubtitleSetup,
  SubtitleSetupChange,
  SubtitleReason,
  SubtitleSource,
};

export {
  FetchedSubtitleSchema,
  FoundSubtitleSchema,
  FoundSubtitlesSchema,
  SUBTITLE_REASONS,
  SubtitleChoiceSchema,
  SubtitleSetupChangeSchema,
  SubtitleSetupSchema,
  SubtitleReasonSchema,
  SubtitleSourceSchema,
};
