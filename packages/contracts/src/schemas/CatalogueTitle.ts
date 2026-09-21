import { z } from 'zod';
import { QueuedDownloadStateSchema } from './DownloadQueue';
import {
  CatalogueAlbumSchema,
  MediaRequestKindSchema,
  MediaRequestStateSchema,
} from './MediaRequest';

const CATALOGUE_STANDINGS = ['library', 'requested', 'askable'] as const;

const CatalogueStandingSchema = z.object({
  status: z.enum(CATALOGUE_STANDINGS),
  mediaId: z.string().nullable(),
  requestId: z.string().uuid().nullable(),
  requestState: MediaRequestStateSchema.nullable(),
});

const CatalogueTitleSchema = z.object({
  kind: MediaRequestKindSchema,
  id: z.string().min(1),
  title: z.string(),
  subtitle: z.string().nullable(),
  year: z.number().int().nullable(),
  overview: z.string().nullable(),
  posterUrl: z.string().nullable(),
  standing: CatalogueStandingSchema,
});

const CATALOGUE_LISTS = ['trending', 'popular', 'upcoming'] as const;

const CatalogueListSchema = z.enum(CATALOGUE_LISTS);

const CATALOGUE_BROWSE_KINDS = ['film', 'series'] as const;

const CatalogueBrowseKindSchema = z.enum(CATALOGUE_BROWSE_KINDS);

const CatalogueBrowseSchema = z.object({
  kind: CatalogueBrowseKindSchema,
  list: CatalogueListSchema,
  studio: z.string().nullable(),
});

const CatalogueShelfSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  titles: z.array(CatalogueTitleSchema),
  browse: CatalogueBrowseSchema.nullable(),
});

const CatalogueStudioSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  logoUrl: z.string().nullable(),
});

const CatalogueDiscoverySchema = z.object({
  shelves: z.array(CatalogueShelfSchema),
  studios: z.array(CatalogueStudioSchema),
});

const CataloguePageSchema = z.object({
  titles: z.array(CatalogueTitleSchema),
  page: z.number().int().positive(),
  hasMore: z.boolean(),
});

const CatalogueCreditSchema = z.object({
  name: z.string(),
  role: z.string().nullable(),
  photoUrl: z.string().nullable(),
});

const CatalogueTitleDetailSchema = CatalogueTitleSchema.extend({
  musicBrainzId: z.string().uuid().nullable(),
  backdropUrl: z.string().nullable(),
  genres: z.array(z.string()),
  runtimeMinutes: z.number().int().positive().nullable(),
  cast: z.array(CatalogueCreditSchema),
  albums: z.array(CatalogueAlbumSchema),
  trailerKey: z.string().nullable(),
});

const CATALOGUE_SEARCH_KINDS = ['film', 'series', 'artist', 'album'] as const;

const RequestProgressSchema = z.object({
  downloadId: z.string().uuid(),
  state: QueuedDownloadStateSchema,
  progress: z.number().min(0).max(1),
  sizeBytes: z.number().nonnegative().nullable(),
  doneBytes: z.number().nonnegative().nullable(),
  downloadBytesPerSecond: z.number().nonnegative().nullable(),
  secondsLeft: z.number().nonnegative().nullable(),
});

type CatalogueBrowse = z.infer<typeof CatalogueBrowseSchema>;
type CatalogueBrowseKind = z.infer<typeof CatalogueBrowseKindSchema>;
type CatalogueDiscovery = z.infer<typeof CatalogueDiscoverySchema>;
type CatalogueList = z.infer<typeof CatalogueListSchema>;
type CataloguePage = z.infer<typeof CataloguePageSchema>;
type CatalogueStanding = z.infer<typeof CatalogueStandingSchema>;
type CatalogueStudio = z.infer<typeof CatalogueStudioSchema>;
type CatalogueTitle = z.infer<typeof CatalogueTitleSchema>;
type CatalogueShelf = z.infer<typeof CatalogueShelfSchema>;
type CatalogueCredit = z.infer<typeof CatalogueCreditSchema>;
type CatalogueTitleDetail = z.infer<typeof CatalogueTitleDetailSchema>;
type RequestProgress = z.infer<typeof RequestProgressSchema>;

export type {
  CatalogueBrowse,
  CatalogueBrowseKind,
  CatalogueCredit,
  CatalogueDiscovery,
  CatalogueList,
  CataloguePage,
  CatalogueShelf,
  CatalogueStanding,
  CatalogueStudio,
  CatalogueTitle,
  CatalogueTitleDetail,
  RequestProgress,
};

export {
  CATALOGUE_BROWSE_KINDS,
  CATALOGUE_LISTS,
  CATALOGUE_SEARCH_KINDS,
  CATALOGUE_STANDINGS,
  CatalogueBrowseKindSchema,
  CatalogueBrowseSchema,
  CatalogueCreditSchema,
  CatalogueDiscoverySchema,
  CatalogueListSchema,
  CataloguePageSchema,
  CatalogueShelfSchema,
  CatalogueStandingSchema,
  CatalogueStudioSchema,
  CatalogueTitleDetailSchema,
  CatalogueTitleSchema,
  RequestProgressSchema,
};
