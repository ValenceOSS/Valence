import { z } from 'zod';
import { CatalogueEntrySchema } from '@ValenceContracts/schemas/AdminCatalogue';
import { BookSchema } from '@ValenceContracts/schemas/Book';
import { LibraryHealthSchema } from '@ValenceContracts/schemas/LibraryHealth';
import { LibrarySchema, MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { MediaRequestSchema } from '@ValenceContracts/schemas/MediaRequest';
import { MusicAlbumSchema } from '@ValenceContracts/schemas/Music';
import { PreTranscodingStatusSchema } from '@ValenceContracts/schemas/PreTranscoding';
import { ReencodeSchema } from '@ValenceContracts/schemas/Reencode';
import { StatisticsSchema } from '@ValenceContracts/schemas/Statistics';

type KeptQuery = {
  key: readonly string[];
  isExact: boolean;
  schema: z.ZodType;
};

const KEPT_QUERIES: readonly KeptQuery[] = [
  { key: ['admin', 'everyFile'], isExact: false, schema: z.array(MediaSummarySchema) },
  { key: ['admin', 'mediaPaths'], isExact: false, schema: z.record(z.string(), z.string()) },
  { key: ['admin', 'albums'], isExact: true, schema: z.array(MusicAlbumSchema) },
  { key: ['admin', 'books'], isExact: false, schema: z.array(BookSchema) },
  { key: ['admin', 'libraryHealth'], isExact: true, schema: LibraryHealthSchema },
  { key: ['admin', 'statistics'], isExact: false, schema: StatisticsSchema },
  { key: ['admin', 'reencodes'], isExact: true, schema: z.array(ReencodeSchema) },
  { key: ['admin', 'preTranscoding'], isExact: true, schema: PreTranscodingStatusSchema },
  { key: ['library', 'all'], isExact: true, schema: z.array(LibrarySchema) },
  { key: ['requests', 'catalogue'], isExact: true, schema: z.array(CatalogueEntrySchema) },
  { key: ['requests', 'media'], isExact: true, schema: z.array(MediaRequestSchema) },
];

export type { KeptQuery };
export { KEPT_QUERIES };
