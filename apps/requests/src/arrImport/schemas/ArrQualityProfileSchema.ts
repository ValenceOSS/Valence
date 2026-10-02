import { z } from 'zod';

const ArrQualitySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  source: z.string().nullish(),
  resolution: z.number().int().nullish(),
});

const ArrQualityLeafSchema = z.object({
  quality: ArrQualitySchema.nullish(),
  allowed: z.boolean().default(false),
});

const ArrQualityItemSchema = ArrQualityLeafSchema.extend({
  id: z.number().int().nullish(),
  name: z.string().nullish(),
  items: z.array(ArrQualityLeafSchema).default([]),
});

const ArrQualityProfileSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  upgradeAllowed: z.boolean().default(false),
  cutoff: z.number().int().nullish(),
  items: z.array(ArrQualityItemSchema).default([]),
  minFormatScore: z.number().int().default(0),
  formatItems: z
    .array(
      z.object({
        format: z.number().int(),
        name: z.string().nullish(),
        score: z.number().int().default(0),
      }),
    )
    .default([]),
});

type ArrQuality = z.infer<typeof ArrQualitySchema>;

type ArrQualityItem = z.infer<typeof ArrQualityItemSchema>;

type ArrQualityProfile = z.infer<typeof ArrQualityProfileSchema>;

export type { ArrQuality, ArrQualityItem, ArrQualityProfile };

export { ArrQualityProfileSchema };
