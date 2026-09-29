import { createRoute, z } from '@hono/zod-openapi';
import {
  CatalogueListingSchema,
  InstalledPluginSchema,
  InstalledPluginsSchema,
  InstallPreviewSchema,
  PluginActAnswerSchema,
  PluginContributionsSchema,
} from '@ValenceContracts/schemas/Plugin';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { SurfaceActRequestSchema } from '@ValenceSDK/surface/SurfaceActRequestSchema';

const PluginError = z.object({ error: z.string() }).openapi('PluginError');

const PluginId = z.string().regex(/^[a-z][a-z0-9-]{2,63}$/);

const LocalId = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);

const Installed = InstalledPluginSchema.openapi('InstalledPlugin');

const InstalledList = InstalledPluginsSchema.openapi('InstalledPlugins');

const Preview = InstallPreviewSchema.openapi('PluginInstallPreview');

const Surface = SurfaceSchema.openapi('PluginSurface');

const ActAnswer = PluginActAnswerSchema.openapi('PluginActAnswer');

const ActRequest = SurfaceActRequestSchema.openapi('PluginActRequest');

const refusals = {
  401: { description: 'Not signed in', content: { 'application/json': { schema: PluginError } } },
  403: {
    description: 'Not allowed to manage plugins',
    content: { 'application/json': { schema: PluginError } },
  },
};

const notFound = {
  404: {
    description: 'No such plugin, or not one enabled',
    content: { 'application/json': { schema: PluginError } },
  },
};

const listPluginsRoute = createRoute({
  method: 'get',
  path: '/api/plugins',
  tags: ['Plugins'],
  summary: 'List the installed plugins',
  responses: {
    200: {
      description: 'The installed plugins',
      content: { 'application/json': { schema: InstalledList } },
    },
    ...refusals,
  },
});

const readCatalogueRoute = createRoute({
  method: 'get',
  path: '/api/plugins/catalogue',
  tags: ['Plugins'],
  summary: 'Read the signed official plugin catalogue',
  responses: {
    200: {
      description: 'The catalogue',
      content: { 'application/json': { schema: CatalogueListingSchema } },
    },
    ...refusals,
  },
});

const previewCatalogueRoute = createRoute({
  method: 'post',
  path: '/api/plugins/catalogue/{id}/preview',
  tags: ['Plugins'],
  summary: 'Download and check a catalogue plugin, and show what it asks for before installing it',
  request: { params: z.object({ id: PluginId }) },
  responses: {
    200: {
      description: 'What installing it would mean',
      content: { 'application/json': { schema: Preview } },
    },
    422: {
      description: 'It could not be installed',
      content: { 'application/json': { schema: PluginError } },
    },
    ...refusals,
  },
});

const previewUploadRoute = createRoute({
  method: 'post',
  path: '/api/plugins/upload',
  tags: ['Plugins'],
  summary:
    'Check an uploaded .vplugin, sent as the body, with an optional signature in x-valence-signature',
  responses: {
    200: {
      description: 'What installing it would mean',
      content: { 'application/json': { schema: Preview } },
    },
    413: {
      description: 'Too large to be a plugin',
      content: { 'application/json': { schema: PluginError } },
    },
    422: {
      description: 'It could not be installed',
      content: { 'application/json': { schema: PluginError } },
    },
    ...refusals,
  },
});

const installPluginRoute = createRoute({
  method: 'post',
  path: '/api/plugins/install',
  tags: ['Plugins'],
  summary: 'Install a plugin that was previewed, accepting exactly the permissions shown',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z
            .object({
              token: z.string().min(1).max(200),
              acceptedPermissionsHash: z.string().min(1).max(100),
              acceptUnsigned: z.boolean().default(false),
            })
            .openapi('InstallPluginRequest'),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'The installed plugin',
      content: { 'application/json': { schema: Installed } },
    },
    422: {
      description: 'It could not be installed',
      content: { 'application/json': { schema: PluginError } },
    },
    ...refusals,
  },
});

const changePluginRoute = createRoute({
  method: 'patch',
  path: '/api/plugins/{id}',
  tags: ['Plugins'],
  summary: 'Turn a plugin on or off, or change its settings',
  request: {
    params: z.object({ id: PluginId }),
    body: {
      content: {
        'application/json': {
          schema: z
            .object({
              isEnabled: z.boolean().optional(),
              settings: z
                .record(z.string(), z.union([z.string(), z.boolean(), z.null()]))
                .optional(),
            })
            .openapi('ChangePluginRequest'),
        },
      },
    },
  },
  responses: {
    200: { description: 'The plugin', content: { 'application/json': { schema: Installed } } },
    422: {
      description: 'The change was refused',
      content: { 'application/json': { schema: PluginError } },
    },
    ...refusals,
    ...notFound,
  },
});

const receiveWebhookRoute = createRoute({
  method: 'post',
  path: '/api/plugins/{id}/hooks/{hook}/{secret}',
  tags: ['Plugins'],
  summary: 'Hand an outside service’s message to the plugin whose private address this is',
  request: {
    params: z.object({
      id: PluginId,
      hook: LocalId,
      secret: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
    }),
  },
  responses: {
    204: { description: 'The plugin took it' },
    404: {
      description: 'No plugin receives at this address',
      content: { 'application/json': { schema: PluginError } },
    },
    413: {
      description: 'The message is too large',
      content: { 'application/json': { schema: PluginError } },
    },
    429: {
      description: 'Too many messages; try again later',
      content: { 'application/json': { schema: PluginError } },
    },
    502: {
      description: 'The plugin could not handle it',
      content: { 'application/json': { schema: PluginError } },
    },
  },
});

const rollbackPluginRoute = createRoute({
  method: 'post',
  path: '/api/plugins/{id}/rollback',
  tags: ['Plugins'],
  summary: 'Put back the version an upgrade replaced, with what it kept as it was then',
  request: { params: z.object({ id: PluginId }) },
  responses: {
    200: { description: 'The plugin', content: { 'application/json': { schema: Installed } } },
    422: {
      description: 'There is no earlier version to go back to',
      content: { 'application/json': { schema: PluginError } },
    },
    ...refusals,
    ...notFound,
  },
});

const uninstallPluginRoute = createRoute({
  method: 'delete',
  path: '/api/plugins/{id}',
  tags: ['Plugins'],
  summary: 'Uninstall a plugin, forgetting what it kept and every account connected to it',
  request: { params: z.object({ id: PluginId }) },
  responses: { 204: { description: 'Uninstalled' }, ...refusals, ...notFound },
});

const contributionsRoute = createRoute({
  method: 'get',
  path: '/api/plugins/contributions',
  tags: ['Plugins'],
  summary: 'The pages, panels and themes the enabled plugins add',
  responses: {
    200: {
      description: 'What plugins add',
      content: { 'application/json': { schema: PluginContributionsSchema } },
    },
    401: refusals[401],
  },
});

const SubjectQuery = z.object({
  kind: z.enum(['title', 'series', 'album', 'artist', 'playlist']).optional(),
  subject: z.string().min(1).max(200).optional(),
});

const renderPageRoute = createRoute({
  method: 'get',
  path: '/api/plugins/{id}/pages/{page}',
  tags: ['Plugins'],
  summary: 'Draw one of a plugin’s pages for whoever is asking',
  request: { params: z.object({ id: PluginId, page: LocalId }) },
  responses: {
    200: { description: 'The page', content: { 'application/json': { schema: Surface } } },
    401: refusals[401],
    ...notFound,
  },
});

const actPageRoute = createRoute({
  method: 'post',
  path: '/api/plugins/{id}/pages/{page}/act',
  tags: ['Plugins'],
  summary: 'Act on one of a plugin’s pages',
  request: {
    params: z.object({ id: PluginId, page: LocalId }),
    body: { content: { 'application/json': { schema: ActRequest } } },
  },
  responses: {
    200: {
      description: 'The page as it is now, or where to go',
      content: { 'application/json': { schema: ActAnswer } },
    },
    401: refusals[401],
    ...notFound,
  },
});

const renderPanelRoute = createRoute({
  method: 'get',
  path: '/api/plugins/{id}/panels/{panel}',
  tags: ['Plugins'],
  summary: 'Draw one of a plugin’s panels beside something',
  request: { params: z.object({ id: PluginId, panel: LocalId }), query: SubjectQuery },
  responses: {
    200: { description: 'The panel', content: { 'application/json': { schema: Surface } } },
    401: refusals[401],
    ...notFound,
  },
});

const actPanelRoute = createRoute({
  method: 'post',
  path: '/api/plugins/{id}/panels/{panel}/act',
  tags: ['Plugins'],
  summary: 'Act on one of a plugin’s panels',
  request: {
    params: z.object({ id: PluginId, panel: LocalId }),
    query: SubjectQuery,
    body: { content: { 'application/json': { schema: ActRequest } } },
  },
  responses: {
    200: {
      description: 'The panel as it is now, or where to go',
      content: { 'application/json': { schema: ActAnswer } },
    },
    401: refusals[401],
    ...notFound,
  },
});

const pluginAssetRoute = createRoute({
  method: 'get',
  path: '/api/plugins/{id}/assets/{name}',
  tags: ['Plugins'],
  summary: 'A picture packed with a plugin',
  request: {
    params: z.object({ id: PluginId, name: z.string().regex(/^[a-z0-9-]+\.(png|jpg|webp)$/) }),
  },
  responses: {
    200: { description: 'The picture' },
    401: refusals[401],
    ...notFound,
  },
});

const pluginImageRoute = createRoute({
  method: 'get',
  path: '/api/plugins/{id}/image',
  tags: ['Plugins'],
  summary: 'A picture from a host the plugin may reach, fetched by the server',
  request: {
    params: z.object({ id: PluginId }),
    query: z.object({ url: z.string().url().max(2000) }),
  },
  responses: {
    200: { description: 'The picture' },
    401: refusals[401],
    ...notFound,
  },
});

const ConnectionPage = {
  'text/html': { schema: z.string().openapi({ description: 'A plain page saying what happened' }) },
};

const connectAccountRoute = createRoute({
  method: 'get',
  path: '/api/plugins/{id}/accounts/{provider}/connect',
  tags: ['Plugins'],
  summary:
    'Start connecting an outside account to a plugin, as the signed-in person or with the one-use ticket an action handed out',
  request: {
    params: z.object({ id: PluginId, provider: LocalId }),
    query: z.object({
      ticket: z.string().min(1).max(200).optional(),
      returnTo: z.string().max(500).optional(),
    }),
  },
  responses: {
    302: { description: 'Off to the provider' },
    422: { description: 'It cannot be connected', content: ConnectionPage },
  },
});

const finishConnectionRoute = createRoute({
  method: 'get',
  path: '/api/plugins/oauth/callback',
  tags: ['Plugins'],
  summary: 'Where a provider sends somebody back after connecting',
  request: {
    query: z.object({
      state: z.string().max(200).optional(),
      code: z.string().max(2000).optional(),
      error: z.string().max(200).optional(),
    }),
  },
  responses: {
    200: { description: 'Connected, with no Valence page to go back to', content: ConnectionPage },
    302: { description: 'Connected, and back to the Valence page it started on' },
    422: { description: 'It was not connected', content: ConnectionPage },
  },
});

const disconnectAccountRoute = createRoute({
  method: 'delete',
  path: '/api/plugins/{id}/accounts/{provider}',
  tags: ['Plugins'],
  summary: 'Disconnect an outside account from a plugin',
  request: { params: z.object({ id: PluginId, provider: LocalId }) },
  responses: { 204: { description: 'Disconnected' }, 401: refusals[401], ...notFound },
});

export {
  actPageRoute,
  actPanelRoute,
  changePluginRoute,
  connectAccountRoute,
  contributionsRoute,
  disconnectAccountRoute,
  finishConnectionRoute,
  installPluginRoute,
  listPluginsRoute,
  pluginAssetRoute,
  pluginImageRoute,
  previewCatalogueRoute,
  previewUploadRoute,
  readCatalogueRoute,
  receiveWebhookRoute,
  renderPageRoute,
  renderPanelRoute,
  rollbackPluginRoute,
  uninstallPluginRoute,
};
