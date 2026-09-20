import { createRoute, z } from '@hono/zod-openapi';
import {
  RequestsAvailabilitySchema,
  RequestsOverviewSchema,
} from '@ValenceContracts/schemas/Requests';

const RequestsError = z.object({ error: z.string() }).openapi('RequestsError');

const RequestsAvailabilityAnswer = RequestsAvailabilitySchema.openapi('RequestsAvailability');

const RequestsOverviewAnswer = RequestsOverviewSchema.openapi('RequestsOverview');

const requestsAvailabilityRoute = createRoute({
  method: 'get',
  path: '/api/requests/availability',
  tags: ['Requests'],
  summary: 'Say whether this server takes requests at all',
  responses: {
    200: {
      description: 'Whether the requests service is set up',
      content: { 'application/json': { schema: RequestsAvailabilityAnswer } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: RequestsError } },
    },
  },
});

const adminRequestsOverviewRoute = createRoute({
  method: 'get',
  path: '/api/admin/requests',
  tags: ['Admin'],
  summary: 'Read what the server last heard from the requests service',
  responses: {
    200: {
      description: 'Where the service is, whether it answered, and how its VPN is',
      content: { 'application/json': { schema: RequestsOverviewAnswer } },
    },
    403: {
      description: 'Not allowed to manage requesting',
      content: { 'application/json': { schema: RequestsError } },
    },
    404: {
      description: 'Requesting is off',
      content: { 'application/json': { schema: RequestsError } },
    },
  },
});

const adminCheckRequestsRoute = createRoute({
  method: 'post',
  path: '/api/admin/requests/check',
  tags: ['Admin'],
  summary: 'Ask the requests service how it is, now',
  responses: {
    200: {
      description: 'What it said',
      content: { 'application/json': { schema: RequestsOverviewAnswer } },
    },
    403: {
      description: 'Not allowed to manage requesting',
      content: { 'application/json': { schema: RequestsError } },
    },
    404: {
      description: 'Requesting is off',
      content: { 'application/json': { schema: RequestsError } },
    },
  },
});

export { adminCheckRequestsRoute, adminRequestsOverviewRoute, requestsAvailabilityRoute };
