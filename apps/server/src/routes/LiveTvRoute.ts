import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  LiveGuideChangeSchema,
  LiveGuideSchema,
  LiveSourceSchema,
  LiveSourcesSchema,
  LiveStreamSchema,
  NewLiveSourceSchema,
} from '@ValenceContracts/schemas/LiveTv';
import { IptvOrgCatalogueSchema } from '@ValenceContracts/schemas/IptvOrgCatalogue';

const LiveTvError = RefusalSchema.openapi('LiveTvError');

const LiveSource = LiveSourceSchema.openapi('LiveSource');

const IdParams = z.object({ id: z.string().uuid() });

/**
 * Describes a refusal one of these routes answers with.
 *
 * @param description - What the refusal means.
 * @returns The response's description.
 */
const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: LiveTvError } },
});

const listLiveSourcesRoute = createRoute({
  method: 'get',
  path: '/api/live/sources',
  tags: ['Live TV'],
  summary: 'Every live TV source an admin has added',
  responses: {
    200: {
      description: 'The sources',
      content: { 'application/json': { schema: LiveSourcesSchema.openapi('LiveSources') } },
    },
    403: refused('Not allowed to change the server’s settings'),
  },
});

const addLiveSourceRoute = createRoute({
  method: 'post',
  path: '/api/live/sources',
  tags: ['Live TV'],
  summary: 'Add a stream, a playlist by address or file, or a tuner, and read its channels',
  request: {
    body: {
      content: { 'application/json': { schema: NewLiveSourceSchema.openapi('NewLiveSource') } },
    },
  },
  responses: {
    201: {
      description: 'The source, as first read',
      content: { 'application/json': { schema: LiveSource } },
    },
    403: refused('Not allowed to change the server’s settings'),
  },
});

const removeLiveSourceRoute = createRoute({
  method: 'delete',
  path: '/api/live/sources/{id}',
  tags: ['Live TV'],
  summary: 'Remove a source, its channels and its guide',
  request: { params: IdParams },
  responses: {
    204: { description: 'Removed' },
    403: refused('Not allowed to change the server’s settings'),
    404: refused('No such source'),
  },
});

const refreshLiveSourceRoute = createRoute({
  method: 'post',
  path: '/api/live/sources/{id}/refresh',
  tags: ['Live TV'],
  summary: 'Read a source’s channels and guide again now',
  request: { params: IdParams },
  responses: {
    200: {
      description: 'The source, as read now',
      content: { 'application/json': { schema: LiveSource } },
    },
    403: refused('Not allowed to change the server’s settings'),
    404: refused('No such source'),
  },
});

const changeLiveGuideRoute = createRoute({
  method: 'put',
  path: '/api/live/sources/{id}/guide',
  tags: ['Live TV'],
  summary: 'Change the guides a source reads what is on from, and read it again',
  request: {
    params: IdParams,
    body: { content: { 'application/json': { schema: LiveGuideChangeSchema } } },
  },
  responses: {
    200: {
      description: 'The source, as read now',
      content: { 'application/json': { schema: LiveSource } },
    },
    403: refused('Not allowed to change the server’s settings'),
    404: refused('No such source'),
  },
});

const iptvOrgCatalogueRoute = createRoute({
  method: 'get',
  path: '/api/live/iptv-org',
  tags: ['Live TV'],
  summary: 'The countries and categories iptv-org publishes playlists for',
  responses: {
    200: {
      description: 'What can be added from iptv-org',
      content: {
        'application/json': { schema: IptvOrgCatalogueSchema.openapi('IptvOrgCatalogue') },
      },
    },
    403: refused('Not allowed to change the server’s settings'),
    502: refused('iptv-org could not be reached'),
  },
});

const liveGuideRoute = createRoute({
  method: 'get',
  path: '/api/live/guide',
  tags: ['Live TV'],
  summary: 'Every channel, and what is on each between two times',
  request: {
    query: z.object({
      from: z.string().datetime().optional(),
      until: z.string().datetime().optional(),
    }),
  },
  responses: {
    200: {
      description: 'The channels and their programmes',
      content: { 'application/json': { schema: LiveGuideSchema.openapi('LiveGuide') } },
    },
    401: refused('Nobody is signed in'),
  },
});

const keepLiveChannelRoute = createRoute({
  method: 'put',
  path: '/api/live/channels/{id}/favourite',
  tags: ['Live TV'],
  summary: 'Keep a channel as a favourite',
  request: { params: IdParams },
  responses: {
    204: { description: 'Kept' },
    401: refused('Nobody is signed in'),
    404: refused('No such channel'),
  },
});

const dropLiveChannelRoute = createRoute({
  method: 'delete',
  path: '/api/live/channels/{id}/favourite',
  tags: ['Live TV'],
  summary: 'Stop keeping a channel as a favourite',
  request: { params: IdParams },
  responses: {
    204: { description: 'Dropped' },
    401: refused('Nobody is signed in'),
  },
});

const watchLiveChannelRoute = createRoute({
  method: 'post',
  path: '/api/live/channels/{id}/watch',
  tags: ['Live TV'],
  summary: 'Where to play a channel from, through this server',
  request: { params: IdParams },
  responses: {
    200: {
      description: 'The stream’s address',
      content: { 'application/json': { schema: LiveStreamSchema.openapi('LiveStream') } },
    },
    401: refused('Nobody is signed in'),
    404: refused('No such channel'),
    502: refused('The channel could not be started'),
  },
});

export {
  addLiveSourceRoute,
  changeLiveGuideRoute,
  dropLiveChannelRoute,
  iptvOrgCatalogueRoute,
  keepLiveChannelRoute,
  listLiveSourcesRoute,
  liveGuideRoute,
  refreshLiveSourceRoute,
  removeLiveSourceRoute,
  watchLiveChannelRoute,
};
