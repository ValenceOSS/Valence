import { z } from 'zod';
import { IndexerCategorySchema } from './Indexer';

const IndexerPrivacySchema = z.enum(['public', 'semi-private', 'private']);

const IndexerDefinitionSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  language: z.string(),
  privacy: IndexerPrivacySchema,
  protocol: z.enum(['torrent', 'usenet']),
  categories: z.array(z.string()),
});

const IndexerDefinitionSettingSchema = z.object({
  name: z.string(),
  kind: z.enum(['text', 'password', 'checkbox', 'select', 'info']),
  label: z.string(),
  detail: z.string().nullable(),
  default: z.union([z.string(), z.boolean()]).nullable(),
  options: z.array(z.object({ value: z.string(), label: z.string() })),
  isSecret: z.boolean(),
});

const IndexerDefinitionDetailSchema = IndexerDefinitionSummarySchema.extend({
  links: z.array(z.string()),
  settings: z.array(IndexerDefinitionSettingSchema),
  standardCategories: z.array(IndexerCategorySchema),
  hasCaptcha: z.boolean(),
  isBehindCloudflare: z.boolean(),
});

const IndexerCatalogueSchema = z.object({
  definitions: z.array(IndexerDefinitionSummarySchema),
  updatedAt: z.string().datetime().nullable(),
  source: z.string(),
  problem: z.string().nullable(),
});

type IndexerPrivacy = z.infer<typeof IndexerPrivacySchema>;
type IndexerDefinitionSummary = z.infer<typeof IndexerDefinitionSummarySchema>;
type IndexerDefinitionSetting = z.infer<typeof IndexerDefinitionSettingSchema>;
type IndexerDefinitionDetail = z.infer<typeof IndexerDefinitionDetailSchema>;
type IndexerCatalogue = z.infer<typeof IndexerCatalogueSchema>;

export type {
  IndexerCatalogue,
  IndexerDefinitionDetail,
  IndexerDefinitionSetting,
  IndexerDefinitionSummary,
  IndexerPrivacy,
};

export {
  IndexerCatalogueSchema,
  IndexerDefinitionDetailSchema,
  IndexerDefinitionSettingSchema,
  IndexerDefinitionSummarySchema,
  IndexerPrivacySchema,
};
