import { z } from 'zod';
import { JOB_RUN_SORTS, JOB_RUN_STATUSES } from '@ValenceContracts/schemas/JobRun';
import { LOG_SORTS } from '@ValenceContracts/schemas/Log';

const OBSERVABILITY_VIEWS = ['jobs', 'logs', 'health', 'run'] as const;

const RANGES = ['15m', '1h', '6h', '24h', '7d', 'all'] as const;

const ObservabilitySearchSchema = z.object({
  view: z.enum(OBSERVABILITY_VIEWS).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  range: z.enum(RANGES).optional().catch(undefined),
  from: z.number().int().nonnegative().optional().catch(undefined),
  until: z.number().int().nonnegative().optional().catch(undefined),
  sort: z.enum(LOG_SORTS).optional().catch(undefined),
  rq: z.string().optional().catch(undefined),
  rstatus: z.enum(JOB_RUN_STATUSES).optional().catch(undefined),
  rsort: z.enum(JOB_RUN_SORTS).optional().catch(undefined),
  rpage: z.number().int().min(2).optional().catch(undefined),
  hpage: z.number().int().min(2).optional().catch(undefined),
});

type ObservabilitySearch = z.infer<typeof ObservabilitySearchSchema>;

type ObservabilityView = (typeof OBSERVABILITY_VIEWS)[number];

export type { ObservabilitySearch, ObservabilityView };

export { ObservabilitySearchSchema, OBSERVABILITY_VIEWS };
