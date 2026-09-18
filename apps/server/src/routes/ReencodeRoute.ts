import { createRoute, z } from '@hono/zod-openapi';
import {
  ReencodeEstimateSchema,
  ReencodeListSchema,
  ReencodeRequestSchema,
  ReencodeSettingsSchema,
  ReencodeStartedSchema,
  ReviewSideSchema,
} from '@ValenceContracts/schemas/Reencode';
import { RenditionListSchema } from '@ValenceContracts/schemas/Rendition';

const ReencodeError = z.object({ error: z.string() }).openapi('ReencodeError');

const ReencodeDone = z.object({ done: z.boolean() }).openapi('ReencodeDone');

const Estimate = ReencodeEstimateSchema.openapi('ReencodeEstimate');

const Started = ReencodeStartedSchema.openapi('ReencodeStarted');

const List = ReencodeListSchema.openapi('ReencodeList');

const Renditions = RenditionListSchema.openapi('RenditionList');

const EstimateRequest = ReencodeSettingsSchema.extend({
  mediaIds: z.array(z.string().uuid()).max(500),
}).openapi('ReencodeEstimateRequest');

const identified = { params: z.object({ id: z.string().uuid() }) };

const refused = {
  403: {
    description: 'Re-encoding is for administrators who hold the permission for it',
    content: { 'application/json': { schema: ReencodeError } },
  },
};

const missing = {
  404: {
    description: 'No such re-encode',
    content: { 'application/json': { schema: ReencodeError } },
  },
};

const estimateReencodeRoute = createRoute({
  method: 'post',
  path: '/api/reencodes/estimate',
  tags: ['Re-encoding'],
  summary: 'Weigh what re-encoding a set of files would cost, and what it would free',
  request: { body: { content: { 'application/json': { schema: EstimateRequest } } } },
  responses: {
    200: {
      description: 'What is held now, what would be held after, and what would be refused',
      content: { 'application/json': { schema: Estimate } },
    },
    ...refused,
  },
});

const startReencodeRoute = createRoute({
  method: 'post',
  path: '/api/reencodes',
  tags: ['Re-encoding'],
  summary: 'Queue a set of files to be re-encoded',
  request: { body: { content: { 'application/json': { schema: ReencodeRequestSchema } } } },
  responses: {
    202: {
      description: 'What was taken on, and what was turned away and why',
      content: { 'application/json': { schema: Started } },
    },
    ...refused,
  },
});

const listReencodesRoute = createRoute({
  method: 'get',
  path: '/api/reencodes',
  tags: ['Re-encoding'],
  summary: 'List every re-encode, including those waiting to be judged',
  responses: {
    200: {
      description: 'Every re-encode',
      content: { 'application/json': { schema: List } },
    },
    ...refused,
  },
});

const cancelReencodeRoute = createRoute({
  method: 'delete',
  path: '/api/reencodes/{id}',
  tags: ['Re-encoding'],
  summary: 'Stop a re-encode that has not finished',
  request: identified,
  responses: {
    200: {
      description: 'It was stopped',
      content: { 'application/json': { schema: ReencodeDone } },
    },
    ...refused,
    ...missing,
  },
});

const confirmReencodeRoute = createRoute({
  method: 'post',
  path: '/api/reencodes/{id}/confirm',
  tags: ['Re-encoding'],
  summary: 'Accept a finished encode and dispose of the original it replaced',
  request: identified,
  responses: {
    200: {
      description: 'The original has been disposed of',
      content: { 'application/json': { schema: ReencodeDone } },
    },
    ...refused,
    ...missing,
  },
});

const rejectReencodeRoute = createRoute({
  method: 'post',
  path: '/api/reencodes/{id}/reject',
  tags: ['Re-encoding'],
  summary: 'Refuse a finished encode and put the original back',
  request: identified,
  responses: {
    200: {
      description: 'The original is back where it was',
      content: { 'application/json': { schema: ReencodeDone } },
    },
    ...refused,
    ...missing,
  },
});

const sampleReencodeRoute = createRoute({
  method: 'post',
  path: '/api/reencodes/{id}/sample',
  tags: ['Re-encoding'],
  summary: 'Encode a minute at these settings, to be watched before committing to the whole film',
  request: identified,
  responses: {
    202: {
      description: 'The sample is being made',
      content: { 'application/json': { schema: ReencodeDone } },
    },
    ...refused,
    ...missing,
  },
});

const reviewFrameRoute = createRoute({
  method: 'get',
  path: '/api/reencodes/{id}/frame',
  tags: ['Re-encoding'],
  summary: 'Read one frame of either file, so the two can be compared at the same moment',
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      side: ReviewSideSchema.default('encode'),
      seconds: z.coerce.number().int().nonnegative().default(0),
      width: z.coerce.number().int().positive().max(3840).default(1280),
    }),
  },
  responses: {
    200: { description: 'The frame' },
    ...refused,
    404: {
      description: 'No such re-encode, or no frame there',
      content: { 'application/json': { schema: ReencodeError } },
    },
  },
});

const listRenditionsRoute = createRoute({
  method: 'get',
  path: '/api/media/{mediaId}/renditions',
  tags: ['Re-encoding'],
  summary: 'List the encodes kept alongside an item',
  request: { params: z.object({ mediaId: z.string().uuid() }) },
  responses: {
    200: {
      description: 'What is kept beside it',
      content: { 'application/json': { schema: Renditions } },
    },
    ...refused,
  },
});

const removeRenditionRoute = createRoute({
  method: 'delete',
  path: '/api/renditions/{id}',
  tags: ['Re-encoding'],
  summary: 'Remove an encode kept alongside an item',
  request: identified,
  responses: {
    200: {
      description: 'It has been removed',
      content: { 'application/json': { schema: ReencodeDone } },
    },
    ...refused,
    404: {
      description: 'No such rendition',
      content: { 'application/json': { schema: ReencodeError } },
    },
  },
});

export {
  cancelReencodeRoute,
  confirmReencodeRoute,
  estimateReencodeRoute,
  listReencodesRoute,
  listRenditionsRoute,
  rejectReencodeRoute,
  removeRenditionRoute,
  reviewFrameRoute,
  sampleReencodeRoute,
  startReencodeRoute,
};
