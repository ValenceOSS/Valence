import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  PreTranscodingSettingsSchema,
  PreTranscodingStatusSchema,
} from '@ValenceContracts/schemas/PreTranscoding';

const PreTranscodingError = RefusalSchema.openapi('PreTranscodingError');

const Status = PreTranscodingStatusSchema.openapi('PreTranscodingStatus');

const Settings = PreTranscodingSettingsSchema.openapi('PreTranscodingSettings');

const Ran = z.object({ queued: z.boolean() }).openapi('PreTranscodingRan');

const refused = {
  403: {
    description: 'Pre-transcoding is for administrators who may re-encode media',
    content: { 'application/json': { schema: PreTranscodingError } },
  },
};

const readPreTranscodingRoute = createRoute({
  method: 'get',
  path: '/api/pre-transcoding',
  tags: ['Re-encoding'],
  summary: 'Read the pre-transcoding settings, and how far it has got',
  responses: {
    200: {
      description: 'The settings, the copies made and still needed, and the one under way',
      content: { 'application/json': { schema: Status } },
    },
    ...refused,
  },
});

const savePreTranscodingRoute = createRoute({
  method: 'put',
  path: '/api/pre-transcoding',
  tags: ['Re-encoding'],
  summary: 'Change the pre-transcoding settings',
  request: { body: { content: { 'application/json': { schema: Settings } } } },
  responses: {
    200: {
      description: 'The settings as saved, and how far it has got',
      content: { 'application/json': { schema: Status } },
    },
    ...refused,
  },
});

const runPreTranscodingRoute = createRoute({
  method: 'post',
  path: '/api/pre-transcoding/run',
  tags: ['Re-encoding'],
  summary: 'Make the next copy now, whatever the hour',
  responses: {
    202: {
      description: 'Whether a copy is now being made',
      content: { 'application/json': { schema: Ran } },
    },
    ...refused,
  },
});

export { readPreTranscodingRoute, runPreTranscodingRoute, savePreTranscodingRoute };
