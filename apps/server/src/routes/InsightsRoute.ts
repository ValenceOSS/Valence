import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { StatisticsRangeSchema, StatisticsSchema } from '@ValenceContracts/schemas/Statistics';
import { LibraryHealthSchema } from '@ValenceContracts/schemas/LibraryHealth';
import { UpdateCheckSchema } from '@ValenceContracts/schemas/UpdateCheck';

const InsightsError = RefusalSchema.openapi('InsightsError');

const NOT_AN_ADMINISTRATOR = {
  description: 'This account may not see it',
  content: { 'application/json': { schema: InsightsError } },
} as const;

const statisticsRoute = createRoute({
  method: 'get',
  path: '/api/admin/statistics',
  tags: ['Admin'],
  summary: 'Read what was watched over a range, how it was delivered, and what arrived',
  request: {
    query: z.object({
      range: StatisticsRangeSchema.default('week'),
      zone: z.string().max(64).default('UTC'),
    }),
  },
  responses: {
    200: {
      description: 'The statistics, with days and hours in the zone asked for',
      content: { 'application/json': { schema: StatisticsSchema } },
    },
    403: NOT_AN_ADMINISTRATOR,
  },
});

const libraryHealthRoute = createRoute({
  method: 'get',
  path: '/api/admin/library-health',
  tags: ['Admin'],
  summary:
    'Read what is wrong in the films and series: unmatched, without artwork, twice, unreadable',
  responses: {
    200: {
      description: 'Each problem, how many there are and the first hundred',
      content: { 'application/json': { schema: LibraryHealthSchema } },
    },
    403: NOT_AN_ADMINISTRATOR,
  },
});

const updateCheckRoute = createRoute({
  method: 'get',
  path: '/api/admin/updates',
  tags: ['Admin'],
  summary: 'Read whether a newer release of Valence is out',
  request: {
    query: z.object({ now: z.enum(['true']).optional() }),
  },
  responses: {
    200: {
      description: 'This release, the newest, and what changed',
      content: { 'application/json': { schema: UpdateCheckSchema } },
    },
    403: NOT_AN_ADMINISTRATOR,
  },
});

export { libraryHealthRoute, statisticsRoute, updateCheckRoute };
