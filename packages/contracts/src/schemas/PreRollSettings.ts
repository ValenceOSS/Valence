import { z } from 'zod';

const PRE_ROLL_PLAYS_BEFORE = ['films', 'episodes', 'both'] as const;

const PreRollPlaysBeforeSchema = z.enum(PRE_ROLL_PLAYS_BEFORE);

const PreRollSettingsSchema = z.object({
  isOn: z.boolean().default(false),
  folder: z.string().default(''),
  playsBefore: PreRollPlaysBeforeSchema.default('films'),
});

const PRE_ROLL_DEFAULTS = PreRollSettingsSchema.parse({});

type PreRollSettings = z.infer<typeof PreRollSettingsSchema>;

type PreRollPlaysBefore = z.infer<typeof PreRollPlaysBeforeSchema>;

export type { PreRollPlaysBefore, PreRollSettings };

export {
  PRE_ROLL_DEFAULTS,
  PRE_ROLL_PLAYS_BEFORE,
  PreRollPlaysBeforeSchema,
  PreRollSettingsSchema,
};
