import { z } from 'zod';

const SUBTITLE_SOURCES = ['opensubtitles', 'subdl'] as const;

const SubtitleSourceSchema = z.enum(SUBTITLE_SOURCES);

const SubtitleSetupSchema = z.object({
  hasOpenSubtitlesKey: z.boolean(),
  openSubtitlesUsername: z.string(),
  hasOpenSubtitlesPassword: z.boolean(),
  hasSubdlKey: z.boolean(),
  languages: z.array(z.string()),
});

const SubtitleSetupChangeSchema = z.object({
  openSubtitlesKey: z.string().trim().max(200).default(''),
  openSubtitlesUsername: z.string().trim().max(200),
  openSubtitlesPassword: z.string().max(1024).default(''),
  subdlKey: z.string().trim().max(200).default(''),
  languages: z.array(z.string().min(2).max(3)).max(20),
  forget: z.array(z.enum(['openSubtitlesKey', 'openSubtitlesPassword', 'subdlKey'])).default([]),
});

const FoundSubtitleSchema = z.object({
  source: SubtitleSourceSchema,
  id: z.string().min(1),
  name: z.string(),
  language: z.string(),
  isExactMatch: z.boolean(),
  isHearingImpaired: z.boolean(),
  downloads: z.number().int().nonnegative().nullable(),
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

export type {
  FetchedSubtitle,
  FoundSubtitle,
  FoundSubtitles,
  SubtitleChoice,
  SubtitleSetup,
  SubtitleSetupChange,
  SubtitleSource,
};

export {
  FetchedSubtitleSchema,
  FoundSubtitleSchema,
  FoundSubtitlesSchema,
  SUBTITLE_SOURCES,
  SubtitleChoiceSchema,
  SubtitleSetupChangeSchema,
  SubtitleSetupSchema,
  SubtitleSourceSchema,
};
