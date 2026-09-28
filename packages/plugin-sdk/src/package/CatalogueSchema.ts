import { z } from 'zod';
import { HttpsUrlSchema } from '@ValenceSDK/manifest/HttpsUrlSchema';
import { PermissionSchema } from '@ValenceSDK/manifest/PermissionSchema';

const CatalogueEntrySchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{2,63}$/),
  name: z.string().min(1).max(60),
  description: z.string().min(1).max(500),
  author: z.string().min(1).max(80),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/),
  apiVersion: z.string().max(20),
  kinds: z.array(z.enum(['extension', 'theme'])).min(1),
  permissions: z.array(PermissionSchema),
  packageUrl: HttpsUrlSchema,
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  signature: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/),
  keyId: z.string().regex(/^[a-z0-9-]{1,40}$/),
  iconUrl: HttpsUrlSchema.optional(),
  sourceUrl: HttpsUrlSchema,
  publishedAt: z.iso.datetime(),
});

const CatalogueSchema = z.object({
  format: z.literal(1),
  generatedAt: z.iso.datetime(),
  plugins: z.array(CatalogueEntrySchema).max(1000),
});

type Catalogue = z.infer<typeof CatalogueSchema>;

type CatalogueEntry = z.infer<typeof CatalogueEntrySchema>;

export type { Catalogue, CatalogueEntry };

export { CatalogueSchema };
