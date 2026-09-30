import { z } from 'zod';

const GiveUpRulesSchema = z.object({
  metadataMinutes: z.number().int().min(1).max(10_080).nullable(),
  stalledHours: z.number().int().min(1).max(720).nullable(),
  slowDays: z.number().int().min(1).max(90).nullable(),
  refusesUnknownFiles: z.boolean(),
});

type GiveUpRules = z.infer<typeof GiveUpRulesSchema>;

const GIVE_UP_DEFAULTS: GiveUpRules = {
  metadataMinutes: 60,
  stalledHours: 6,
  slowDays: 7,
  refusesUnknownFiles: true,
};

export type { GiveUpRules };

export { GIVE_UP_DEFAULTS, GiveUpRulesSchema };
