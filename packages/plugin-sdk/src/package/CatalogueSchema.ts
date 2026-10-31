import { z } from 'zod';
import { HttpsUrlSchema } from '@ValenceSDK/manifest/HttpsUrlSchema';
import { PermissionSchema } from '@ValenceSDK/manifest/PermissionSchema';

/**
 * Keeps what a schema can read and leaves out the rest, so a plugin or a version written for a newer
 * Valence never stops the others in the catalogue being read.
 *
 * @param each - What the catalogue lists.
 * @param schema - What each has to match.
 * @returns Those that match.
 */
const readable = <T>(each: readonly object[], schema: z.ZodType<T>): T[] =>
  each.flatMap((one) => {
    const read = schema.safeParse(one);

    return read.success ? [read.data] : [];
  });

const CatalogueVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/),
  apiVersion: z.string().max(20),
  permissions: z.array(PermissionSchema),
  packageUrl: HttpsUrlSchema,
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  signature: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/),
  keyId: z.string().regex(/^[a-z0-9-]{1,40}$/),
  publishedAt: z.iso.datetime(),
});

const CatalogueEntrySchema = CatalogueVersionSchema.extend({
  id: z.string().regex(/^[a-z][a-z0-9-]{2,63}$/),
  name: z.string().min(1).max(60),
  description: z.string().min(1).max(500),
  author: z.string().min(1).max(80),
  kinds: z.array(z.enum(['extension', 'theme'])).min(1),
  iconUrl: HttpsUrlSchema.optional(),
  sourceUrl: HttpsUrlSchema,
  earlier: z
    .array(z.looseObject({}))
    .max(20)
    .default([])
    .transform((versions) => readable(versions, CatalogueVersionSchema)),
});

const CatalogueSchema = z.object({
  format: z.literal(1),
  generatedAt: z.iso.datetime(),
  plugins: z
    .array(z.looseObject({}))
    .max(1000)
    .transform((entries) => readable(entries, CatalogueEntrySchema)),
});

type Catalogue = z.infer<typeof CatalogueSchema>;

type CatalogueEntry = z.infer<typeof CatalogueEntrySchema>;

type CatalogueVersion = z.infer<typeof CatalogueVersionSchema>;

export type { Catalogue, CatalogueEntry, CatalogueVersion };

export { CatalogueSchema };
