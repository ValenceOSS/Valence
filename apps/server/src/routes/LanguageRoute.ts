import { createRoute } from '@hono/zod-openapi';
import { LanguagesInUseSchema } from '@ValenceContracts/schemas/SpokenLanguage';

const LanguagesInUse = LanguagesInUseSchema.openapi('LanguagesInUse');

const readLanguagesRoute = createRoute({
  method: 'get',
  path: '/api/language',
  tags: ['Setup'],
  summary: 'Read the languages chosen for this server and for whoever is watching',
  responses: {
    200: {
      description:
        'The language the server speaks unless somebody chooses otherwise, and the language the profile watching chose, either of which is null where nobody chose one',
      content: { 'application/json': { schema: LanguagesInUse } },
    },
  },
});

export { readLanguagesRoute };
