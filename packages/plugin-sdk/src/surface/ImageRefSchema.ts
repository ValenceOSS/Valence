import { z } from 'zod';
import { HttpsUrlSchema } from '@ValenceSDK/manifest/HttpsUrlSchema';

const ImageRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('asset'), name: z.string().regex(/^[a-z0-9-]+\.(png|jpg|webp)$/) }),
  z.object({ kind: z.literal('remote'), url: HttpsUrlSchema }),
  z.object({
    kind: z.literal('media'),
    mediaId: z.string().uuid(),
    art: z.enum(['poster', 'backdrop', 'cover']),
  }),
]);

type ImageRef = z.infer<typeof ImageRefSchema>;

export type { ImageRef };

export { ImageRefSchema };
