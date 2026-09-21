import { createRoute, z } from '@hono/zod-openapi';

const UploadError = z.object({ error: z.string() }).openapi('UploadError');

const UploadedSchema = z
  .object({ path: z.string(), bytes: z.number().int().nonnegative() })
  .openapi('UploadedFile');

const uploadMediaRoute = createRoute({
  method: 'post',
  path: '/api/libraries/{id}/uploads',
  tags: ['Library'],
  summary: 'Upload one file into a library, streamed as the body of the request',
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ path: z.string().min(1).max(2048) }),
  },
  responses: {
    201: {
      description: 'The file was written where its path says',
      content: { 'application/json': { schema: UploadedSchema } },
    },
    400: {
      description: 'A path that is not a plain path inside the library, or no file sent',
      content: { 'application/json': { schema: UploadError } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: UploadError } },
    },
    403: {
      description:
        'Not somebody who may edit libraries, or a place Valence may not write, such as a disk mounted read-only',
      content: { 'application/json': { schema: UploadError } },
    },
    404: {
      description: 'No such library',
      content: { 'application/json': { schema: UploadError } },
    },
    409: {
      description: 'Something of that name is already there',
      content: { 'application/json': { schema: UploadError } },
    },
    415: {
      description: 'A file the library would not read',
      content: { 'application/json': { schema: UploadError } },
    },
    500: {
      description: 'The file could not be written',
      content: { 'application/json': { schema: UploadError } },
    },
  },
});

export { uploadMediaRoute };
