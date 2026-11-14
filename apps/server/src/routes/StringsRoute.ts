import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { StringsSchema } from '@ValenceContracts/schemas/Strings';

const Strings = StringsSchema.openapi('Strings');
const StringsError = RefusalSchema.openapi('StringsError');

const readStringsRoute = createRoute({
  method: 'get',
  path: '/api/strings/{language}',
  tags: ['Setup'],
  summary: 'Read the words of a language Valence is translated into',
  request: { params: z.object({ language: z.string().min(1).max(16) }) },
  responses: {
    200: {
      description:
        'Every string the apps show, by handler, in that language; a string not yet translated is in English',
      content: { 'application/json': { schema: Strings } },
    },
    304: {
      description: 'The words have not changed since the tag the app sent',
    },
    404: {
      description: 'Valence is not translated into that language',
      content: { 'application/json': { schema: StringsError } },
    },
  },
});

export { readStringsRoute };
