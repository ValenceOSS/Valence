import { createRoute } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { SeerrLinkChangeSchema, SeerrLinkSchema } from '@ValenceContracts/schemas/SeerrLink';

const SeerrError = RefusalSchema.openapi('SeerrLinkError');

const Link = SeerrLinkSchema.openapi('SeerrLink');

const Change = SeerrLinkChangeSchema.openapi('SeerrLinkChange');

const refused = {
  400: {
    description: 'The account named is not one on this server',
    content: { 'application/json': { schema: SeerrError } },
  },
  403: {
    description: 'Linking Overseerr or Jellyseerr is for whoever manages requesting',
    content: { 'application/json': { schema: SeerrError } },
  },
};

const readSeerrLinkRoute = createRoute({
  method: 'get',
  path: '/api/requests/seerr',
  tags: ['Requests'],
  summary: 'Read how Overseerr or Jellyseerr reaches Valence as Radarr and Sonarr',
  responses: {
    200: {
      description: 'Whether it is on, its key, who its requests are made as, and the bases',
      content: { 'application/json': { schema: Link } },
    },
    ...refused,
  },
});

const changeSeerrLinkRoute = createRoute({
  method: 'put',
  path: '/api/requests/seerr',
  tags: ['Requests'],
  summary: 'Turn the Radarr and Sonarr stand-in on or off, and choose who its requests are made as',
  request: { body: { content: { 'application/json': { schema: Change } } } },
  responses: {
    200: {
      description: 'The link as saved; turning it on the first time makes its key',
      content: { 'application/json': { schema: Link } },
    },
    ...refused,
  },
});

const rotateSeerrKeyRoute = createRoute({
  method: 'post',
  path: '/api/requests/seerr/key',
  tags: ['Requests'],
  summary: 'Make a new key for Overseerr or Jellyseerr, so the old one stops working',
  responses: {
    200: {
      description: 'The link with its new key',
      content: { 'application/json': { schema: Link } },
    },
    ...refused,
  },
});

export { changeSeerrLinkRoute, readSeerrLinkRoute, rotateSeerrKeyRoute };
