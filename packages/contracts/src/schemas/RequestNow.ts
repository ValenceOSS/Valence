import { z } from 'zod';
import { RequestProgressSchema } from './CatalogueTitle';

const INDEXER_ASKING_STATES = ['asking', 'answered', 'failed'] as const;

const IndexerAskingSchema = z.object({
  name: z.string(),
  state: z.enum(INDEXER_ASKING_STATES),
  found: z.number().int().nonnegative(),
});

const RequestSearchingSchema = z.object({
  startedAt: z.string().datetime(),
  indexers: z.array(IndexerAskingSchema),
});

const RequestNowSchema = z
  .discriminatedUnion('stage', [
    RequestSearchingSchema.extend({ stage: z.literal('search') }),
    RequestProgressSchema.extend({
      stage: z.literal('download'),
      title: z.string(),
      clientName: z.string(),
    }),
    z.object({ stage: z.literal('import'), title: z.string() }),
  ])
  .nullable();

type IndexerAsking = z.infer<typeof IndexerAskingSchema>;
type RequestSearching = z.infer<typeof RequestSearchingSchema>;
type RequestNow = z.infer<typeof RequestNowSchema>;

export { INDEXER_ASKING_STATES, IndexerAskingSchema, RequestNowSchema, RequestSearchingSchema };
export type { IndexerAsking, RequestNow, RequestSearching };
