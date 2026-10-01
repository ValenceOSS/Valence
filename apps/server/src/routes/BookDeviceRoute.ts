import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  ReportNowListeningSchema,
  ReportNowReadingSchema,
} from '@ValenceContracts/schemas/BookRemote';

const BookDeviceError = RefusalSchema.openapi('BookDeviceError');

const json = <Schema extends z.ZodType>(description: string, schema: Schema) => ({
  description,
  content: { 'application/json': { schema } },
});

const refused = {
  401: json('Not signed in', BookDeviceError),
  404: json('That device is not connected', BookDeviceError),
};

const reportNowListeningRoute = createRoute({
  method: 'post',
  path: '/api/books/now-listening',
  tags: ['Books'],
  summary: 'Say which audiobook this device is playing, so an administrator can see it',
  request: {
    body: {
      content: { 'application/json': { schema: ReportNowListeningSchema } },
      required: true,
    },
  },
  responses: { 200: json('Heard', z.object({ ok: z.boolean() })), ...refused },
});

const reportNowReadingRoute = createRoute({
  method: 'post',
  path: '/api/books/now-reading',
  tags: ['Books'],
  summary: 'Say which book this device has open to read, so an administrator can see it',
  request: {
    body: { content: { 'application/json': { schema: ReportNowReadingSchema } }, required: true },
  },
  responses: { 200: json('Heard', z.object({ ok: z.boolean() })), ...refused },
});

export { reportNowListeningRoute, reportNowReadingRoute };
