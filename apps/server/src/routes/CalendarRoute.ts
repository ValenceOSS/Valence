import { createRoute } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  ReleaseCalendarQuerySchema,
  ReleaseCalendarSchema,
} from '@ValenceContracts/schemas/ReleaseCalendar';

const CalendarRefusal = RefusalSchema.openapi('CalendarRefusal');

const releaseCalendarRoute = createRoute({
  method: 'get',
  path: '/api/calendar',
  tags: ['Calendar'],
  summary:
    'Read what is released between two days: episodes of shows in the library, and requested films and episodes',
  request: { query: ReleaseCalendarQuerySchema },
  responses: {
    200: {
      description: 'Every release in those days, in the order they fall',
      content: { 'application/json': { schema: ReleaseCalendarSchema } },
    },
    400: {
      description: 'The days asked about are not a span the calendar shows',
      content: { 'application/json': { schema: CalendarRefusal } },
    },
    401: {
      description: 'Not signed in',
      content: { 'application/json': { schema: CalendarRefusal } },
    },
  },
});

export { releaseCalendarRoute };
