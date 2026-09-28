import { z } from 'zod';
import { ReleaseTypeSchema } from '@ValenceContracts/schemas/MediaRequest';

const MissingAlbumSchema = z.object({
  releaseGroupId: z.string().uuid(),
  title: z.string(),
  type: ReleaseTypeSchema.nullable(),
  year: z.number().int().nullable(),
  coverUrl: z.string(),
});

const ArtistStorySchema = z.object({
  bio: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  missing: z.array(MissingAlbumSchema),
});

type ArtistStory = z.infer<typeof ArtistStorySchema>;

type MissingAlbum = z.infer<typeof MissingAlbumSchema>;

export type { ArtistStory, MissingAlbum };

export { ArtistStorySchema, MissingAlbumSchema };
