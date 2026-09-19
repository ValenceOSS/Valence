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

const CatalogueShelfSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  titles: z.array(CatalogueTitleSchema),
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

type CatalogueStanding = z.infer<typeof CatalogueStandingSchema>;
type CatalogueTitle = z.infer<typeof CatalogueTitleSchema>;
type CatalogueShelf = z.infer<typeof CatalogueShelfSchema>;
type CatalogueCredit = z.infer<typeof CatalogueCreditSchema>;
type CatalogueTitleDetail = z.infer<typeof CatalogueTitleDetailSchema>;
type RequestProgress = z.infer<typeof RequestProgressSchema>;

export type {
  CatalogueCredit,
  CatalogueShelf,
  CatalogueStanding,
  CatalogueTitle,
  CatalogueTitleDetail,
  RequestProgress,
};

export {
  CATALOGUE_SEARCH_KINDS,
  CATALOGUE_STANDINGS,
  CatalogueCreditSchema,
  CatalogueShelfSchema,
  CatalogueStandingSchema,
  CatalogueTitleDetailSchema,
  CatalogueTitleSchema,
  RequestProgressSchema,
};
