import { z } from 'zod';

const CataloguePersonSchema = z.object({
  personId: z.number().int().positive(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  knownFor: z.string().nullable(),
});

const CataloguePeopleSchema = z.object({ people: z.array(CataloguePersonSchema) });

type CataloguePerson = z.infer<typeof CataloguePersonSchema>;

export type { CataloguePerson };

export { CataloguePeopleSchema, CataloguePersonSchema };
