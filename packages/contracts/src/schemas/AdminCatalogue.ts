import { z } from 'zod';
import { MediaRequestKindSchema, RequesterSchema } from './MediaRequest';

const CATALOGUE_TABS = ['films', 'shows', 'music', 'books'] as const;

const CatalogueTabSchema = z.enum(CATALOGUE_TABS);

const TITLE_STATUSES = [
  'library',
  'downloading',
  'missing',
  'toApprove',
  'failed',
  'notFollowed',
] as const;

const TitleStatusSchema = z.enum(TITLE_STATUSES);

const CATALOGUE_ART_KINDS = ['media', 'album', 'artist', 'book'] as const;

const CatalogueArtSchema = z.object({
  kind: z.enum(CATALOGUE_ART_KINDS),
  id: z.string().min(1),
});

const CatalogueEntrySchema = z.object({
  key: z.string().min(1),
  tab: CatalogueTabSchema,
  kind: MediaRequestKindSchema,
  catalogueId: z.string().nullable(),
  title: z.string(),
  subtitle: z.string().nullable(),
  year: z.number().int().nullable(),
  art: CatalogueArtSchema.nullable(),
  posterUrl: z.string().nullable(),
  status: TitleStatusSchema,
  held: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  isAudio: z.boolean().default(false),
  requestId: z.string().uuid().nullable(),
  mediaId: z.string().nullable(),
  libraryId: z.string().nullable(),
  askedBy: RequesterSchema.nullable(),
  addedAt: z.string().datetime().nullable(),
});

const CatalogueListingSchema = z.object({ entries: z.array(CatalogueEntrySchema) });

const TitleFileSchema = z.object({
  mediaId: z.string().min(1),
  path: z.string().min(1),
  season: z.number().int().nonnegative().nullable(),
  episode: z.number().int().nonnegative().nullable(),
  lastEpisode: z.number().int().nonnegative().nullable(),
  sizeBytes: z.number().nonnegative().nullable(),
  width: z.number().int().nonnegative().nullable().optional(),
  height: z.number().int().nonnegative().nullable(),
  videoCodec: z.string().nullable(),
  addedAt: z.string().datetime().nullable(),
});

const TitleFilesSchema = z.object({
  folder: z.string().nullable(),
  files: z.array(TitleFileSchema),
});

const TitleFilesQuerySchema = z.object({
  kind: MediaRequestKindSchema,
  catalogueId: z.string().min(1),
});

type CatalogueTab = (typeof CATALOGUE_TABS)[number];
type TitleStatus = (typeof TITLE_STATUSES)[number];
type CatalogueArt = z.infer<typeof CatalogueArtSchema>;
type CatalogueEntry = z.infer<typeof CatalogueEntrySchema>;
type CatalogueListing = z.infer<typeof CatalogueListingSchema>;
type TitleFile = z.infer<typeof TitleFileSchema>;
type TitleFiles = z.infer<typeof TitleFilesSchema>;

export type {
  CatalogueArt,
  CatalogueEntry,
  CatalogueListing,
  CatalogueTab,
  TitleFile,
  TitleFiles,
  TitleStatus,
};

export {
  CATALOGUE_ART_KINDS,
  CATALOGUE_TABS,
  TITLE_STATUSES,
  CatalogueArtSchema,
  CatalogueEntrySchema,
  CatalogueListingSchema,
  CatalogueTabSchema,
  TitleFileSchema,
  TitleFilesQuerySchema,
  TitleFilesSchema,
  TitleStatusSchema,
};
