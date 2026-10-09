import { z } from 'zod';

const SubtitleSettingsSchema = z.object({
  openSubtitlesKey: z.string().default(''),
  openSubtitlesUsername: z.string().default(''),
  openSubtitlesPassword: z.string().default(''),
  subdlKey: z.string().default(''),
  languages: z.array(z.string().min(2).max(3)).default(['en']),
  isAutomatic: z.boolean().default(false),
  filmMinimumScore: z.number().int().min(0).max(100).default(60),
  episodeMinimumScore: z.number().int().min(0).max(100).default(50),
});

const SUBTITLE_DEFAULTS = SubtitleSettingsSchema.parse({});

type SubtitleSettings = z.infer<typeof SubtitleSettingsSchema>;

export type { SubtitleSettings };

export { SUBTITLE_DEFAULTS, SubtitleSettingsSchema };
