import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { FEWEST_IN_A_ROW } from '@ValenceServer/likeness/createLikenessService';
import {
  BecauseYouWatchedSchema,
  LIKE_THIS_SHOWN,
  LikeThisSchema,
} from '@ValenceContracts/schemas/Likeness';

const LikenessError = RefusalSchema.openapi('LikenessError');

const MOST_ASKED = 40;

const MOST_ROWS = 10;

const ROWS_SUGGESTED = 3;

const likeThisRoute = createRoute({
  method: 'get',
  path: '/api/media/{id}/like-this',
  tags: ['Library'],
  summary:
    'List the films and programmes in the libraries most like one, by what the catalogue says each is like',
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({
      limit: z.coerce.number().int().positive().max(MOST_ASKED).default(LIKE_THIS_SHOWN),
    }),
  },
  responses: {
    200: {
      description: 'The titles, most alike first, a programme by its first episode',
      content: { 'application/json': { schema: LikeThisSchema.openapi('LikeThis') } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: LikenessError } },
    },
    404: {
      description: 'No such item',
      content: { 'application/json': { schema: LikenessError } },
    },
  },
});

const becauseYouWatchedRoute = createRoute({
  method: 'get',
  path: '/api/because-you-watched',
  tags: ['Library'],
  summary:
    'Suggest rows of titles like those this profile watched lately, leaving out what it has already seen',
  request: {
    query: z.object({
      rows: z.coerce.number().int().positive().max(MOST_ROWS).default(ROWS_SUGGESTED),
      limit: z.coerce.number().int().min(FEWEST_IN_A_ROW).max(MOST_ASKED).default(LIKE_THIS_SHOWN),
    }),
  },
  responses: {
    200: {
      description: 'A row for each title watched lately that has enough like it, latest first',
      content: {
        'application/json': { schema: BecauseYouWatchedSchema.openapi('BecauseYouWatched') },
      },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: LikenessError } },
    },
  },
});

export { becauseYouWatchedRoute, likeThisRoute };
