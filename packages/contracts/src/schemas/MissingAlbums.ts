import { z } from 'zod';
import { CatalogueTitleSchema } from '@ValenceContracts/schemas/CatalogueTitle';

const MissingAlbumSchema = z.object({
  key: z.string().min(1),
  title: z.string(),
  artist: z.string(),
  coverUrl: z.string().nullable(),
  songCount: z.number().int().positive(),
  isMatched: z.boolean(),
  found: CatalogueTitleSchema.nullable(),
});

const MissingAlbumsSchema = z.object({
  isMatching: z.boolean(),
  albums: z.array(MissingAlbumSchema),
});

type MissingAlbum = z.infer<typeof MissingAlbumSchema>;
type MissingAlbums = z.infer<typeof MissingAlbumsSchema>;

export type { MissingAlbum, MissingAlbums };

export { MissingAlbumSchema, MissingAlbumsSchema };
