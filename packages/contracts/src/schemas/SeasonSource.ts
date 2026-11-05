import { z } from 'zod';

const SeasonSourceSchema = z.object({
  externalId: z.string(),
  externalSeason: z.number().int(),
  title: z.string(),
  year: z.number().int().nullable(),
});

const CatalogueShowIdSchema = z.string().regex(/^\d{1,12}$/u);

const SeasonSourceStateSchema = z.object({
  source: SeasonSourceSchema.nullable(),
  canChoose: z.boolean(),
});

const ChooseSeasonSourceSchema = z.object({
  source: z
    .object({
      externalId: CatalogueShowIdSchema,
      externalSeason: z.number().int().min(0).max(9999),
    })
    .nullable(),
});

const CatalogueSeasonsSchema = z.object({
  seasons: z.array(
    z.object({
      seasonNumber: z.number().int(),
      name: z.string().nullable(),
      episodeCount: z.number().int(),
      airDate: z.string().nullable(),
    }),
  ),
});

type SeasonSource = z.infer<typeof SeasonSourceSchema>;
type SeasonSourceState = z.infer<typeof SeasonSourceStateSchema>;
type ChooseSeasonSource = z.infer<typeof ChooseSeasonSourceSchema>;
type CatalogueSeasons = z.infer<typeof CatalogueSeasonsSchema>;

export type { CatalogueSeasons, ChooseSeasonSource, SeasonSource, SeasonSourceState };

export {
  CatalogueSeasonsSchema,
  CatalogueShowIdSchema,
  ChooseSeasonSourceSchema,
  SeasonSourceSchema,
  SeasonSourceStateSchema,
};
