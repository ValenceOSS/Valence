import { createRoute, z } from '@hono/zod-openapi';
import { UploadPiecesSchema, UploadStartedSchema } from '@ValenceContracts/schemas/UploadPieces';

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

const UploadStarted = UploadStartedSchema.openapi('UploadStarted');

const UploadPieces = UploadPiecesSchema.openapi('UploadPieces');

const OneUpload = z.object({ id: z.string().uuid(), uploadId: z.string().uuid() });

const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: UploadError } },
});

const startUploadRoute = createRoute({
  method: 'post',
  path: '/api/libraries/{id}/uploads/start',
  tags: ['Library'],
  summary:
    'Begin a file too large for one request, to be sent in pieces and finished once all have arrived',
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      path: z.string().min(1).max(2048),
      bytes: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    201: {
      description: 'Begun, with how large each piece is and how many there are',
      content: { 'application/json': { schema: UploadStarted } },
    },
    400: refused('A path that is not a plain path inside the library'),
    401: refused('Nobody is signed in'),
    403: refused('Not somebody who may edit libraries, or a place Valence may not write'),
    404: refused('No such library'),
    409: refused('Something of that name is already there'),
    415: refused('A file the library would not read'),
    500: refused('The upload could not be begun'),
  },
});

const uploadPieceRoute = createRoute({
  method: 'put',
  path: '/api/libraries/{id}/uploads/{uploadId}/pieces/{index}',
  tags: ['Library'],
  summary: 'Send one piece of an upload, streamed as the body; sending it again is harmless',
  request: {
    params: OneUpload.extend({ index: z.coerce.number().int().nonnegative() }),
  },
  responses: {
    200: {
      description: 'The piece arrived, and which pieces now have',
      content: { 'application/json': { schema: UploadPieces } },
    },
    400: refused('A piece that is not part of this upload, or not the size it should be'),
    401: refused('Nobody is signed in'),
    403: refused('Not somebody who may edit libraries, or a place Valence may not write'),
    404: refused('No such upload in this library'),
    500: refused('The piece could not be written'),
  },
});

const uploadStatusRoute = createRoute({
  method: 'get',
  path: '/api/libraries/{id}/uploads/{uploadId}',
  tags: ['Library'],
  summary: 'Which pieces of an upload have arrived, so one that was cut off can carry on',
  request: { params: OneUpload },
  responses: {
    200: {
      description: 'The pieces that have arrived',
      content: { 'application/json': { schema: UploadPieces } },
    },
    401: refused('Nobody is signed in'),
    403: refused('Not somebody who may edit libraries'),
    404: refused('No such upload in this library'),
  },
});

const finishUploadRoute = createRoute({
  method: 'post',
  path: '/api/libraries/{id}/uploads/{uploadId}/finish',
  tags: ['Library'],
  summary: 'Put an upload whose pieces have all arrived where its path says',
  request: { params: OneUpload },
  responses: {
    201: {
      description: 'The file was written where its path says',
      content: { 'application/json': { schema: UploadedSchema } },
    },
    400: refused('Pieces are still missing, or what arrived is not the size it was said to be'),
    401: refused('Nobody is signed in'),
    403: refused('Not somebody who may edit libraries, or a place Valence may not write'),
    404: refused('No such upload in this library'),
    409: refused('Something of that name is already there'),
    500: refused('The file could not be written'),
  },
});

const cancelUploadRoute = createRoute({
  method: 'delete',
  path: '/api/libraries/{id}/uploads/{uploadId}',
  tags: ['Library'],
  summary: 'Give up on an upload, throwing away whatever of it has arrived',
  request: { params: OneUpload },
  responses: {
    204: { description: 'Given up on, or never there' },
    401: refused('Nobody is signed in'),
    403: refused('Not somebody who may edit libraries'),
  },
});

export {
  cancelUploadRoute,
  finishUploadRoute,
  startUploadRoute,
  uploadMediaRoute,
  uploadPieceRoute,
  uploadStatusRoute,
};
