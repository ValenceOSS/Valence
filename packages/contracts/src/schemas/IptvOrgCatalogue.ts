import { z } from 'zod';

const IptvOrgCatalogueSchema = z.object({
  countries: z.array(
    z.object({
      code: z.string().min(2).max(8),
      name: z.string(),
      flag: z.string().default(''),
      playlistUrl: z.string().url(),
    }),
  ),
  categories: z.array(
    z.object({ id: z.string().min(1).max(40), name: z.string(), playlistUrl: z.string().url() }),
  ),
});

type IptvOrgCatalogue = z.infer<typeof IptvOrgCatalogueSchema>;

export type { IptvOrgCatalogue };

export { IptvOrgCatalogueSchema };
