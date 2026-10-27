import { z } from 'zod';
import { HttpsUrlSchema } from '@ValenceSDK/manifest/HttpsUrlSchema';

const RemoteFileSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(500)
    .refine(
      (name) =>
        !name.startsWith('/') &&
        !name.includes('\\') &&
        name.split('/').every((part) => part !== '' && part !== '.' && part !== '..'),
      'A file name is a path inside the download, with no leading slash and no . or .. parts',
    ),
  sizeBytes: z.number().int().nonnegative(),
  url: HttpsUrlSchema,
});

type RemoteFile = z.infer<typeof RemoteFileSchema>;

export type { RemoteFile };

export { RemoteFileSchema };
