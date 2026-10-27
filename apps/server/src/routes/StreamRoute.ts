import { createRoute, z } from '@hono/zod-openapi';
import { PlaybackProblemSchema } from '@ValenceContracts/schemas/PlaybackProblem';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  StreamOffersSchema,
  StreamPlaySchema,
  StreamPlayedSchema,
} from '@ValenceContracts/schemas/StreamOffer';

const StreamError = RefusalSchema.openapi('StreamError');

const StreamRefused = RefusalSchema.extend({ problem: PlaybackProblemSchema }).openapi(
  'StreamRefused',
);

const listStreamOffersRoute = createRoute({
  method: 'get',
  path: '/api/streams/films/{tmdbId}',
  tags: ['Streams'],
  summary: 'List what can play a film straight from the sources plugins offer',
  request: {
    params: z.object({ tmdbId: z.coerce.number().int().positive() }),
    query: z.object({ fresh: z.enum(['true', 'false']).optional() }),
  },
  responses: {
    200: {
      description: 'What can play the film, and which sources could not say',
      content: { 'application/json': { schema: StreamOffersSchema.openapi('StreamOffers') } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: StreamError } },
    },
    403: {
      description: 'This viewer may not play films from sources',
      content: { 'application/json': { schema: StreamError } },
    },
    404: {
      description: 'The catalogue has no such film',
      content: { 'application/json': { schema: StreamError } },
    },
  },
});

const playStreamRoute = createRoute({
  method: 'post',
  path: '/api/streams/play',
  tags: ['Streams'],
  summary: 'Play a film from one of the streams offered for it',
  request: {
    body: { content: { 'application/json': { schema: StreamPlaySchema.openapi('StreamPlay') } } },
  },
  responses: {
    200: {
      description: 'The film to play, or how far its source has got preparing it',
      content: { 'application/json': { schema: StreamPlayedSchema.openapi('StreamPlayed') } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: StreamError } },
    },
    403: {
      description: 'This viewer may not play films from sources, or may not watch this film',
      content: { 'application/json': { schema: StreamError } },
    },
    409: {
      description: 'The source would not play it',
      content: { 'application/json': { schema: StreamRefused } },
    },
    410: {
      description: 'That offer is no longer held; list the streams again',
      content: { 'application/json': { schema: StreamError } },
    },
  },
});

const readStreamedLibraryRoute = createRoute({
  method: 'get',
  path: '/api/streams/library',
  tags: ['Streams'],
  summary: 'Name the hidden library films played from sources are kept in',
  responses: {
    200: {
      description: 'Its id, for reading what somebody is part way through by id',
      content: {
        'application/json': {
          schema: z.object({ libraryId: z.string() }).openapi('StreamedLibrary'),
        },
      },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: StreamError } },
    },
    403: {
      description: 'Films are not played from sources here',
      content: { 'application/json': { schema: StreamError } },
    },
  },
});

export { listStreamOffersRoute, playStreamRoute, readStreamedLibraryRoute };
