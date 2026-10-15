import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { PersonSchema, PersonCreditsSchema } from '@ValenceContracts/schemas/Person';
import { PersonFoundSchema } from '@ValenceContracts/schemas/PersonFound';

const Person = PersonSchema.openapi('Person');
const PersonCredits = PersonCreditsSchema.openapi('PersonCredits');
const PersonError = RefusalSchema.openapi('PersonError');

const readPersonRoute = createRoute({
  method: 'get',
  path: '/api/people/{personId}',
  tags: ['People'],
  summary: 'Read what the catalogue knows about somebody',
  request: { params: z.object({ personId: z.coerce.number().int().positive() }) },
  responses: {
    200: {
      description: 'Who they are',
      content: { 'application/json': { schema: Person } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: PersonError } },
    },
    404: {
      description: 'The catalogue knows nobody by that identifier',
      content: { 'application/json': { schema: PersonError } },
    },
  },
});

const readPersonCreditsRoute = createRoute({
  method: 'get',
  path: '/api/people/{personId}/credits',
  tags: ['People'],
  summary: 'Read what of theirs is on this server',
  request: { params: z.object({ personId: z.coerce.number().int().positive() }) },
  responses: {
    200: {
      description: 'What this server holds that they are in',
      content: { 'application/json': { schema: PersonCredits } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: PersonError } },
    },
  },
});

const PeopleFound = z
  .object({ people: z.array(PersonFoundSchema.openapi('PersonFound')) })
  .openapi('PeopleFound');

const findPeopleRoute = createRoute({
  method: 'get',
  path: '/api/people',
  tags: ['People'],
  summary: 'Find the people in what this server holds by name',
  request: {
    query: z.object({
      search: z.string().trim().min(1).max(200),
      limit: z.coerce.number().int().positive().max(50).optional(),
    }),
  },
  responses: {
    200: {
      description: 'The people whose names match, those in the most titles first',
      content: { 'application/json': { schema: PeopleFound } },
    },
    401: {
      description: 'Nobody is signed in',
      content: { 'application/json': { schema: PersonError } },
    },
  },
});

export { findPeopleRoute, readPersonRoute, readPersonCreditsRoute };
